import EventEmitter from 'events';


type EventHandler<T> = (data: T) => any;

export interface Subscription {
  unsubscribe: () => void;
}


export class EventDispose<T> {

  private ee = new EventEmitter();

  constructor(private eventName: string) { }

  emit(data: T): void {
    this.ee.emit(this.eventName, data);
  }

  subscribe(handler: EventHandler<T>): Subscription {
    this.ee.addListener(this.eventName, handler);

    return {
      unsubscribe: () => {
        this.ee.removeListener(this.eventName, handler);
      },
    };
  }

}
