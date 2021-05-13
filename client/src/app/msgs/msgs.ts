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
    pageTitle: (s: string) => string;
    noPosts: string;
    followBtn: string;
    configBtn: string;
  };
  announceConfig: {
    unfollowBtn: string;
    unfollowConfirm: string;
    enable: string;
    hours: (hours: number[]) => string;
    hoursBtn: string;
    submitBtn: string;
  };
}
