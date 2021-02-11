import { Merge } from 'type-fest';
import { Announce, AnnounceMeta, Post } from './datatypes';

type Timestamp = {
  toMillis: () => number;
};

type Announce_FS<TFieldValue> = Merge<
  Announce,
  { posts?: string[] | TFieldValue; uT: Timestamp | TFieldValue }
>;
type AnnounceMeta_FS<TFieldValue> = Merge<AnnounceMeta, { cT: Timestamp | TFieldValue }>;
type Post_FS<TFieldValue> = Merge<Post, { pT: Timestamp | TFieldValue }>;

abstract class ConverterBase<T, U> {
  fsType!: U;

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

export class AnnounceConverter<TFieldValue> extends ConverterBase<
  Announce,
  Announce_FS<TFieldValue>
> {
  fromFirebaseImpl(data: Announce_FS<TFieldValue>) {
    return {
      ...data,
      posts: data.posts as string[],
      uT: (data.uT as Timestamp).toMillis(),
    };
  }
}

export class AnnounceMetaConverter<TFieldValue> extends ConverterBase<
  AnnounceMeta,
  AnnounceMeta_FS<TFieldValue>
> {
  fromFirebaseImpl(data: AnnounceMeta_FS<TFieldValue>) {
    return {
      ...data,
      cT: (data.cT as Timestamp).toMillis(),
    };
  }
}

export class PostConverter<TFieldValue> extends ConverterBase<Post, Post_FS<TFieldValue>> {
  fromFirebaseImpl(data: Post_FS<TFieldValue>) {
    return {
      ...data,
      pT: (data.pT as Timestamp).toMillis(),
    };
  }
}
