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
        toggle: 'アナウンスの削除',
        desc: 'アナウンスを削除します。この操作は元に戻せません。',
        btn: (s: string) => {
          return `"${s}"を削除する`;
        },
        confirm: 'アナウンスを削除します。よろしいですか？',
      },
    },
    post: {
      title: '投稿',
      editBtn: '編集',
      deleteBtn: '削除',
      import: '投稿を読み込む',
      form: {
        title: 'タイトル',
        body: '本文',
        link: 'リンク',
        image: '画像',
        imagePlaceholder: '画像のURL',
        published: '公開日時',
        postBtn: '投稿する',
        confirm: '投稿します。よろしいですか？',
        done: '投稿しました',
      },
      delete: {
        confirm: '投稿を削除します。よろしいですか？',
        done: '削除しました',
      },
    },
    import: {
      title: '投稿の読み込み',
      form: {
        url: 'URL',
        confirm: '投稿を読み込みます。よろしいですか？',
        preview: 'プレビュー',
        btn: '読み込み',
        done: '投稿を読み込みました',
      },
    },
  },
};
