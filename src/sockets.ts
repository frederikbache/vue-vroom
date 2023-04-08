import type Mocket from './server/Mocket';

type SubscriptionSettings = {
  model: string;
  ids: Array<string | number>;
  onUnsubscribe: () => void;
  onEmit?: (event: string, data: any) => void;
};

class Subscription {
  onUnsubscribe: () => void;
  onEmit?: (event: string, data: any) => void;
  listeners: { [key: string]: Array<(data: any) => void> };
  public model: string;
  public ids: Array<string | number>;

  constructor({ model, ids, onUnsubscribe, onEmit }: SubscriptionSettings) {
    this.onUnsubscribe = onUnsubscribe;
    this.onEmit = onEmit;
    this.model = model;
    this.ids = ids;
    this.listeners = {};
  }

  public on(event: string, handler: (data: any) => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(handler);
  }

  public handle(msg: any) {
    const handlers = this.listeners[msg.type] || [];
    // console.log('Subscription handle', type, item, handlers);
    // console.log('Handle', type, data, handlers, this.listeners);
    handlers.forEach((handler) => {
      handler(msg);
    });
  }

  public emit(event: string, data: any) {
    if (this.onEmit) {
      this.onEmit(event, data);
    }
  }

  public unsubscribe() {
    this.onUnsubscribe();
  }
}

type EventMessage = {
  subIds: Array<string | number>;
  type: string;
  data: any;
};

export default class Sockets<Models> {
  private subscriptions: Subscription[];
  private connection: Mocket<any, any> | WebSocket;
  private pongTimeout: NodeJS.Timeout | null;

  constructor(wsUrl = '', connection: Mocket<any, any>) {
    this.connection = connection || new WebSocket(wsUrl);
    this.subscriptions = [];
    this.pongTimeout = null;

    this.connection.addEventListener('message', (event: any) => {
      console.log('event', event);
      if (event.data === 'pong') {
        if (this.pongTimeout) clearTimeout(this.pongTimeout);
      } else {
        const message = JSON.parse(event.data);
        this.handleMessage(message as any as EventMessage);
      }
    });

    /* this.pongTimeout = null;
    this.connection.addEventListener('open', () => {
      setInterval(() => {
        this.sendPingPong();
      }, 10000);
    }); */
  }

  sendPingPong() {
    this.send('ping');

    this.pongTimeout = setTimeout(() => {
      console.log('Did not get pong back');
    }, 5000);
  }

  handleMessage(msg: any) {
    // console.log('Handle message', msg, this.subscriptions);
    this.subscriptions
      .filter(
        (subscription) =>
          subscription.model === msg.model && subscription.ids.includes(msg.id)
      )
      .forEach((subscription) => {
        subscription.handle(msg);
      });
    /* if (msg.subIds) {
      msg.subIds.forEach((i) => {
        this.subscriptions[i].handle(msg);
      });
    } */
  }

  send(msg: Object | string) {
    if (this.connection.readyState === 1) {
      this.connection.send(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } else {
      this.connection.addEventListener('open', () => {
        this.connection.send(
          typeof msg === 'string' ? msg : JSON.stringify(msg)
        );
      });
      // TODO remove the event listener again?
    }
  }

  public subscribeToModel(model: keyof Models, ids?: any[]) {
    const subscriptionId = Math.random();
    this.send({
      id: subscriptionId,
      subscribe: model,
      ids: ids,
    });

    const subscription = new Subscription({
      model: model as string,
      ids: ids as any,
      onUnsubscribe: () => {
        this.unsubscribe(subscriptionId);
      },
      /* onEmit: (event: string, id: any, data: any) => {
        this.send({
          type: event,
          model,
          id,
          data,
        });
      }, */
    });

    this.subscriptions.push(subscription);
    return subscription;
  }

  unsubscribe(id: string | number) {
    delete this.subscriptions[id as any];

    this.send({
      id: id,
      unsubscribe: 'any',
    });
  }
}
