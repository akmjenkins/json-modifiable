type Subscriber<T> = (arg: T) => void;

type EventMap<Events> = {
  [K in keyof Events]?: Set<Subscriber<Events[K]>>;
};

export class Emitter<Events> {
  private _map: EventMap<Events> = {};

  protected _emit<R extends keyof Events>(event: R, arg: Events[R]) {
    this._map[event]?.forEach((s) => s(arg));
  }

  on<R extends keyof Events>(event: R, subscriber: Subscriber<Events[R]>) {
    const set = this._map[event] ?? new Set();
    this._map[event] = set;
    set.add(subscriber);
    return () => set.delete(subscriber);
  }
}
