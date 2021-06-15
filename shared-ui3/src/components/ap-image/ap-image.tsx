import { Component, h, Prop } from '@stencil/core';
import { PromiseState } from '../utils/promise';
import { href } from '../utils/route';

@Component({
  tag: 'ap-image',
  styleUrl: 'ap-image.scss',
})
export class ApImage {
  @Prop()
  srcPromise?: PromiseState<string>;

  @Prop()
  href?: string;

  render() {
    if (!this.srcPromise) {
      return;
    }

    if (this.srcPromise.error() != null) {
      return <ap-icon icon="exclamationDiamondFill" />;
    }

    const src = this.srcPromise.result();
    if (src) {
      if (this.href) {
        return (
          <a {...href(this.href)}>
            <img src={src} />
          </a>
        );
      } else {
        return <img src={src} />;
      }
    }

    return <ap-spinner />;
  }
}
