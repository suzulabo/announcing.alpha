import { Component, h, Host, Prop, State } from '@stencil/core';
import { App } from 'src/app/app';
import { AnnounceMetaRule } from 'src/shared';

@Component({
  tag: 'app-announce-create',
  styleUrl: 'app-announce-create.scss',
})
export class AppAnnounceCreate {
  @Prop()
  app: App;

  @State()
  values = { name: '', desc: '' };

  private handleInput = {
    name: (ev: Event) => {
      this.values = { ...this.values, name: (ev.target as HTMLInputElement).value };
    },
    desc: (ev: Event) => {
      this.values = { ...this.values, desc: (ev.target as HTMLTextAreaElement).value };
    },
  };

  componentWillLoad() {
    this.app.setTitle(this.app.msgs.announceCreate.pageTitle);
  }

  private handleSubmitClick = async () => {
    this.app.loading = true;
    try {
      await this.app.createAnnounce(this.values.name, this.values.desc);
      this.app.pushRoute('/');
    } finally {
      this.app.loading = false;
    }
  };

  render() {
    return (
      <Host>
        <ap-input
          label={this.app.msgs.announceCreate.form.name}
          value={this.values.name}
          maxLength={AnnounceMetaRule.name.length}
          onInput={this.handleInput.name}
        />
        <ap-input
          textarea={true}
          label={this.app.msgs.announceCreate.form.desc}
          value={this.values.desc}
          maxLength={AnnounceMetaRule.desc.length}
          onInput={this.handleInput.desc}
        />
        <button disabled={!this.values.name} onClick={this.handleSubmitClick}>
          {this.app.msgs.announceCreate.form.btn}
        </button>
        <a {...this.app.href('/', true)}>{this.app.msgs.common.back}</a>
      </Host>
    );
  }
}
