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
    this.app.setTitle(this.app.msgs.home.pageTitle);

    const follows = await this.app.getFollows();

    for (const [id] of follows) {
      this.app.loadAnnounce(id);
    }

    this.follows = follows;
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
          const latestPost = a.value.latestPost;
          const hasNew = (latestPost?.pT || 0) > follow.readTime;

          return (
            <Fragment>
              <div class="main">
                <span class="name">{a.value.name}</span>
                {latestPost && (
                  <div class="latest">
                    {hasNew && <span class="badge">{msgs.home.newBadge}</span>}
                    <span class="pT">{msgs.common.datetime(latestPost?.pT)}</span>
                    <span class="title">{latestPost.title || latestPost.body}</span>
                  </div>
                )}
              </div>
              {a.value.iconLoader && <ap-image loader={a.value.iconLoader} />}
            </Fragment>
          );
        }
        default:
          return <ion-spinner name="dots" />;
      }
    };

    return (
      <div class="announces">
        {this.follows?.map(([id, follow]) => {
          const a = this.app.getAnnounceState(id);
          return (
            <a class="card" {...{ ...(a?.state == 'SUCCESS' && this.app.href(`/${id}`)) }}>
              {renderContent(id, follow, a)}
            </a>
          );
        })}
      </div>
    );
  }

  private renderNofollows() {
    return <div class="no-follows">{this.app.msgs.home.noFollows}</div>;
  }

  render() {
    return (
      <Host>{this.follows.length == 0 ? this.renderNofollows() : this.renderAnnounces()}</Host>
    );
  }
}
