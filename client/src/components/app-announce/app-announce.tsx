import { Component, Fragment, h, Host, Prop, State } from '@stencil/core';
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
    this.app.setTitle('');
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
    if (post?.state != 'SUCCESS') {
      return;
    }

    await this.app.setReadTime(this.announceID, post.value.pT);

    return { ...post.value, anchorAttrs: this.app.href(`/${this.announceID}/${postID}`) };
  };

  render() {
    const msgs = this.app.msgs;

    const announce = this.app.getAnnounceState(this.announceID);

    switch (announce?.state) {
      case 'NOT_FOUND':
        return (
          <Host>
            <div class="deleted">{msgs.announce.deleted}</div>
            <a {...this.app.href('/', true)}>{msgs.common.back}</a>
          </Host>
        );
      case 'DATA_ERROR':
        return (
          <Host>
            <div class="fetch-error">{msgs.announce.fetchError}</div>
            <a {...this.app.href('/', true)}>{msgs.common.back}</a>
          </Host>
        );
      case 'SUCCESS': {
        const follow = this.follow;

        this.app.setTitle(this.app.msgs.announce.pageTitle(announce.value.name));

        return (
          <Host>
            <ap-announce
              announce={announce.value}
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
  }
}
