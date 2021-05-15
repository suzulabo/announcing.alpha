export interface Msgs {
  common: {
    back: string;
    next: string;
    cancel: string;
    close: string;
    ok: string;
    am: string;
    pm: string;
    datetime: (d: number) => string;
    hour: (v: number) => string;
  };
  error: {
    main: string;
    showErrors: string;
    close: string;
    datetime: (d: number) => string;
  };
  footer: {
    title: string;
  };
  home: {
    pageTitle: string;
    newBadge: string;
    deleted: (name: string) => string;
    unfollowBtn: string;
  };
  announce: {
    pageTitle: (announceName: string) => string;
    noPosts: string;
    followBtn: string;
    configBtn: string;
  };
  announceConfig: {
    pageTitle: (announceName: string) => string;
    unfollowBtn: string;
    unfollowConfirm: string;
    enable: string;
    hours: (hours: number[]) => string;
    hoursBtn: string;
    submitBtn: string;
  };
  post: {
    pageTitle: (announceName: string, postTitle: string) => string;
    share: string;
  };
}
