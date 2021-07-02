export interface Msgs {
  common: {
    back: string;
    cancel: string;
    close: string;
    ok: string;
    datetime: (d: number) => string;
    pageTitle: string;
  };
  footer: {
    title: string;
  };
  error: {
    main: string;
    showErrors: string;
    close: string;
    datetime: (d: number) => string;
  };
  signIn: {
    pageTitle: string;
    googleBtn: string;
    twitterBtn: string;
    keepSignedIn: string;
  };
  home: {
    pageTitle: string;
    createAnnounceBtn: string;
    signOut: string;
    announces: {
      postCount: string;
      lastPostDate: string;
      postBtn: string;
      editBtn: string;
    };
    dataError: string;
    about: string;
  };
  about: {
    pageTitle: string;
    manualLink: string;
  };
  announce: {
    pageTitle: (s: string) => string;
    noPosts: string;
    dataError: string;
    newPost: string;
    newPostNavi: string;
    edit: string;
    showURL: string;
    showQRCode: string;
    downloadQRCode: string;
    openURL: string;
    copyURL: string;
  };
  announceCreate: {
    pageTitle: string;
    form: {
      name: string;
      desc: string;
      confirm: string;
      btn: string;
      done: string;
    };
  };
  announceEdit: {
    pageTitle: (s: string) => string;
    form: {
      name: string;
      desc: string;
      link: string;
      icon: string;
      iconPlaceholder: string;
      btn: string;
      done: string;
    };
    deletion: {
      guide: string;
      desc: string;
      btn: (s: string) => string;
      confirm: string;
    };
  };
  postForm: {
    pageTitle: (s: string) => string;
    title: string;
    body: string;
    lnik: string;
    img: string;
    btn: string;
  };
  post: {
    pageTitle: (s: string) => string;
    edit: string;
    delete: string;
    deleteConfirm: string;
  };
}
