export const redirectRoute = (path: string) => {
  const url = new URL(path, location.href);
  if (location.href == url.href) {
    return;
  }

  history.replaceState(history.state, '', url.pathname);
  window.dispatchEvent(new PopStateEvent('popstate'));
};

export const pushRoute = (path: string, back?: boolean) => {
  const url = new URL(path, location.href);
  if (location.href == url.href) {
    return;
  }

  if (back && history.state?.beforeRoute == url.pathname) {
    history.back();
  } else {
    history.replaceState({ ...history.state, scrollY: window.scrollY }, '');
    history.pushState({ beforeRoute: location.pathname }, '', url.pathname);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
};

export const restoreScroll = () => {
  const scrollY = history.state?.scrollY;
  if (scrollY != null) {
    window.scroll(0, scrollY);
  }
};

const hrefCache = new Map<string, { href: string; onClick: (ev: MouseEvent) => void }>();

export const href = (p?: string, back?: boolean) => {
  if (!p) {
    return;
  }

  const k = `${p}\0${back ? 'back' : ''}`;

  {
    const v = hrefCache.get(k);
    if (v) return v;
  }
  {
    const v = {
      href: p,
      onClick: (ev: MouseEvent) => {
        // https://github.com/ionic-team/stencil-router-v2/blob/master/src/router.ts
        if (!ev.metaKey && !ev.ctrlKey && ev.which != 2 && ev.button != 1) {
          ev.preventDefault();
          pushRoute(p, back);
        }
      },
    };

    hrefCache.set(k, v);
    return v;
  }
};
