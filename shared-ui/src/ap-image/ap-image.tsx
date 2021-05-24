import { Component, h, Host, Prop, State, Watch } from '@stencil/core';

@Component({
  tag: 'ap-image',
  styleUrl: 'ap-image.scss',
})
export class ApImage {
  @Prop()
  loader?: () => Promise<string>;

  @Prop()
  canOpen = true;

  @Watch('loader')
  watchLoader(loader: ApImage['loader']) {
    if (loader) {
      this.src = '';
      this.loaderError = false;
      loader()
        .then(src => {
          if (loader == this.loader) {
            this.src = src;
          }
        })
        .catch(err => {
          console.error('ap-image loader error', err);
          if (loader == this.loader) {
            this.loaderError = true;
          }
        });
    }
  }

  @State()
  src?: string;

  @State()
  loaderError = false;

  @State()
  open = false;

  componentWillLoad() {
    this.watchLoader(this.loader);
  }

  private iamgeClick = () => {
    if (!this.canOpen) {
      return;
    }
    this.open = true;
  };

  private closeClick = () => {
    this.open = false;
  };

  private wrapperEl?: HTMLElement;
  private wrapperRef = (el?: HTMLElement) => {
    this.wrapperEl = el;
  };

  private wrapperClick = (ev: Event) => {
    if (ev.target == this.wrapperEl) {
      this.open = false;
    }
  };

  render() {
    if (this.loaderError) {
      return (
        <Host class="error">
          <ap-icon icon="exclamationDiamondFill" />
        </Host>
      );
    }

    if (this.src) {
      return (
        <Host class="loaded">
          <div
            class={{ wrapper: true, open: this.open }}
            ref={this.wrapperRef}
            onClick={this.wrapperClick}
          >
            <img class={{ ['can-open']: this.canOpen }} src={this.src} onClick={this.iamgeClick} />
            {this.open && <ap-icon onClick={this.closeClick} icon="xCircle" />}
          </div>
        </Host>
      );
    }
    return (
      <Host class="loading">
        <ap-icon icon="image" />
      </Host>
    );
  }
}
