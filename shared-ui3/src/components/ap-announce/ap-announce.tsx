import { Component, Fragment, h, Host, Prop } from '@stencil/core';
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
    href?: string;
    isFollow: boolean;
    enableNotification: boolean;
    showDetails?: boolean;
  };

  render() {
    const announce = this.announce;
    if (!announce) {
      return;
    }

    const Tag = announce.href ? 'a' : 'div';

    return (
      <Host>
        <Tag class="head" {...(announce.href && href(announce.href))}>
          <div class="name">
            <div class="icons">
              {announce.isFollow && <ap-icon icon="heart" />}
              {announce.enableNotification && <ap-icon icon="bell" />}
            </div>
            <span>{announce.name}</span>
          </div>
          {announce.iconLoader && <ap-image loader={announce.iconLoader} />}
        </Tag>
        {announce.showDetails && (
          <Fragment>
            {announce.desc && <div class="desc">{announce.desc}</div>}
            {announce.link && (
              <a class="link" href={announce.link}>
                {announce.link}
              </a>
            )}
          </Fragment>
        )}
      </Host>
    );
  }
}
