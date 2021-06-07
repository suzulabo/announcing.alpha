import { Component, h, Host, Prop } from '@stencil/core';
import { href } from '../utils/route';

export type ApNaviLinks = {
  label: string;
  href: string;
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
          return (
            <a class="link" {...href(v.href, v.back)}>
              {v.label}
            </a>
          );
        })}
      </Host>
    );
  }
}
