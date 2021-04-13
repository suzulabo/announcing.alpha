import { Component, Fragment, h, Host, Prop, State } from '@stencil/core';
import { App } from 'src/app/app';
import { Follow } from 'src/app/datatypes';
import { postIDtoMillis } from 'src/app/utils';

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

  private latestPostID: string;

  async componentWillLoad() {
    this.app.loading = true;
    try {
      await this.app.loadAnnounce(this.announceID);

      const follow = await this.app.getFollow(this.announceID);

      if (follow) {
        this.follow = follow;

        const a = this.app.getAnnounceState(this.announceID);
        if (a && a.posts) {
          const latestPostID = a.posts[a.posts.length - 1];
          if (latestPostID) {
            if (postIDtoMillis(latestPostID) > follow.readTime) {
              this.latestPostID = latestPostID;
            }
          }
        }
      }
    } finally {
      this.app.loading = false;
    }
  }

  private handleFollowClick = async () => {
    this.app.loading = true;
    try {
      const follow: Follow = { notify: { enable: false, hours: [] }, readTime: Date.now() };
      await this.app.setFollow(this.announceID, follow);
      this.follow = await this.app.getFollow(this.announceID);
    } finally {
      this.app.loading = false;
    }
  };

  private postLoader = async (postID: string) => {
    const post = await this.app.fetchPost(this.announceID, postID);
    if (!post) {
      return;
    }

    if (postID == this.latestPostID) {
      await this.app.setReadTime(this.announceID);
    }

    return { ...post, anchorAttrs: this.app.href(`/${this.announceID}/${postID}`) };
  };

  render() {
    const announce = this.app.getAnnounceState(this.announceID);

    if (!announce) {
      return;
    }

    const follow = this.follow;
    const msgs = this.app.msgs;

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
