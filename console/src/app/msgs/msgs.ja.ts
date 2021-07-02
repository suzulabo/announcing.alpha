import { format } from 'date-fns';
import { Msgs } from './msgs';

const titleSuffix = 'Announcing♪ Console';

export const msgs: Msgs = {
  common: {
    back: '戻る',
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
  footer: {
    title: 'Announcing♪ Console',
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
  signIn: {
    pageTitle: `ログイン - ${titleSuffix}`,
    googleBtn: 'Googleでログイン',
    twitterBtn: 'Twitterでログイン',
    keepSignedIn: 'ログイン状態を保存',
  },
  home: {
    pageTitle: titleSuffix,
    createAnnounceBtn: 'アナウンスを作る',
    signOut: 'ログアウト',
    announces: {
      postCount: '投稿数',
      lastPostDate: '最終投稿',
      postBtn: '投稿',
      editBtn: '設定',
    },
    dataError: 'データの読み込み中にエラーが発生しました。\nしばらくしてから再度お試しください。',
    about: '使い方',
  },
  about: {
    pageTitle: `使い方 - ${titleSuffix}`,
    manualLink: '使い方サイトへ',
  },
  announce: {
    pageTitle: (s: string) => {
      return `${s} - ${titleSuffix}`;
    },
    noPosts: 'お知らせが投稿されていません',
    dataError: 'データの読み込み中にエラーが発生しました。\nしばらくしてから再度お試しください。',
    newPost: '新しいお知らせを投稿する',
    newPostNavi: '新しい投稿',
    edit: '編集する',
    showURL: 'URLを表示',
    showQRCode: 'QRコードを表示',
    downloadQRCode: 'QRコードをダウンロード',
    openURL: 'URLを開く',
    copyURL: 'URLをコピー',
  },
  announceCreate: {
    pageTitle: `アナウンスの作成 - ${titleSuffix}`,
    form: {
      name: 'アナウンス名',
      desc: '紹介文',
      confirm: '新しいアナウンスを登録します。よろしいですか？',
      btn: 'アナウンスを作成',
      done: '登録しました',
    },
  },
  announceEdit: {
    pageTitle: (s: string) => {
      return `${s} - 編集 - ${titleSuffix}`;
    },
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
      desc: 'アナウンスを削除します。\nこの操作は元に戻せません。',
      btn: (s: string) => {
        return `"${s}"を削除する`;
      },
      confirm: 'アナウンスを削除します。本当によろしいですか？',
    },
  },
  postForm: {
    pageTitle: (s: string) => {
      return `${s} - お知らせの投稿 - ${titleSuffix}`;
    },
    title: 'タイトル',
    body: '本文',
    lnik: 'リンク',
    img: '画像を追加',
    btn: '投稿する',
  },
  post: {
    pageTitle: (s: string) => {
      return `${s} - ${titleSuffix}`;
    },
    edit: '修正する',
    delete: '削除',
    deleteConfirm: 'お知らせを削除します。よろしいですか？',
  },
};
