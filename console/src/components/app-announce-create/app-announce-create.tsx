import { Component, h, Host, Prop, State } from '@stencil/core';
import { App } from 'src/app/app';
import { href } from 'stencil-router-v2';

@Component({
  tag: 'app-announce-create',
  styleUrl: 'app-announce-create.scss',
})
export class AppAnnounceCreate {
  @Prop()
  app: App;

  @State()
  values = { name: '', desc: '' };

  @State()
  saving = false;

  private handleInput = {
    name: (ev: Event) => {
      this.values = { ...this.values, name: (ev.currentTarget as HTMLInputElement).value };
    },
    desc: (ev: Event) => {
      this.values = { ...this.values, desc: (ev.currentTarget as HTMLTextAreaElement).value };
    },
  };

  private handleSubmitClick = async () => {
    this.saving = true;
    try {
      await this.app.createAnnounce(this.values.name, this.values.desc);
      this.app.pushRoute('/');
    } finally {
      this.saving = false;
    }
  };

  render() {
    return (
      <Host>
        <header>{this.app.msgs.announce.create.title}</header>
        <input
          placeholder={this.app.msgs.announce.create.form.name}
          value={this.values.name}
          onInput={this.handleInput.name}
        />
        <textarea
          placeholder={this.app.msgs.announce.create.form.desc}
          onInput={this.handleInput.desc}
        >
          {this.values.desc}
        </textarea>
        <button disabled={!this.values.name} onClick={this.handleSubmitClick}>
          {this.app.msgs.announce.create.form.btn}
        </button>
        <a {...href('/')}>{this.app.msgs.common.back}</a>
        {this.saving && <ap-loading />}
      </Host>
    );
  }
}
