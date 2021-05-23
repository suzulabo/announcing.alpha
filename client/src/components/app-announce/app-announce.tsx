import { Component, Fragment, h, Host, Prop, State } from '@stencil/core';
import { App } from 'src/app/app';
import { FETCH_ERROR, Follow, NOT_FOUND } from 'src/app/datatypes';

@Component({
  tag: 'app-announce',
  styleUrl: 'app-announce.scss',
})
export class AppAnnounce {
  @Prop()
  app: App;

  @Prop()
  announceID: string;

  @State()
  follow: Follow;

  private announceName: string;

  async componentWillLoad() {
    this.app.loadAnnounce(this.announceID);
    this.follow = await this.app.getFollow(this.announceID);
    this.app.setTitle('');
  }

  private handleFollowClick = async () => {
    await this.app.processLoading(async () => {
      const follow: Follow = {
        name: this.announceName,
        readTime: Date.now(),
      };
      await this.app.setFollow(this.announceID, follow);
      this.follow = await this.app.getFollow(this.announceID);
    });
  };

  private postLoader = async (postID: string) => {
    const post = await this.app.fetchPost(this.announceID, postID);
    if (!post || post == FETCH_ERROR) {
      return;
    }

    await this.app.setReadTime(this.announceID, post.pT);

    return { ...post, anchorAttrs: this.app.href(`/${this.announceID}/${postID}`) };
  };

  render() {
    const msgs = this.app.msgs;

    const announce = this.app.getAnnounceState(this.announceID);

    if (!announce) {
      return;
    }

    if (announce == NOT_FOUND) {
      return (
        <Host>
          <div class="deleted">{msgs.announce.deleted}</div>
          <a {...this.app.href('/', true)}>{msgs.common.back}</a>
        </Host>
      );
    }

    if (announce == FETCH_ERROR) {
      return (
        <Host>
          <div class="fetch-error">{msgs.announce.fetchError}</div>
          <a {...this.app.href('/', true)}>{msgs.common.back}</a>
        </Host>
      );
    }

    const follow = this.follow;

    this.app.setTitle(this.app.msgs.announce.pageTitle(announce.name));

    return (
      <Host>
        <ap-announce
          announce={announce}
          postLoader={this.postLoader}
          msgs={{
            datetime: msgs.common.datetime,
            noPosts: msgs.announce.noPosts,
          }}
        >
          <div class="buttons" slot="bottomAnnounce">
            {!follow && (
              <button class="slim" onClick={this.handleFollowClick}>
                {msgs.announce.followBtn}
              </button>
            )}
            {follow && (
              <Fragment>
                <a class="button slim" {...this.app.href(`/${this.announceID}/config_`)}>
                  {msgs.announce.configBtn}
                </a>
              </Fragment>
            )}
          </div>
        </ap-announce>
        <a {...this.app.href('/', true)}>{msgs.common.back}</a>
      </Host>
    );
  }
}
