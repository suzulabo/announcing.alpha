interface SetOptions {
  merge: boolean;
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

class CollectionRef {
  constructor(firestore: FakeFirestore, public parent: DocRef | undefined, public id: string) {}
}
class DocRef {
  constructor(private firestore: FakeFirestore, public parent: CollectionRef, public id: string) {}

  get() {
    return new DocSnapshot(this.firestore, this);
  }

  set(data: any, options?: { merge: boolean }) {
    const tree = getPathTree(this);
    tree.pop();
    let d = this.firestore.data;
    for (const p of tree) {
      if (!d[p]) {
        d[p] = {};
      }
      d = d[p];
    }
    if (options?.merge) {
      const cur = d[this.id];
      if (cur) {
        d[this.id] = { ...cur, data };
      } else {
        d[this.id] = { ...data };
      }
    } else {
      d[this.id] = { ...data };
    }
  }

  create(data: any) {
    if (this.get().exists) {
      throw new Error('exists');
    }
    this.set(data);
  }

  update(data: any) {
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

  set(ref: DocRef, data: any, options?: SetOptions) {
    this.updators.push(() => {
      ref.set(data, options);
    });
  }

  create(ref: DocRef, data: any) {
    this.updators.push(() => {
      ref.create(data);
    });
  }

  update(ref: DocRef, data: any) {
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
  constructor(public data: any = {}) {}

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
