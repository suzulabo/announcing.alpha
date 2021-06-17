import { forceUpdate, getRenderingRef } from '@stencil/core';

export class LazyPromise<T> implements Promise<T> {
  constructor(private executor: () => Promise<T>) {}

  private _promise?: Promise<T>;

  private startPromise() {
    if (!this._promise) {
      this._promise = this.executor();
    }

    return this._promise;
  }

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.startPromise().then(onfulfilled, onrejected);
  }
  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null,
  ): Promise<T | TResult> {
    return this.startPromise().catch(onrejected);
  }
  finally(onfinally?: (() => void) | null): Promise<T> {
    return this.startPromise().finally(onfinally);
  }

  [Symbol.toStringTag] = 'LazyPromise';
}

type StatusResult<T> =
  | { state: 'pending' }
  | { state: 'rejected'; error: any }
  | { state: 'fulfilled-empty'; value: undefined }
  | { state: 'fulfilled'; value: Exclude<T, undefined> };

export class PromiseState<T> {
  private value?: T;
  private reason?: any;
  private _state: 'pending' | 'fulfilled' | 'fulfilled-empty' | 'rejected' = 'pending';
  private touched = false;
  private refs = new Set<any>();

  constructor(private promise: Promise<T | undefined>) {
    if (!(promise instanceof LazyPromise)) {
      this.touch();
    }
  }

  private touch() {
    if (!this.touched) {
      this.promise.then(
        v => {
          this._state = v == undefined ? 'fulfilled-empty' : 'fulfilled';
          this.value = v;
          this.refs.forEach(forceUpdate);
        },
        reason => {
          this._state = 'rejected';
          this.reason = reason;
          this.refs.forEach(forceUpdate);
        },
      );
      this.touched = true;
    }
  }

  status(): StatusResult<T> {
    this.touch();
    this.refs.add(getRenderingRef());
    switch (this._state) {
      case 'pending':
        return { state: 'pending' };
      case 'rejected':
        return { state: 'rejected', error: this.reason };
      case 'fulfilled':
        return { state: 'fulfilled', value: this.value as Exclude<T, undefined> };
      case 'fulfilled-empty':
        return { state: 'fulfilled-empty', value: undefined };
    }
  }

  state() {
    this.touch();
    this.refs.add(getRenderingRef());
    return this._state;
  }

  result() {
    this.touch();
    this.refs.add(getRenderingRef());
    return this.value;
  }

  error() {
    this.touch();
    this.refs.add(getRenderingRef());
    return this.reason;
  }
  noResult() {
    this.touch();
    this.refs.add(getRenderingRef());
    return this._state != 'pending' && this.value == undefined;
  }

  then(onfulfilled: (v: T | undefined) => void) {
    this.touch();
    this.promise.then(onfulfilled, () => {
      //
    });
  }
}

export class LazyPromiseState<T> extends PromiseState<T> {
  constructor(executor: () => Promise<T | undefined>) {
    super(new LazyPromise(executor));
  }
}

// Utility classes
export class _PendingPromiseState<T> extends PromiseState<T> {
  constructor() {
    super(
      new Promise<T>(() => {
        //
      }),
    );
  }
}
