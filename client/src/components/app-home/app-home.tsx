import { Component, Fragment, h, Host, Prop, State } from '@stencil/core';
import { App } from 'src/app/app';
import { AnnounceState, DataResult, Follow } from 'src/app/datatypes';

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
      await this.app.processLoading(async () => {
        await this.app.deleteFollow(id);
        this.follows = await this.app.getFollows();
      });
    }
  };

  private renderAnnounces() {
    const msgs = this.app.msgs;

    const renderContent = (id: string, follow: Follow, a?: DataResult<AnnounceState>) => {
      switch (a?.state) {
        case 'NOT_FOUND':
        case 'DATA_ERROR':
          return (
            <div class="main">
              <span class="name">{follow.name}</span>
              <span class="data-error">
                {a.state == 'DATA_ERROR' ? msgs.home.dataError : msgs.home.notFound}
              </span>
              <ion-button
                size="small"
                fill="outline"
                data-announce-id={id}
                onClick={this.handleUnfollowClick}
              >
                {msgs.home.unfollowBtn}
              </ion-button>
            </div>
          );
        case 'SUCCESS': {
          const hasNew = Object.values(a.value.posts).find(v => {
            return v.pT.toMillis() > follow.readTime;
          });

          return (
            <Fragment>
              <div class="main">
                {hasNew && <ion-badge>{msgs.home.newBadge}</ion-badge>}
                <span class="name">{a.value.name}</span>
                <span class="desc">{a.value.desc}</span>
              </div>
              {a.value.iconLoader && <ap-image loader={a.value.iconLoader} />}
            </Fragment>
          );
        }
        default:
          return <ion-spinner name="dots" />;
      }
    };

    return this.follows?.map(([id, follow]) => {
      const a = this.app.getAnnounceState(id);
      return (
        <ion-card href={a?.state == 'SUCCESS' ? `/${id}` : undefined}>
          <div class="ap-card-content">{renderContent(id, follow, a)}</div>
        </ion-card>
      );
    });
  }

  private renderNofollows() {
    return <div class="no-follows">{this.app.msgs.home.noFollows}</div>;
  }

  render() {
    return (
      <Host>
        <ion-content>
          <div class="ap-content">
            {this.follows.length == 0 ? this.renderNofollows() : this.renderAnnounces()}
          </div>
        </ion-content>
      </Host>
    );
  }
}
