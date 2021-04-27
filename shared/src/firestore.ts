/*
import { Announce, AnnounceMeta, Post, User } from './datatypes';

type Timestamp = {
  toMillis: () => number;
};

export class ConverterBase<T> {
  // not use
  toFirestore(o: any) {
    return o;
  }

  fromFirestore(snapshot: { data: (options: unknown) => unknown }, options?: unknown) {
    const data = snapshot.data(options);
    return this.fromFirebaseImpl(data);
  }

  fromFirebaseImpl(data: any): T {
    return data as T;
  }
}

export class AnnounceConverter extends ConverterBase<Announce> {
  fromFirebaseImpl(data: any): Announce {
    return {
      ...data,
      uT: (data.uT as Timestamp).toMillis(),
    };
  }
}

export class AnnounceMetaConverter extends ConverterBase<AnnounceMeta> {
  fromFirebaseImpl(data: any): AnnounceMeta {
    return {
      ...data,
      cT: (data.cT as Timestamp).toMillis(),
    };
  }
}

export class PostConverter extends ConverterBase<Post> {
  fromFirebaseImpl(data: any) {
    return {
      ...data,
      pT: (data.pT as Timestamp).toMillis(),
    };
  }
}

export class UserConverter extends ConverterBase<User> {
  fromFirebaseImpl(data: any): User {
    return { ...data };
  }
}
*/
