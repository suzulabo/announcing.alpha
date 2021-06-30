export interface Msgs {
  common: {
    back: string;
    next: string;
    cancel: string;
    close: string;
    ok: string;
    datetime: (d: number) => string;
    pageTitle: string;
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
    noFollows: string;
    newBadge: string;
    notFound: string;
    dataError: string;
    unfollowBtn: string;
    config: string;
    about: string;
  };
  config: {
    pageTitle: string;
    embedTwitter: string;
    embedTwitterDesc: string;
    embedYoutube: string;
    embedYoutubeDesc: string;
  };
  about: {
    pageTitle: string;
    manualLink: string;
  };
  announce: {
    pageTitle: (announceName: string) => string;
    deleted: string;
    dataError: string;
    noPosts: string;
    detail: string;
  };
  announceConfig: {
    pageTitle: (announceName: string) => string;
    followBtn: string;
    unfollowBtn: string;
    unfollowConfirm: string;
    enableNotifyBtn: string;
    disableNotifyBtn: string;
    unsupported: string;
    notPermitted: string;
  };
  post: {
    pageTitle: (announceName: string, postTitle: string) => string;
    deleted: string;
    share: string;
  };
}
