import { Component, Fragment, h, Host, Prop, State } from '@stencil/core';
import { App } from 'src/app/app';
import { Follow } from 'src/app/datatypes';

@Component({
  tag: 'app-home',
  styleUrl: 'app-home.scss',
})
export class AppHome {
  @Prop()
  app!: App;

  @State()
  follows!: [string, Follow][];

  async componentWillLoad() {
    await this.app.processLoading(async () => {
      this.app.setTitle(this.app.msgs.home.pageTitle);

      const follows = await this.app.getFollows();

      for (const [id] of follows) {
        this.app.loadAnnounce(id);
      }

      this.follows = follows;
    });
  }

  private handleUnfollowClick = async (event: Event) => {
    const id = (event.target as HTMLElement).getAttribute('data-announce-id');
    if (id) {
      await this.app.deleteFollow(id);
      this.follows = await this.app.getFollows();
    }
  };

  private renderAnnounces() {
    const msgs = this.app.msgs;

    const renderContent = (id: string, follow: Follow) => {
      const a = this.app.getAnnounceState(id);

      switch (a?.state) {
        case 'DATA_ERROR':
          return (
            <div class="announce-box">
              <div class="head">
                <div class="name-box">
                  <span class="name">{follow.name}</span>
                </div>
              </div>
              <span class="data-error">{msgs.home.dataError}</span>
              <button
                class="small unfollow"
                data-announce-id={id}
                onClick={this.handleUnfollowClick}
              >
                {msgs.home.unfollowBtn}
              </button>
            </div>
          );
        case 'NOT_FOUND':
          return (
            <div class="announce-box">
              <div class="head">
                <div class="name-box">
                  <span class="name">{follow.name}</span>
                </div>
              </div>
              <span class="deleted">{msgs.home.deleted}</span>
              <button
                class="small unfollow"
                data-announce-id={id}
                onClick={this.handleUnfollowClick}
              >
                {msgs.home.unfollowBtn}
              </button>
            </div>
          );
        case 'SUCCESS': {
          const hasNew = Object.values(a.value.posts).find(v => {
            return v.pT.toMillis() > follow.readTime;
          });

          return (
            <Fragment>
              {hasNew && <span class="badge">{msgs.home.newBadge}</span>}
              <span class="name">{a.value.name}</span>
              {a.value.iconLoader && <ap-image loader={a.value.iconLoader} />}
              <span class="desc">{a.value.desc}</span>
            </Fragment>
          );
        }
        default:
          return (
            <div class="announce-box">
              <ap-spinner />
            </div>
          );
      }
    };

    return this.follows?.map(([id, follow]) => {
      return (
        <ion-card href={`/${id}`}>
          <div class="announce-box">{renderContent(id, follow)}</div>
        </ion-card>
      );
    });
  }

  render() {
    if (this.follows.length == 0) {
      return <Host>{this.app.msgs.home.noFollows}</Host>;
    }

    return (
      <Host>
        <ion-content>
          <div class="content">
            <div class="announces-grid">{this.renderAnnounces()}</div>
          </div>
        </ion-content>
      </Host>
    );
  }
}
