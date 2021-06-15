import { Component, h, Host, Prop, State, Watch } from '@stencil/core';
import { App } from 'src/app/app';
import { Announce, AnnounceMetaBase, Post, PostRule } from 'src/shared';
import { PromiseState } from 'src/shared-ui/utils/promise';
import { href, pushRoute, redirectRoute } from 'src/shared-ui/utils/route';
import { isURL } from 'src/utils/isurl';

@Component({
  tag: 'app-post-form',
  styleUrl: 'app-post-form.scss',
})
export class AppPostForm {
  @Prop()
  app!: App;

  @Prop()
  announceID!: string;

  @Watch('announceID')
  watchAnnounceID() {
    this.announceState = undefined;
  }

  @State()
  announceState?: PromiseState<
    Announce &
      AnnounceMetaBase & {
        iconData?: string;
      }
  >;

  @Prop()
  postID!: string;

  @Watch('postID')
  watchPostID() {
    this.values = undefined;
  }

  @State()
  postState?: PromiseState<Post & { imgData?: string }>;

  @State()
  values?: { title?: string; body?: string; link?: string; img?: string; imgData?: string };

  private backPath!: string;

  private handleInput = {
    title: (ev: Event) => {
      this.values = { ...this.values, title: (ev.target as HTMLInputElement).value };
    },
    body: (ev: Event) => {
      this.values = { ...this.values, body: (ev.target as HTMLTextAreaElement).value };
    },
    link: (ev: Event) => {
      this.values = { ...this.values, link: (ev.target as HTMLInputElement).value };
    },
    img: (ev: CustomEvent<string>) => {
      this.values = { ...this.values, imgData: ev.detail };
    },
    resizing: (ev: CustomEvent<boolean>) => {
      this.app.loading = ev.detail;
    },
  };

  private handleSubmitClick = async () => {
    if (!this.values) {
      return;
    }
    this.app.loading = true;
    try {
      await this.app.putPost(
        this.announceID,
        this.values.title,
        this.values.body,
        this.values.link,
        this.values.imgData?.split(',')[1],
        this.postID,
      );
      pushRoute(`/${this.announceID}`);
    } finally {
      this.app.loading = false;
    }
  };

  componentWillRender() {
    if (!this.announceState) {
      this.backPath = `/${this.announceID}` + (this.postID ? `/${this.postID}` : '');

      this.announceState = new PromiseState(
        (async () => {
          const id = this.announceID;
          const a = await this.app.getAnnounceAndMeta(id);
          if (a) {
            return {
              ...a,
              iconData: a.icon ? await this.app.getImage(a.icon) : undefined,
            };
          }
          return;
        })(),
      );
    }

    if (!this.values) {
      if (!this.postID) {
        this.values = {};
        return;
      }
      this.postState = new PromiseState(
        (async () => {
          const id = this.announceID;
          const postID = this.postID;
          const post = await this.app.getPost(id, postID);
          if (post) {
            return {
              ...post,
              imgPromise: post.img ? new PromiseState(this.app.getImage(post.img)) : undefined,
            };
          }
          return;
        })(),
      );
      this.postState.then(post => {
        this.values = { ...post };
      });
    }
  }

  render() {
    if (!this.announceState || !this.values) {
      return;
    }

    if (this.announceState.error() || this.postState?.error()) {
      redirectRoute(this.backPath);
      return;
    }

    const announce = this.announceState.result();
    if (!announce) {
      return;
    }

    this.app.setTitle(this.app.msgs.postForm.pageTitle(announce.name));

    const values = this.values;

    let canSubmit = (values.title || values.body) && isURL(this.values.link);
    if (canSubmit && this.postID) {
      const post = this.postState?.result();
      if (!post) {
        return;
      }
      canSubmit =
        values.title != post.title ||
        values.body != post.body ||
        values.link != post.link ||
        values.imgData != post.imgData;
    }

    return (
      <Host>
        <ap-image-input
          resizeRect={{ width: 800, height: 800 }}
          data={this.values.imgData}
          onImageResizing={this.handleInput.resizing}
          onImageChange={this.handleInput.img}
        />
        <ap-input
          label={this.app.msgs.postForm.title}
          value={this.values.title}
          maxLength={PostRule.title.length}
          onInput={this.handleInput.title}
        />
        <ap-input
          textarea={true}
          label={this.app.msgs.postForm.body}
          value={this.values.body}
          maxLength={PostRule.body.length}
          onInput={this.handleInput.body}
        />
        <ap-input
          label={this.app.msgs.postForm.lnik}
          value={this.values.link}
          maxLength={PostRule.link.length}
          onInput={this.handleInput.link}
        />
        <button disabled={!canSubmit} onClick={this.handleSubmitClick}>
          {this.app.msgs.postForm.btn}
        </button>
        <a {...href(this.backPath, true)}>{this.app.msgs.common.back}</a>
      </Host>
    );
  }
}
