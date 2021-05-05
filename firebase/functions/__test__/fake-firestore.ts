interface SetOptions {
  merge: boolean;
}
interface DocData {
  [name: string]: any;
}

const getPathTree = (ref: DocRef) => {
  const tree = [ref.id, ref.parent.id];
  while (ref.parent.parent) {
    ref = ref.parent.parent;
    tree.push('_collections', ref.id, ref.parent.id);
  }
  tree.reverse();
  return tree;
};

const copyData = (src: DocData, dst: DocData) => {
  Object.entries(src).forEach(([k, v]) => {
    if (typeof v == 'object') {
      if (Array.isArray(v)) {
        dst[k] = [...src[k]]; // should care object in array?
        return;
      }

      switch (v.constructor?.name) {
        case 'ServerTimestampTransform':
          dst[k] = new Date();
          return;
        case 'ArrayUnionTransform':
          const curArray = Array.isArray(dst[k]) ? dst[k] : [];
          dst[k] = [...new Set([...curArray, ...v.elements])];
          return;
        case 'ArrayRemoveTransform':
          const x = dst[k];
          if (Array.isArray(x)) {
            dst[k] = x.filter(a => {
              return !v.elements.includes(a);
            });
          } else {
            dst[k] = [];
          }
          return;
        case 'DeleteTransform':
          delete dst[k];
          return;
      }

      if (!dst[k]) {
        dst[k] = {};
      }
      copyData(src[k], dst[k]);
    } else {
      dst[k] = src[k];
    }
  });
};

class CollectionRef {
  constructor(firestore: FakeFirestore, public parent: DocRef | undefined, public id: string) {}
}
class DocRef {
  constructor(private firestore: FakeFirestore, public parent: CollectionRef, public id: string) {}

  get() {
    return new DocSnapshot(this.firestore, this);
  }

  set(data: DocData, options?: { merge: boolean }) {
    const tree = getPathTree(this);
    tree.pop();
    let d = this.firestore.data;
    for (const p of tree) {
      if (!d[p]) {
        d[p] = {};
      }
      d = d[p];
    }

    if (!d[this.id]) {
      d[this.id] = {};
    }

    const cur = d[this.id] || {};
    const dst = options?.merge ? { ...cur } : {};
    copyData(data, dst);
    d[this.id] = dst;
  }

  create(data: DocData) {
    if (this.get().exists) {
      throw new Error('exists');
    }
    this.set(data);
  }

  update(data: DocData) {
    if (this.get().exists) {
      this.set(data, { merge: true });
    }
  }

  delete() {
    const tree = getPathTree(this);
    tree.pop();
    let d = this.firestore.data;
    for (const p of tree) {
      d = d[p];
      if (!d) {
        return;
      }
    }
    delete d[this.id];
  }
}

class DocSnapshot {
  readonly exists: boolean;
  readonly id: string;
  constructor(private firestore: FakeFirestore, public ref: DocRef) {
    this.id = ref.id;
    this.exists = !!this.data();
  }

  data() {
    const tree = getPathTree(this.ref);

    let d = this.firestore.data;
    for (const p of tree) {
      d = d[p];
      if (!d) {
        return;
      }
    }
    return d;
  }
}

class Batch {
  private updators = [] as (() => void)[];
  constructor(firestore: FakeFirestore) {}

  set(ref: DocRef, data: DocData, options?: SetOptions) {
    this.updators.push(() => {
      ref.set(data, options);
    });
  }

  create(ref: DocRef, data: DocData) {
    this.updators.push(() => {
      ref.create(data);
    });
  }

  update(ref: DocRef, data: DocData) {
    this.updators.push(() => {
      ref.update(data);
    });
  }

  delete(ref: DocRef) {
    this.updators.push(() => {
      ref.delete();
    });
  }

  commit() {
    for (const f of this.updators) {
      f();
    }
  }
}

export class FakeFirestore {
  constructor(public data: DocData = {}) {}

  adminApp(): any {
    return {
      firestore: () => {
        return this;
      },
    };
  }

  doc(id: string) {
    const p = id.split('/');
    let docRef: DocRef | undefined = undefined;
    while (true) {
      const c = p.shift();
      const d = p.shift();
      if (!c || !d) {
        throw new Error(`invalid id: ${id}`);
      }
      docRef = new DocRef(this, new CollectionRef(this, docRef, c), d);
      if (p.length == 0) {
        return docRef;
      }
    }
  }

  batch() {
    return new Batch(this);
  }
}
