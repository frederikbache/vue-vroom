type EventName = 'open' | 'close' | 'message';

export const socketChannel = new BroadcastChannel('socket:events');

let readyState = 0;

export default class Mocket<DbType, IdentityModel> {
  public listeners: { [key in EventName]?: Array<(event: Event) => void> };
  public subscriptions: Array<any>;
  public handlers: Array<any>;
  public readyState: number;
  private db: DbType;
  private identityModel: string;
  private identity: IdentityModel | null;

  constructor(db: DbType, identityModel: string) {
    this.listeners = {};
    this.subscriptions = [];
    this.handlers = [];
    this.readyState = 0;
    this.db = db;
    this.identityModel = identityModel;
    this.identity = null;

    setTimeout(() => {
      this.readyState = 1;
      readyState = 1;
      this.listeners.open?.forEach((h) => h({} as any));
    }, 150);

    socketChannel.onmessage = (ev: any) => {
      let subscribed = false;

      this.subscriptions.forEach((s) => {
        // console.log('Message received', ev, s);
        if (ev.data.event) {
          if (ev.data.event === s.event) subscribed = true;
        } else if (
          ev.data.model === s.model &&
          s.ids &&
          s.ids.includes(ev.data.id) &&
          (!s.events || s.events.includes(ev.data.type))
        ) {
          subscribed = true;
        }
      });

      if (!subscribed) return;
      const data = { ...ev.data };
      console.log('🔻', data, this.listeners.message?.length);
      this.listeners['message']?.forEach((handler) => {
        handler({
          data: JSON.stringify(data),
        });
      });
    };
  }

  public addEventListener(name: EventName, handler: (event: Event) => void) {
    if (!this.listeners[name]) {
      this.listeners[name] = [];
    }
    this.listeners[name]?.push(handler);
  }

  public removeEventListener(name: EventName, handler: (event: Event) => void) {
    this.listeners[name] = this.listeners[name]?.filter((h) => h !== handler);
  }

  public addHandler(
    model: string,
    type: string,
    handler: (data: any, db: DbType, identity: IdentityModel | null) => any
  ) {
    this.handlers.push({ model, type, handler });
  }

  public broadcast(data: Object) {
    this.send(JSON.stringify(data));
  }

  public send(data: string) {
    const object = JSON.parse(data);
    console.log('🟢:', object);
    if (object.subscribe) {
      this.subscriptions.push({
        id: object.id,
        model: object.subscribe,
        ids: object.ids,
        events: object.events || null,
      });
      console.log('Subscriptions are now', this.subscriptions);
    } else if (object.unsubscribe) {
      this.subscriptions = this.subscriptions.filter((s) => s.id !== object.id);
      console.log('Subscriptions are now', this.subscriptions);
    } else if (object.auth) {
      this.identity = this.db[this.identityModel].find(object.auth);
    } else {
      const handler = this.handlers.find(
        (h) => h.model === object.model && h.type === object.type
      );
      if (handler) sendMessage(handler.handler(object, this.db, this.identity));
      else {
        sendMessage(object);
      }
    }
  }
}

export function sendMessage(message: any) {
  if (readyState !== 1) return;
  socketChannel.postMessage(message);
}

/* const socketConnection = new Mocket();



export default socketConnection; */
