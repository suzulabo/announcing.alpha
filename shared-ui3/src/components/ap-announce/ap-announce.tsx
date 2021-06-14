import { Component, Fragment, h, Host, Prop } from '@stencil/core';
import { Announce, AnnounceMetaBase } from 'src/shared';
import { PromiseState } from '../utils/promise';
import { href } from '../utils/route';

@Component({
  tag: 'ap-announce',
  styleUrl: 'ap-announce.scss',
})
export class ApAnnounce {
  @Prop()
  announce!: Announce & AnnounceMetaBase;

  @Prop()
  announceIcon?: PromiseState<string | undefined>;

  @Prop()
  showDetails?: boolean;

  @Prop()
  icons?: {
    isFollow: boolean;
    enableNotification: boolean;
  };

  @Prop()
  href?: string;

  render() {
    const announce = this.announce;
    if (!announce) {
      return;
    }

    const Tag = this.href ? 'a' : 'div';

    return (
      <Host>
        <Tag class="head" {...(this.href && href(this.href))}>
          <div class="name">
            <div class="icons">
              {this.icons?.isFollow && <ap-icon icon="heart" />}
              {this.icons?.enableNotification && <ap-icon icon="bell" />}
            </div>
            <span>{announce.name}</span>
          </div>
          {this.announceIcon && <ap-image srcPromise={this.announceIcon} />}
        </Tag>
        {this.showDetails && (
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
