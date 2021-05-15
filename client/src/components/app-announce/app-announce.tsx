import { Component, Fragment, h, Host, Prop, State } from '@stencil/core';
import { App } from 'src/app/app';
import { Follow } from 'src/app/datatypes';

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
    this.app.loading = true;
    try {
      await this.app.loadAnnounce(this.announceID);

      const a = this.app.getAnnounceState(this.announceID);
      if (!a) {
        return;
      }
      this.announceName = a.name;

      const follow = await this.app.getFollow(this.announceID);
      if (follow) {
        this.follow = follow;

        if (follow.name != a.name) {
          follow.name = a.name;
          await this.app.setFollow(this.announceID, follow);
        }
      }

      this.app.setTitle(this.app.msgs.announce.pageTitle(this.announceName));
    } finally {
      this.app.loading = false;
    }
  }

  private handleFollowClick = async () => {
    this.app.loading = true;
    try {
      const follow: Follow = {
        name: this.announceName,
        readTime: Date.now(),
      };
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

    await this.app.setReadTime(this.announceID, post.pT);

    return { ...post, anchorAttrs: this.app.href(`/${this.announceID}/${postID}`) };
  };

  render() {
    const msgs = this.app.msgs;

    const announce = this.app.getAnnounceState(this.announceID);

    if (!announce) {
      return (
        <Host>
          <div class="deleted">{msgs.announce.deleted}</div>
          <a {...this.app.href('/', true)}>{msgs.common.back}</a>
        </Host>
      );
    }

    const follow = this.follow;

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
