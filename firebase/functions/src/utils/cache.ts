export class Miss {
  constructor(readonly created: number = Date.now()) {}
}

export class Cache<T extends object> {
  constructor(private m = new Map<string, WeakRef<T | Miss>>()) {}
  set(k: string, v: T | Miss) {
    this.m.set(k, new WeakRef(v));
  }
  get(k: string): T | Miss | undefined {
    const ref = this.m.get(k);
    if (!ref) {
      return;
    }
    const v = ref.deref();
    if (!v) {
      this.m.delete(k);
    }
    return v;
  }
}
