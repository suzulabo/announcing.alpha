import { Component, h, Prop, State, Watch } from '@stencil/core';

@Component({
  tag: 'ap-image',
  styleUrl: 'ap-image.scss',
})
export class ApImage {
  @Prop()
  loader?: () => Promise<string>;

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
  src = '';

  @State()
  loaderError = false;

  componentWillLoad() {
    this.watchLoader(this.loader);
  }

  render() {
    if (this.loaderError) {
      return <ap-icon icon="exclamationDiamondFill" />;
    }

    if (this.src) {
      return <img src={this.src} />;
    }
    return <ap-spinner />;
  }
}
