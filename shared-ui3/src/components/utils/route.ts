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
    history.pushState({ beforeRoute: location.pathname }, '', url.pathname);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
};
