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
    am: '午前',
    pm: '午後',
    datetime: (d: number) => {
      if (d > 0) {
        return format(d, 'yyyy/MM/dd H:mm');
      }
    },
    hour: (v: number) => {
      return `${v}時`;
    },
  },
  error: {
    main: 'ご迷惑をおかけします。\nしばらくしてから再度お試しください。',
    showErrors: 'エラー内容を表示',
    datetime: (d: number) => {
      if (d > 0) {
        return format(d, 'yyyy/MM/dd H:mm:ss');
      }
    },
  },
  footer: {
    title: 'Announcing♪ Client',
  },
  home: {
    pageTitle: titleSuffix,
    newBadge: '新着',
    deleted: (name: string) => {
      return `「${name}」は削除されました`;
    },
    unfollowBtn: 'フォローを解除する',
  },
  announce: {
    pageTitle: (announceName: string) => {
      return `${announceName} - ${titleSuffix}`;
    },
    noPosts: 'お知らせはまだありません',
    followBtn: 'フォローする',
    configBtn: '設定',
  },
  announceConfig: {
    pageTitle: (announceName: string) => {
      return `${announceName} - 設定 - ${titleSuffix}`;
    },
    unfollowBtn: 'フォローを解除',
    unfollowConfirm: 'フォローを解除します。よろしいですか？',
    enable: '通知を有効にする',
    hours: (hours: number[]) => {
      return `${hours.join('時,')}時に通知する`;
    },
    hoursBtn: '通知時刻を設定',
    submitBtn: '登録',
  },
  post: {
    pageTitle: (announceName: string, postTitle: string) => {
      return `${postTitle} - ${announceName} - ${titleSuffix}`;
    },
  },
};
