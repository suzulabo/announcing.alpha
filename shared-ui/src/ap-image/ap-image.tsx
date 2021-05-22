import { Component, h, Host, Prop, State } from '@stencil/core';

@Component({
  tag: 'ap-image',
  styleUrl: 'ap-image.scss',
})
export class ApImage {
  @Prop()
  loader: () => Promise<string>;

  @Prop()
  msgs: {
    error: string;
  };

  @State()
  src: string;

  @State()
  loaderError = false;

  componentWillLoad() {
    if (this.loader) {
      this.loader()
        .then(src => (this.src = src))
        .catch(err => {
          console.error('ap-image loader error', err);
          this.loaderError = true;
        });
    }
  }

  render() {
    if (this.loaderError) {
      return <Host>{this.msgs.error}</Host>;
    }

    if (this.src) {
      return (
        <Host class="loaded">
          <img src={this.src} />
        </Host>
      );
    }
    return <Host class="loading"></Host>;
  }
}
