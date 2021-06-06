import { Component, h, Host, Prop } from '@stencil/core';
import { DataResult, PostJSON } from 'src/shared';
import { href } from '../utils/route';

export type PostLaoderResult = DataResult<PostJSON> & { hrefAttrs?: Record<string, any> };

@Component({
  tag: 'ap-announce',
  styleUrl: 'ap-announce.scss',
})
export class ApAnnounce {
  @Prop()
  announce!: {
    name: string;
    desc?: string;
    iconLoader?: () => Promise<string>;
    link?: string;
    posts: Record<
      string,
      {
        pT: {
          toMillis: () => number;
        };
      }
    >;
    href: string;
    isFollow: boolean;
    enableNotification: boolean;
  };

  render() {
    const announce = this.announce;
    if (!announce) {
      return;
    }

    return (
      <Host>
        <a class="head" {...href(announce.href)}>
          <div class="name">
            <div class="icons">
              {announce.isFollow && <ap-icon icon="heart" />}
              {announce.enableNotification && <ap-icon icon="bell" />}
            </div>
            <span>{announce.name}</span>
          </div>
          {announce.iconLoader && <ap-image loader={announce.iconLoader} />}
        </a>
      </Host>
    );
  }
}
