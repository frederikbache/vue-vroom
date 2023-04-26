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
  private messageQueue: string[];
  private lastId: number;
  private mock: Mocket<any, any> | null;
  private wsUrl: string;

  constructor(wsUrl = '', mock: Mocket<any, any>) {
    this.wsUrl = wsUrl;
    this.mock = mock;
    this.subscriptions = [];
    this.messageQueue = [];
    this.pongTimeout = null;
    this.lastId = Math.random();
    this.connection = mock || new WebSocket(wsUrl);

    this.setupListeners();

    /* this.pongTimeout = null;
    this.connection.addEventListener('open', () => {
      setInterval(() => {
        this.sendPingPong();
      }, 10000);
    }); */
  }

  reconnect() {
    console.log('Reconnecting');
    this.connection = this.mock || new WebSocket(this.wsUrl);
  }

  sendPingPong() {
    this.send('ping');

    this.pongTimeout = setTimeout(() => {
      console.log('Did not get pong back');
      this.reconnect();
    }, 5000);
  }

  handleMessage(msg: any) {
    this.subscriptions
      .filter(
        (subscription) =>
          subscription.model === msg.model && subscription.ids.includes(msg.id)
      )
      .forEach((subscription) => {
        subscription.handle(msg);
      });
  }

  setupListeners() {
    this.connection.addEventListener('open', () => {
      this.sendMessages();
    });

    this.connection.addEventListener('message', (event: any) => {
      if (event.data === 'pong') {
        if (this.pongTimeout) clearTimeout(this.pongTimeout);
      } else {
        const message = JSON.parse(event.data);
        this.handleMessage(message as any as EventMessage);
      }
    });
  }

  sendMessages() {
    while (this.messageQueue.length) {
      const m = this.messageQueue.shift();
      this.connection.send(m as string);
    }
  }

  send(msg: Object | string) {
    const payload = typeof msg === 'string' ? msg : JSON.stringify(msg);
    this.messageQueue.push(payload);
    if (this.connection.readyState === 1) {
      this.sendMessages();
    }
  }

  generateId() {
    const x = Math.sin(this.lastId + 1) * 10000;
    this.lastId += 1;
    return (x - Math.floor(x)).toString(36).substring(7);
  }

  public subscribeToModel(model: keyof Models, ids?: any[]) {
    const subscriptionId = this.generateId();
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
