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
  private docMap = new Map<
    string,
    {
      unsubscribe?: () => void;
      listener?: Promise<{ data?: DocumentData }>;
      temporary?: boolean;
    }
  >();

  constructor(private firestore: FirebaseFirestore) {}

  async listenAndGet<T>(p: string, temporary?: boolean): Promise<T | undefined> {
    const docInfo = this.docMap.get(p) || {};
    const docRef = doc(this.firestore, p);

    if (!docInfo.listener) {
      docInfo.temporary = temporary;
      docInfo.listener = new Promise((resolve, reject) => {
        const value: { data?: DocumentData } = {};

        docInfo.unsubscribe = onSnapshot(docRef, {
          next: ds => {
            value.data = ds.data();
            resolve(value);

            window.dispatchEvent(
              new FirestoreUpdatedEvent({
                collection: docRef.parent.id,
                id: docRef.id,
                value: ds.data(),
              }),
            );
          },
          error: reason => {
            if (docInfo.unsubscribe) {
              docInfo.unsubscribe();
            }
            this.docMap.delete(p);
            reject(reason);
          },
        });
      });

      this.docMap.set(p, docInfo);
    }

    {
      const v = await getCache<T>(docRef);
      if (v) {
        return v;
      }
    }

    const v = await docInfo.listener;
    return v.data as T;
  }

  async getCacheFirst<T>(p: string) {
    const docRef = doc(this.firestore, p);
    {
      const v = await getCache(docRef);
      if (v) {
        return;
      }
    }

    const d = await getDocFromServer(docRef);
    return d.data() as T;
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
