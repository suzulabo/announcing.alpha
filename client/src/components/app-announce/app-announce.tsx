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
      const follow: Follow = { notify: { enable: false, hours: [] }, readTime: 0 };
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
