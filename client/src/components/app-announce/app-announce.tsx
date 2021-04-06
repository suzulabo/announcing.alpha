import { Component, Fragment, h, Host, Listen, Prop, State } from '@stencil/core';
import { App } from 'src/app/app';
import { Follow } from 'src/app/datatypes';

const scrollPosMap = new Map<string, number>();

@Component({
  tag: 'app-announce',
  styleUrl: 'app-announce.scss',
})
export class AppAnnounce {
  @Listen('scroll', { target: 'window' })
  handleWindowScroll() {
    scrollPosMap.set(this.announceID, window.scrollY);
  }

  componentDidLoad() {
    if (scrollPosMap.has(this.announceID)) {
      window.scroll(0, scrollPosMap.get(this.announceID));
    }
  }

  @Prop()
  app: App;

  @Prop()
  announceID: string;

  @State()
  follow: Follow;

  async componentWillLoad() {
    this.app.loading = true;
    try {
      await this.app.loadAnnounce(this.announceID);

      this.follow = await this.app.getFollow(this.announceID);
    } finally {
      this.app.loading = false;
    }
  }

  private handleFollowClick = async () => {
    this.app.loading = true;
    try {
      const follow: Follow = { notify: { mode: 'disabled', hours: [] }, readTime: 0 };
      await this.app.setFollow(this.announceID, follow);
      this.follow = await this.app.getFollow(this.announceID);
    } finally {
      this.app.loading = false;
    }
  };

  private handleFollowingClick = async () => {
    await this.app.deleteFollow(this.announceID);
    this.follow = undefined;
  };

  private handleNotifyClick = async () => {
    await this.app.registerMessaging(this.announceID, 'always');
  };

  private postLoader = async (postID: string) => {
    const post = await this.app.fetchPost(this.announceID, postID);
    if (!post) {
      return;
    }
    return { ...post, anchorAttrs: this.app.href(`/${this.announceID}/${postID}`) };
  };

  render() {
    const announce = this.app.getAnnounceState(this.announceID);

    if (!announce) {
      return;
    }

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
            {!this.follow && (
              <button onClick={this.handleFollowClick}>{msgs.announce.followBtn}</button>
            )}
            {this.follow && (
              <Fragment>
                <button class="slim" onClick={this.handleNotifyClick}>
                  {msgs.announce.notifyBtn}
                </button>
                <button class="following slim" onClick={this.handleFollowingClick}>
                  {msgs.announce.followingBtn}
                </button>
              </Fragment>
            )}
          </div>
        </ap-announce>
        <a {...this.app.href('/', true)}>{msgs.common.back}</a>
      </Host>
    );
  }
}
