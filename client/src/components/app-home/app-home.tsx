import { Component, h, Host, Prop, State } from '@stencil/core';
import { App } from 'src/app/app';
import { Follow } from 'src/app/datatypes';

@Component({
  tag: 'app-home',
  styleUrl: 'app-home.scss',
})
export class AppHome {
  @Prop()
  app: App;

  @State()
  follows: [string, Follow][];

  async componentWillLoad() {
    await this.app.processLoading(async () => {
      this.app.setTitle(this.app.msgs.home.pageTitle);

      const follows = await this.app.getFollows();

      for (const [id, follow] of follows) {
        await this.app.loadAnnounce(id);
        const a = this.app.getAnnounceState(id);
        if (a && a.name != follow.name) {
          follow.name = a.name;
          await this.app.setFollow(id, follow);
        }
      }

      this.follows = follows;
    });
  }

  private handleUnfollowClick = async (event: Event) => {
    const id = (event.target as HTMLElement).getAttribute('data-announce-id');
    await this.app.deleteFollow(id);
    this.follows = await this.app.getFollows();
  };

  private renderAnnounces() {
    const msgs = this.app.msgs;

    return this.follows?.map(([id, follow]) => {
      const a = this.app.getAnnounceState(id);

      if (!a) {
        return (
          <div class="announce-box">
            <span>{msgs.home.deleted(follow.name)}</span>
            <button class="small unfollow" data-announce-id={id} onClick={this.handleUnfollowClick}>
              {msgs.home.unfollowBtn}
            </button>
          </div>
        );
      }

      const hasNew = Object.values(a.posts).find(v => {
        return v.pT.toMillis() > follow.readTime;
      });

      return (
        <a class="announce-box" {...this.app.href(`/${a.id}`)}>
          <div class="head">
            <div class="name-box">
              {hasNew && <span class="badge">{msgs.home.newBadge}</span>}
              <span class="name">{a.name}</span>
            </div>
            {a.iconData && <img src={a.iconData} />}
          </div>
          <span class="desc">{a.desc}</span>
        </a>
      );
    });
  }

  render() {
    if (this.follows.length == 0) {
      return <Host>{this.app.msgs.home.noFollows}</Host>;
    }

    return (
      <Host>
        <div class="announces-grid">{this.renderAnnounces()}</div>
      </Host>
    );
  }
}
