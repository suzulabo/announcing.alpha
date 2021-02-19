import { Component, h, Host, Prop } from '@stencil/core';
import { App } from 'src/app/app';
import { AnnounceState } from 'src/app/datatypes';
import { href } from 'stencil-router-v2';

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

  @Prop()
  values: { title?: string; body?: string; link?: string; img?: string };

  private announce: AnnounceState;

  async componentWillLoad() {
    const as = await this.app.getAnnounceState(this.announceID.toUpperCase());
    if (!as) {
      this.app.pushRoute('p');
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
  };

  private handleSubmitClick = async () => {
    this.app.loading = true;
    try {
      await this.app.putPost(
        this.announceID.toUpperCase(),
        this.values.title,
        this.values.body,
        this.values.link,
        null,
        null,
      );
      this.app.pushRoute('/');
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
        <input
          placeholder={this.app.msgs.post.form.title}
          value={this.values.title}
          maxLength={50}
          onInput={this.handleInput.title}
        />
        <textarea
          placeholder={this.app.msgs.post.form.body}
          maxLength={500}
          onInput={this.handleInput.body}
        >
          {this.values.body}
        </textarea>
        <input
          placeholder={this.app.msgs.post.form.lnik}
          value={this.values.link}
          maxLength={500}
          onInput={this.handleInput.link}
        />
        <button disabled={!canSubmit} onClick={this.handleSubmitClick}>
          {this.app.msgs.post.form.btn}
        </button>
        <a {...href('p')}>{this.app.msgs.common.back}</a>
      </Host>
    );
  }
}
