import socketConnection from './server/Mocket';

type ModelEvent = 'create' | 'update' | 'delete';
socketConnection;
export default class Sockets<Models> {
  private subscriptions: { [key: string]: () => void };
  private connection: typeof socketConnection | WebSocket;

  constructor(wsUrl = '') {
    this.connection = __DEV__ ? socketConnection : new WebSocket(wsUrl);
    this.subscriptions = {};

    this.connection.addEventListener('message', (message: Event) => {
      this.handleMessage(message);
    });
  }

  handleMessage(msg: Object) {
    if (msg.subIds) {
      msg.subIds.forEach((i) => {
        this.subscriptions[i](msg);
      });
    }
  }

  send(msg: Object) {
    if (this.connection.readyState === 1) {
      this.connection.send(JSON.stringify(msg));
    } else {
      this.connection.addEventListener('open', () => {
        this.connection.send(JSON.stringify(msg));
      });
      // TODO remove the event listener again?
    }
  }

  subscribeToModel(
    model: keyof Models,
    filter: any,
    cb: () => void,
    events?: ModelEvent[]
  ) {
    const socketEvents = events
      ? events.map((e) => 'db:' + e)
      : ['db:create', 'db:update', 'db:delete'];
    const subscriptionId = Math.random();
    this.send({
      id: subscriptionId,
      subscribe: model,
      filter: filter,
      events: socketEvents,
    });

    this.subscriptions[subscriptionId] = cb;
    return subscriptionId;
  }

  unsubscribe(id: string | number) {
    delete this.subscriptions[id];

    this.send({
      id: id,
      unsubscribe: 'any',
    });
  }
}
