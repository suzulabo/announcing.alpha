import { format } from 'date-fns';

export const msgs = {
  common: {
    back: '戻る',
    next: '次へ',
    cancel: 'キャンセル',
    close: '閉じる',
    ok: 'OK',
    or: 'または',
    datetime: (d: number) => {
      if (d > 0) {
        return format(d, 'yyyy/MM/dd H:mm');
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
    followingBtn: 'フォロー中',
  },
};
