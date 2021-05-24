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

  render() {
    if (this.loaderError) {
      return (
        <Host class="error">
          <ap-icon icon="exclamationDiamondFill" />
        </Host>
      );
    }

    if (this.src) {
      if (!this.open) {
        return (
          <Host class="loaded">
            <div class="wrapper">
              <img
                class={{ ['can-open']: this.canOpen }}
                src={this.src}
                onClick={this.iamgeClick}
              />
            </div>
          </Host>
        );
      } else {
        return (
          <Host class="loaded">
            <div class="wrapper open">
              <pinch-zoom>
                <img src={this.src} />
              </pinch-zoom>
              <ap-icon onClick={this.closeClick} icon="xCircle" />
            </div>
          </Host>
        );
      }
    }
    return (
      <Host class="loading">
        <ap-icon icon="image" />
      </Host>
    );
  }
}
