import { Merge } from 'type-fest';
import { Announce, AnnounceMeta, Post } from './datatypes';
import { StrictPropertyCheck } from './utils';

type Timestamp = {
  toMillis: () => number;
};

type Announce_FS<FieldValueT> = Merge<
  Announce,
  { posts?: string[] | FieldValueT; uT: Timestamp | FieldValueT }
>;
type AnnounceMeta_FS<FieldValueT> = Merge<AnnounceMeta, { cT: Timestamp | FieldValueT }>;
type Post_FS<FieldValueT> = Merge<Post, { pT: Timestamp | FieldValueT }>;

abstract class ConverterBase<T, U> {
  // not use
  toFirestore(o: any) {
    return o;
  }

  fromFirestore(snapshot: { data: (options: unknown) => unknown }, options?: unknown) {
    const data = snapshot.data(options) as U;
    return this.fromFirebaseImpl(data);
  }

  abstract fromFirebaseImpl(data: U): T;
}

class AnnounceConverter<FieldValueT> extends ConverterBase<Announce, Announce_FS<FieldValueT>> {
  fromFirebaseImpl(data: Announce_FS<FieldValueT>) {
    return {
      ...data,
      posts: data.posts as string[],
      uT: (data.uT as Timestamp).toMillis(),
    };
  }
}

class AnnounceMetaConverter<FieldValueT> extends ConverterBase<
  AnnounceMeta,
  AnnounceMeta_FS<FieldValueT>
> {
  fromFirebaseImpl(data: AnnounceMeta_FS<FieldValueT>) {
    return {
      ...data,
      cT: (data.cT as Timestamp).toMillis(),
    };
  }
}

class PostConverter<FieldValueT> extends ConverterBase<Post, Post_FS<FieldValueT>> {
  fromFirebaseImpl(data: Post_FS<FieldValueT>) {
    return {
      ...data,
      pT: (data.pT as Timestamp).toMillis(),
    };
  }
}

type DocRef = { id: string; path: string };

class FirestoreHelperBase<T> {
  set = <U extends T>(c: { set: (v: T) => Promise<unknown> }, v: U & StrictPropertyCheck<U, T>) => {
    return c.set(v);
  };
  update = <U extends Partial<T>>(
    c: { update: (v: Partial<T>) => Promise<unknown> },
    v: U & StrictPropertyCheck<U, T>,
  ) => {
    return c.update(v);
  };
  // transaction or batch
  setTB = <U extends T>(
    c: { set: (ref: any, v: T) => unknown },
    ref: DocRef,
    v: U & StrictPropertyCheck<U, T>,
  ) => {
    return c.set(ref, v);
  };
  updateTB = <U extends Partial<T>>(
    c: { update: (ref: any, v: Partial<T>) => unknown },
    ref: DocRef,
    v: U & StrictPropertyCheck<U, T>,
  ) => {
    return c.update(ref, v);
  };
  createTB = <U extends T>(
    c: { create: (ref: any, v: T) => unknown },
    ref: DocRef,
    v: U & StrictPropertyCheck<U, T>,
  ) => {
    return c.create(ref, v);
  };
}

export class AnnounceHelper<FieldValueT> extends FirestoreHelperBase<Announce_FS<FieldValueT>> {
  readonly converter = new AnnounceConverter<FieldValueT>();
}

export class AnnounceMetaHelper<FieldValueT> extends FirestoreHelperBase<
  AnnounceMeta_FS<FieldValueT>
> {
  readonly converter = new AnnounceMetaConverter<FieldValueT>();
}

export class PostHelper<FieldValueT> extends FirestoreHelperBase<Post_FS<FieldValueT>> {
  readonly converter = new PostConverter<FieldValueT>();
}
