import { Component, h, Host, Prop, State } from '@stencil/core';
import { App } from 'src/app/app';
import { AnnounceState } from 'src/app/datatypes';

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

  async componentWillLoad() {
    const as = await this.app.getAnnounceState(this.announceID.toUpperCase());
    if (!as) {
      this.app.pushRoute(`/${this.announceID}/${this.postID}`);
      return;
    }

    this.announce = as;

    this.values = {};
  }

  private handleInput = {
    title: (ev: Event) => {
      this.values = { ...this.values, title: (ev.currentTarget as HTMLInputElement).value };
    },
    body: (ev: Event) => {
      this.values = { ...this.values, body: (ev.currentTarget as HTMLTextAreaElement).value };
    },
    link: (ev: Event) => {
      this.values = { ...this.values, link: (ev.currentTarget as HTMLInputElement).value };
    },
    img: (ev: CustomEvent<string>) => {
      this.values = { ...this.values, imgData: ev.detail };
    },
  };

  private handleSubmitClick = async () => {
    this.app.loading = true;
    try {
      await this.app.putPost(
        this.announceID.toUpperCase(),
        this.values.title,
        this.values.body,
        this.values.link,
        this.values.imgData?.split(',')[1],
        null,
      );
      this.app.pushRoute(`/${this.announceID}`);
    } finally {
      this.app.loading = false;
    }
  };

  render() {
    if (!this.announce) {
      return;
    }

    const canSubmit = !!this.values.title && !!this.values.body;

    return (
      <Host>
        <ap-image-input
          app={this.app}
          resizeRect={{ width: 800, height: 800 }}
          data={this.values.imgData}
          onImageChange={this.handleInput.img}
        />
        <input
          placeholder={this.app.msgs.postForm.title}
          value={this.values.title}
          maxLength={50}
          onInput={this.handleInput.title}
        />
        <textarea
          placeholder={this.app.msgs.postForm.body}
          maxLength={500}
          onInput={this.handleInput.body}
        >
          {this.values.body}
        </textarea>
        <input
          placeholder={this.app.msgs.postForm.lnik}
          value={this.values.link}
          maxLength={500}
          onInput={this.handleInput.link}
        />
        <button disabled={!canSubmit} onClick={this.handleSubmitClick}>
          {this.app.msgs.postForm.btn}
        </button>
        <a {...this.app.href(`/${this.announceID}/${this.postID}`, true)}>
          {this.app.msgs.common.back}
        </a>
      </Host>
    );
  }
}
