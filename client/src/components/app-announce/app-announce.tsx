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
    const follow: Follow = { notify: { mode: 'disabled', hours: [] }, readTime: 0 };
    await this.app.setFollow(this.announceID, follow);
    this.follow = follow;
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
        {this.follow && (
          <Fragment>
            <button onClick={this.handleNotifyClick}>notify</button>
            <button class="following clear" onClick={this.handleFollowingClick}>
              {this.app.msgs.announce.followingBtn}
            </button>
          </Fragment>
        )}
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
              <button onClick={this.handleFollowClick}>{this.app.msgs.announce.followBtn}</button>
            )}
          </div>
        </ap-announce>
        <a {...this.app.href('/', true)}>{this.app.msgs.common.back}</a>
      </Host>
    );
  }
}
