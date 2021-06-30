import { format } from 'date-fns';
import { Msgs } from './msgs';

const titleSuffix = 'Announcing♪';

export const msgs: Msgs = {
  common: {
    back: '戻る',
    next: '次へ',
    cancel: 'キャンセル',
    close: '閉じる',
    ok: 'OK',
    datetime: (d: number) => {
      if (d > 0) {
        return format(d, 'yyyy/MM/dd H:mm');
      }
      return '';
    },
    pageTitle: titleSuffix,
  },
  error: {
    main: 'ご迷惑をおかけします。\nしばらくしてから再度お試しください。',
    showErrors: 'エラー内容を表示',
    close: '閉じる',
    datetime: (d: number) => {
      if (d > 0) {
        return format(d, 'yyyy/MM/dd H:mm:ss');
      }
      return '';
    },
  },
  footer: {
    title: 'Announcing♪ Client',
  },
  home: {
    pageTitle: titleSuffix,
    noFollows: 'フォローしているアナウンスはありません',
    newBadge: '新着',
    notFound: 'アナウンスのデータが見つかりませんでした',
    dataError: 'データの読み込み中にエラーが発生しました。\nしばらくしてから再度お試しください。',
    unfollowBtn: 'フォローを解除する',
    config: '設定',
    about: '使い方',
  },
  config: {
    pageTitle: `設定 - ${titleSuffix}`,
    embedTwitter: 'リンクのツイートを表示',
    embedTwitterDesc:
      'お知らせのリンクがTwitterのツイートのとき、アプリ内で表示します。\nこの動作にはTwitterのプライバシーポリシーが適用されます。\nhttps://twitter.com/privacy',
    embedYoutube: 'リンクのYoutubeを表示',
    embedYoutubeDesc:
      'お知らせのリンクがYoutubeの動画のとき、アプリ内で表示します。\nこの動作にはYoutubeのプライバシーポリシーが適用されます。\nhttps://www.youtube.com/static?template=terms',
  },
  about: {
    pageTitle: `使い方 - ${titleSuffix}`,
    manualLink: '使い方サイトへ',
  },
  announce: {
    pageTitle: (announceName: string) => {
      return `${announceName} - ${titleSuffix}`;
    },
    deleted: 'アナウンスのデータが見つかりませんでした',
    dataError: 'データの読み込み中にエラーが発生しました。\nしばらくしてから再度お試しください。',
    noPosts: 'お知らせはまだありません',
    detail: '詳細',
  },
  announceConfig: {
    pageTitle: (announceName: string) => {
      return `${announceName} - 設定 - ${titleSuffix}`;
    },
    followBtn: 'フォローする',
    unfollowBtn: 'フォローを解除',
    unfollowConfirm: 'フォローを解除します。よろしいですか？',
    enableNotifyBtn: '通知を有効にする',
    disableNotifyBtn: '通知を無効にする',
    unsupported: 'このブラウザで通知はご利用になれません',
    notPermitted: '通知が許可されていません\n設定をご確認ください',
  },
  post: {
    pageTitle: (announceName: string, postTitle: string) => {
      return `${postTitle} - ${announceName} - ${titleSuffix}`;
    },
    deleted: 'このお知らせは削除されました',
    share: 'シェアする',
  },
};
