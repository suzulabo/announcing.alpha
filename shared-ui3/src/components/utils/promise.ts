import { forceUpdate, getRenderingRef } from '@stencil/core';

export class LazyPromise<T> implements PromiseLike<T> {
  constructor(private executor: () => Promise<T>) {}

  private _promise?: Promise<T>;

  private lazyFulfilled: ((value: T) => void)[] = [];
  private lazyRejected: ((reason: any) => void)[] = [];

  private startPromise() {
    if (!this._promise) {
      this._promise = this.executor();
    }

    this._promise.then(
      v => {
        this.lazyFulfilled.forEach(f => f(v));
        this.lazyFulfilled = [];
      },
      reason => {
        this.lazyRejected.forEach(f => f(reason));
        this.lazyRejected = [];
      },
    );

    return this._promise;
  }

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.startPromise().then(onfulfilled, onrejected);
  }

  lazyThen(onfulfilled?: (value: T) => void, onrejected?: (reason: any) => void): void {
    if (onfulfilled) this.lazyFulfilled.push(onfulfilled);
    if (onrejected) this.lazyRejected.push(onrejected);
  }
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

  constructor(private promise: PromiseLike<T | undefined>) {
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
          console.error('PromiseState error', reason);
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
  private lazyPromise: LazyPromise<T | undefined>;

  constructor(executor: () => Promise<T | undefined>) {
    const p = new LazyPromise(executor);
    super(p);
    this.lazyPromise = p;
  }

  lazyThen(onfulfilled?: (value: T | undefined) => void, onrejected?: (reason: any) => void): void {
    this.lazyPromise.lazyThen(onfulfilled, onrejected);
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
