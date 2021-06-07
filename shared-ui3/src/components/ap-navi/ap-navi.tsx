import { Component, h, Host, Prop } from '@stencil/core';
import { href } from '../utils/route';

export type ApNaviLinks = {
  label: string;
  href?: string;
  handler?: () => void;
  back?: boolean;
}[];

@Component({
  tag: 'ap-navi',
  styleUrl: 'ap-navi.scss',
})
export class ApNavi {
  @Prop()
  links!: ApNaviLinks;

  render() {
    return (
      <Host>
        {this.links.map(v => {
          if (v.href) {
            return (
              <a class="navi" {...href(v.href, v.back)}>
                {v.label}
              </a>
            );
          }
          if (v.handler) {
            return (
              <a class="navi" onClick={v.handler}>
                {v.label}
              </a>
            );
          }
        })}
      </Host>
    );
  }
}
