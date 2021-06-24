export class PageVisible {
  private _visible = true;
  private _skiped = false;

  setVisible(v: boolean) {
    this._visible = v;
  }

  shouldUpdate() {
    if (!this._visible) {
      this._skiped = true;
      return false;
    }
    return true;
  }

  isVisible() {
    return this._visible;
  }

  isSkiped() {
    return this._skiped;
  }
}
