import { Component, h, Host, Prop, State } from '@stencil/core';
import { App } from 'src/app/app';
import { AnnounceState } from 'src/app/datatypes';
import { href } from 'stencil-router-v2';

@Component({
  tag: 'app-announce-edit',
  styleUrl: 'app-announce-edit.scss',
})
export class AppAnnounceEdit {
  @Prop()
  app: App;

  @Prop()
  announceID: string;

  @State()
  values: AnnounceState;

  @State()
  saving = false;

  private handleInput = {
    name: (ev: Event) => {
      this.values = { ...this.values, name: (ev.currentTarget as HTMLInputElement).value };
    },
    desc: (ev: Event) => {
      this.values = { ...this.values, desc: (ev.currentTarget as HTMLTextAreaElement).value };
    },
    link: (ev: Event) => {
      this.values = { ...this.values, link: (ev.currentTarget as HTMLInputElement).value };
    },
  };

  private handleSubmitClick = async () => {
    this.saving = true;
    try {
      await this.app.editAnnounce(
        this.announceID.toUpperCase(),
        this.values.name,
        this.values.desc,
        this.values.link,
      );
      this.app.pushRoute('/');
    } finally {
      this.saving = false;
    }
  };

  async componentWillLoad() {
    this.values = await this.app.getAnnounceState(this.announceID.toUpperCase());
    if (!this.values) {
      this.app.pushRoute('/');
    }
  }

  render() {
    if (!this.values) {
      return;
    }

    return (
      <Host>
        <header>{this.app.msgs.announce.edit.title}</header>
        <input
          placeholder={this.app.msgs.announce.edit.form.name}
          value={this.values.name}
          onInput={this.handleInput.name}
        />
        <textarea
          placeholder={this.app.msgs.announce.edit.form.desc}
          onInput={this.handleInput.desc}
        >
          {this.values.desc}
        </textarea>
        <input
          placeholder={this.app.msgs.announce.edit.form.link}
          value={this.values.link}
          onInput={this.handleInput.link}
        />
        <button disabled={!this.values.name} onClick={this.handleSubmitClick}>
          {this.app.msgs.announce.edit.form.btn}
        </button>
        <a {...href('/')}>{this.app.msgs.common.back}</a>
        {this.saving && <ap-loading />}
      </Host>
    );
  }
}
