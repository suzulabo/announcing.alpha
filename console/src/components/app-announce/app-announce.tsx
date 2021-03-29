import { Component, h, Host, Prop } from '@stencil/core';
import { App } from 'src/app/app';
import { AnnounceState } from 'src/app/datatypes';

@Component({
  tag: 'app-announce',
  styleUrl: 'app-announce.scss',
})
export class AppAnnounce {
  @Prop()
  app: App;

  @Prop()
  announceID: string;

  private announce: AnnounceState;

  async componentWillLoad() {
    const as = await this.app.getAnnounceState(this.announceID);
    if (!as) {
      this.app.pushRoute('/');
      return;
    }

    this.announce = as;
  }

  private postLoader = async (postID: string) => {
    const post = await this.app.getPost(this.announceID, postID);
    if (!post) {
      return;
    }
    return { ...post, anchorAttrs: this.app.href(`/${this.announceID}/${postID}`) };
  };

  render() {
    const msgs = this.app.msgs;

    return (
      <Host>
        <ap-announce
          announce={this.announce}
          postLoader={this.postLoader}
          msgs={{
            datetime: msgs.common.datetime,
            noPosts: msgs.announce.noPosts,
          }}
        >
          <div class="buttons" slot="bottomAnnounce">
            <a class="button small" {...this.app.href(`${this.announceID}/edit_`)}>
              {msgs.announce.edit}
            </a>
            <a class="button small">{msgs.announce.showURL}</a>
          </div>
          <a
            slot="beforePosts"
            class="button new-post"
            {...this.app.href(`${this.announceID}/post_`)}
          >
            {this.app.msgs.announce.newPost}
          </a>
        </ap-announce>
        <a {...this.app.href('/', true)}>{this.app.msgs.common.back}</a>
      </Host>
    );
  }
}
