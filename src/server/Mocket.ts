import { parseFilterField } from './handlers/helpers';
type EventName = 'open' | 'close' | 'message';

const bc = new BroadcastChannel('socket:events');

class Mocket {
  public listeners: { [key in EventName]?: Array<(event: Event) => void> };
  public subscriptions: Array<any>;
  public readyState: number;
  constructor() {
    this.listeners = {};
    this.subscriptions = [];
    this.readyState = 0;

    setTimeout(() => {
      this.readyState = 1;
      this.listeners.open?.forEach((h) => h({} as any));
    }, 150);
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

  public send(data: string) {
    const object = JSON.parse(data);
    if (object.subscribe) {
      this.subscriptions.push({
        id: object.id,
        model: object.subscribe,
        filter: object.filter,
        events: object.events || null,
      });
      console.log('Subscriptions are now', this.subscriptions);
    } else if (object.unsubscribe) {
      this.subscriptions = this.subscriptions.filter((s) => s.id !== object.id);
      console.log('Subscriptions are now', this.subscriptions);
    } else if (object.on) {
      this.subscriptions.push({
        id: object.id,
        event: object.on,
      });
    } else {
      sendMessage(object);
      console.log('WS: recieved', data);
    }
  }
}

const socketConnection = new Mocket();

export function sendMessage(message: any) {
  if (socketConnection.readyState !== 1) return;
  console.log('Sending message', message);
  bc.postMessage(message);
}

function checkIfItemMatchesFilter(item: any, filters: any) {
  let match = true;
  Object.entries(filters).forEach(([field, value]) => {
    const { name, fn } = parseFilterField(field);
    if (name in item && !fn(item[name], value)) match = false;
  });
  return match;
}

bc.onmessage = function (ev: any) {
  let subscribed = false;
  const subIds = [] as string[];
  socketConnection.subscriptions.forEach((s) => {
    if (ev.data.event) {
      if (ev.data.event === s.event) subscribed = true;
    } else if (
      ev.data.model === s.model &&
      checkIfItemMatchesFilter(ev.data.data, s.filter) &&
      (!s.events || s.events.includes(ev.data.type))
    ) {
      subIds.push(s.id);
      subscribed = true;
    }
  });
  if (!subscribed) return;
  const data = { ...ev.data, subIds };
  console.log('WS:', data, socketConnection.listeners.message?.length);
  socketConnection.listeners['message']?.forEach((handler) => {
    handler(data);
  });
};

export default socketConnection;
