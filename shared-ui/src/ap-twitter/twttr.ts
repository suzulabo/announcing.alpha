// https://developer.twitter.com/en/docs/twitter-for-websites/javascript-api/guides/set-up-twitter-for-websites

const _window = window as any;

_window.twttr = (() => {
  const d = document;
  const s = 'script';
  const id = 'twitter-wjs';
  const t = _window.twttr || {};
  if (d.getElementById(id)) return t;

  const head = d.getElementsByTagName('head')[0];
  const js = d.createElement(s);
  js.id = id;
  js.src = 'https://platform.twitter.com/widgets.js';
  head.appendChild(js);

  t._e = [];
  t.ready = function (f: unknown) {
    t._e.push(f);
  };

  return t;
})();

export const twttr = new Promise<any>(resolve => {
  _window.twttr.ready((twttr: any) => {
    resolve(twttr);
  });
});
