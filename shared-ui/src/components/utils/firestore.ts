import {
  doc,
  DocumentData,
  DocumentReference,
  FirebaseFirestore,
  getDocFromCache,
  getDocFromServer,
  onSnapshot,
} from 'firebase/firestore';

export class FirestoreUpdatedEvent extends CustomEvent<{
  collection: string;
  id: string;
  value?: DocumentData;
}> {
  constructor(detail: { collection: string; id: string; value?: DocumentData }) {
    super('FirestoreUpdated', { detail });
  }
}

export class FirestoreHelper {
  private listenerMap = new Map<
    string,
    {
      unsubscribe?: () => void;
      listener?: Promise<{ data?: DocumentData }>;
      temporary?: boolean;
    }
  >();

  constructor(private firestore: FirebaseFirestore) {}

  async listenAndGet<T>(
    p: string,
    shoudFireEvent?: (oldData: T, newData: T) => boolean,
    temporary?: boolean,
  ): Promise<T | undefined> {
    const docInfo = this.listenerMap.get(p) || {};
    const docRef = doc(this.firestore, p);

    if (!docInfo.listener) {
      docInfo.temporary = temporary;
      docInfo.listener = new Promise((resolve, reject) => {
        const value: { data?: T } = {};

        docInfo.unsubscribe = onSnapshot(docRef, {
          next: ds => {
            const oldData = value.data;
            const newData = ds.data() as T;

            value.data = newData;
            resolve(value);

            if (!oldData || !shoudFireEvent || shoudFireEvent(oldData, newData)) {
              window.dispatchEvent(
                new FirestoreUpdatedEvent({
                  collection: docRef.parent.id,
                  id: docRef.id,
                  value: ds.data(),
                }),
              );
            }
          },
          error: reason => {
            if (docInfo.unsubscribe) {
              docInfo.unsubscribe();
            }
            this.listenerMap.delete(p);
            reject(reason);
          },
        });
      });

      this.listenerMap.set(p, docInfo);
    }

    const v = await docInfo.listener;
    return v.data as T;
  }

  releaseListener() {
    this.listenerMap.forEach(v => {
      if (v.unsubscribe) v.unsubscribe();
    });
    this.listenerMap.clear();
  }

  async getCacheFirst<T>(p: string): Promise<T | undefined> {
    const docRef = doc(this.firestore, p);
    {
      const v = await getCache(docRef);
      if (v) {
        return v as T;
      }
    }

    const d = await getDocFromServer(docRef);
    return d.data() as T | undefined;
  }
}

const getCache = async <T>(docRef: DocumentReference): Promise<T | undefined> => {
  try {
    const doc = await getDocFromCache(docRef);
    if (doc.exists()) {
      return doc.data() as T;
    }
  } catch (err) {
    if (err.code == 'unavailable') {
      return;
    }
    throw err;
  }
  return;
};
