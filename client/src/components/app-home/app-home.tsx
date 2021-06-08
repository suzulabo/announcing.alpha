import { Component, Fragment, h, Host, Prop } from '@stencil/core';
import { App } from 'src/app/app';
import { AnnounceState, Follow } from 'src/app/datatypes';
import { DataResult } from 'src/shared';
import { href } from 'src/shared-ui/utils/route';

@Component({
  tag: 'app-home',
  styleUrl: 'app-home.scss',
})
export class AppHome {
  @Prop()
  app!: App;

  componentWillLoad() {
    this.app.setTitle(this.app.msgs.home.pageTitle);

    const follows = this.app.getFollows();

    for (const [id] of follows) {
      this.app.loadAnnounce(id);
    }
  }

  private handleUnfollowClick = async (event: Event) => {
    const id = (event.target as HTMLElement).getAttribute('data-announce-id');
    if (id) {
      await this.app.processLoading(async () => {
        await this.app.deleteFollow(id);
      });
    }
  };

  private renderAnnounces() {
    const follows = [...this.app.getFollows()];

    if (follows.length == 0) {
      return this.renderNofollows();
    }

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
              <button class="anchor" data-announce-id={id} onClick={this.handleUnfollowClick}>
                {msgs.home.unfollowBtn}
              </button>
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
          return <ap-spinner />;
      }
    };

    return (
      <div class="announces">
        {follows?.map(([id, follow]) => {
          const a = this.app.getAnnounceState(id);
          return (
            <a class="card" {...{ ...(a?.state == 'SUCCESS' && href(`/${id}`)) }}>
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
    return <Host>{this.renderAnnounces()}</Host>;
  }
}
