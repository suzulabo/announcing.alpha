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
    title: 'announsing\u266A',
  },
  signIn: {
    title: 'ログイン',
    social: {
      google: 'Googleでログイン',
    },
  },
  home: {
    title: 'Home',
    signOut: 'ログアウト',
    announces: {
      postCount: '投稿数',
      lastPostDate: '最終投稿',
      postBtn: '投稿',
      editBtn: '設定',
    },
  },
  announce: {
    create: {
      title: '新規登録',
      form: {
        name: 'アナウンス名',
        desc: '紹介文',
        confirm: '新しいアナウンスを登録します。よろしいですか？',
        btn: 'アナウンスを作成',
        done: '登録しました',
      },
    },
    edit: {
      title: 'アナウンス編集',
      form: {
        name: 'アナウンス名',
        desc: '紹介文',
        link: 'ウェブサイト',
        icon: 'アイコン画像',
        iconPlaceholder: '画像のURLを入力してください',
        btn: '更新',
        done: '更新しました',
      },
      deletion: {
        guide: 'アナウンスの削除',
        desc: 'アナウンスを削除します。この操作は元に戻せません。',
        btn: (s: string) => {
          return `"${s}"を削除する`;
        },
        confirm: 'アナウンスを削除します。よろしいですか？',
      },
    },
  },
  post: {
    home: {
      title: '投稿',
    },
  },
};