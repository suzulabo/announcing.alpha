import { format } from 'date-fns';

export const msgs = {
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
    title: 'Announcing',
  },
  home: {},
  announce: {
    noPosts: 'お知らせはまだありません',
    followBtn: 'フォローする',
    configBtn: '設定',
  },
  announceConfig: {
    unfollowBtn: 'フォローを解除',
    unfollowConfirm: 'フォローを解除します。よろしいですか？',
    enable: '通知を有効にする',
    hours: (hours: number[]) => {
      return `${hours.join('時,')}時に通知する`;
    },
    hoursBtn: '通知時刻を設定',
    submitBtn: '登録',
  },
};
