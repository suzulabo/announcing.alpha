import { Component, h, Host, Prop, State } from '@stencil/core';
import { App } from 'src/app/app';
import { AnnounceState } from 'src/app/datatypes';
import { Post } from 'src/shared';
import { isURL } from 'src/utils/isurl';

@Component({
  tag: 'app-post-form',
  styleUrl: 'app-post-form.scss',
})
export class AppPostForm {
  @Prop()
  app: App;

  @Prop()
  announceID: string;

  @Prop()
  postID: string;

  @State()
  values: { title?: string; body?: string; link?: string; img?: string; imgData?: string };

  private announce: AnnounceState;
  private post: Post & { imgData?: string };

  private backPath: string;

  async componentWillLoad() {
    this.backPath = `/${this.announceID}` + (this.postID ? `/${this.postID}` : '');

    const as = await this.app.getAnnounceState(this.announceID);
    if (!as) {
      this.app.pushRoute(this.backPath, true);
      return;
    }

    this.announce = as;

    if (!this.postID) {
      this.values = {};
      return;
    }

    if (!as.posts?.includes(this.postID)) {
      this.app.pushRoute(this.backPath, true);
      return;
    }

    const post = await this.app.getPost(this.announceID, this.postID);
    if (!post) {
      this.app.pushRoute(this.backPath, true);
      return;
    }
    this.post = post;
    this.values = { ...post };

    if (post.img) {
      this.values.imgData = await this.app.getImage(post.img);
      this.post.imgData = this.values.imgData;
    }
  }

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
      this.app.pushRoute(this.backPath);
    } finally {
      this.app.loading = false;
    }
  };

  render() {
    if (!this.announce) {
      return;
    }

    let canSubmit = !!this.values.body && isURL(this.values.link);
    if (canSubmit && this.postID) {
      canSubmit =
        this.values.title != this.post.title ||
        this.values.body != this.post.body ||
        this.values.link != this.post.link ||
        this.values.imgData != this.post.imgData;
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
          maxLength={50}
          onInput={this.handleInput.title}
        />
        <ap-input
          textarea={true}
          label={this.app.msgs.postForm.body}
          value={this.values.body}
          maxLength={500}
          onInput={this.handleInput.body}
        />
        <ap-input
          label={this.app.msgs.postForm.lnik}
          value={this.values.link}
          maxLength={500}
          onInput={this.handleInput.link}
        />
        <button disabled={!canSubmit} onClick={this.handleSubmitClick}>
          {this.app.msgs.postForm.btn}
        </button>
        <a {...this.app.href(this.backPath, true)}>{this.app.msgs.common.back}</a>
      </Host>
    );
  }
}
