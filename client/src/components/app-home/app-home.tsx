import { Component, h, Host, Prop } from '@stencil/core';
import { App } from 'src/app/app';
import { Follow } from 'src/app/datatypes';
import { postIDtoMillis } from 'src/app/utils';

@Component({
  tag: 'app-home',
  styleUrl: 'app-home.scss',
})
export class AppHome {
  @Prop()
  app: App;

  private follows: [string, Follow][];

  private renderAnnounces() {
    return this.follows?.map(([id, follow]) => {
      const v = this.app.getAnnounceState(id);
      const hasNew = v.posts?.find(postID => {
        const pT = postIDtoMillis(postID);
        return pT > follow.readTime;
      });

      return (
        <a class="announce-box" {...this.app.href(`/${v.id}`)}>
          <div class="head">
            <div class="name-box">
              {hasNew && <span class="badge">{this.app.msgs.home.newBadge}</span>}
              <span class="name">{v.name}</span>
            </div>
            {v.iconData && <img src={v.iconData} />}
          </div>
          <span class="desc">{v.desc}</span>
        </a>
      );
    });
  }

  async componentWillLoad() {
    const follows = await this.app.getFollows();

    for (const [id] of follows) {
      await this.app.loadAnnounce(id);
    }

    this.follows = follows;
  }

  render() {
    return (
      <Host>
        <div class="announces-grid">{this.renderAnnounces()}</div>
      </Host>
    );
  }
}
