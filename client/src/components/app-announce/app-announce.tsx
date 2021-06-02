import { Component, Fragment, h, Prop, State } from '@stencil/core';
import { App } from 'src/app/app';
import { Follow } from 'src/app/datatypes';

@Component({
  tag: 'app-announce',
  styleUrl: 'app-announce.scss',
})
export class AppAnnounce {
  @Prop()
  app!: App;

  @Prop()
  announceID!: string;

  @State()
  follow?: Follow;

  async componentWillLoad() {
    this.app.loadAnnounce(this.announceID);
    this.follow = await this.app.getFollow(this.announceID);
  }

  private handleFollowClick = async () => {
    await this.app.processLoading(async () => {
      const announce = this.app.getAnnounceState(this.announceID);
      if (announce?.state != 'SUCCESS') {
        return;
      }
      const follow: Follow = {
        name: announce.value.name,
        readTime: Date.now(),
      };
      await this.app.setFollow(this.announceID, follow);
      this.follow = await this.app.getFollow(this.announceID);
    });
  };

  private postLoader = async (postID: string) => {
    const post = await this.app.fetchPost(this.announceID, postID);
    if (post.state != 'SUCCESS') {
      return;
    }

    await this.app.setReadTime(this.announceID, post.value.pT);

    return { ...post.value, href: `/${this.announceID}/${postID}` };
  };

  render() {
    const msgs = this.app.msgs;

    const announce = this.app.getAnnounceState(this.announceID);

    const renderContent = () => {
      switch (announce?.state) {
        case 'NOT_FOUND':
          return (
            <Fragment>
              <div class="deleted">{msgs.announce.deleted}</div>
            </Fragment>
          );
        case 'DATA_ERROR':
          return (
            <Fragment>
              <div class="data-error">{msgs.announce.dataError}</div>
            </Fragment>
          );
        case 'SUCCESS': {
          this.app.setTitle(this.app.msgs.announce.pageTitle(announce.value.name));
          const follow = this.follow;

          return (
            <Fragment>
              <ap-announce
                announce={announce.value}
                postLoader={this.postLoader}
                msgs={{
                  datetime: msgs.common.datetime,
                  noPosts: msgs.announce.noPosts,
                  postDataError: msgs.announce.dataError,
                }}
              >
                <div class="buttons" slot="botom-announce">
                  {!follow && (
                    <button onClick={this.handleFollowClick}>{msgs.announce.followBtn}</button>
                  )}
                  {follow && (
                    <Fragment>
                      <a class="button" href={`/${this.announceID}/config`}>
                        {msgs.announce.configBtn}
                      </a>
                    </Fragment>
                  )}
                </div>
              </ap-announce>
            </Fragment>
          );
        }
        default:
          return <ap-spinner />;
      }
    };

    return (
      <ion-content>
        <div class="ap-content">
          {renderContent()}
          <ion-router-link class="back" href="/" routerDirection="back">
            {msgs.common.back}
          </ion-router-link>
        </div>
      </ion-content>
    );
  }
}
