import { Component, Fragment, h, Host, Prop, State } from '@stencil/core';
import { App } from 'src/app/app';
import { AnnounceState } from 'src/app/datatypes';
import { resizeImage } from 'src/utils/image';
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
  values = { name: '', desc: '', link: '', icon: '' };

  @State()
  icon: string;

  private announce: AnnounceState;

  @State()
  showDeletion = false;

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

  private handleIcon = {
    fileInput: null as HTMLInputElement,
    ref: (el: HTMLInputElement) => {
      this.handleIcon.fileInput = el;
    },
    click: () => {
      this.handleIcon.fileInput.click();
    },
    change: async () => {
      this.app.loading = true;
      try {
        this.icon = await resizeImage(this.handleIcon.fileInput.files[0], 200, 200);
      } finally {
        this.app.loading = false;
      }
      this.handleIcon.fileInput.value = '';
    },
    delete: () => {
      this.icon = undefined;
      this.values = { ...this.values, icon: undefined };
    },
  };

  private handleSubmitClick = async () => {
    this.app.loading = true;
    try {
      await this.app.editAnnounce(
        this.announceID.toUpperCase(),
        this.values.name,
        this.values.desc,
        this.values.link,
        this.values.icon,
        this.icon?.split(',')[1],
      );
      this.app.pushRoute('/');
    } finally {
      this.app.loading = false;
    }
  };

  private handleDeletionToggleClick = () => {
    this.showDeletion = !this.showDeletion;
  };

  private handleDeletionClick = async () => {
    this.app.loading = true;
    try {
      await this.app.deleteAnnounce(this.announceID.toUpperCase());
      this.app.pushRoute('/');
    } finally {
      this.app.loading = false;
    }
  };

  async componentWillLoad() {
    const as = await this.app.getAnnounceState(this.announceID.toUpperCase());
    if (!as) {
      this.app.pushRoute('/');
      return;
    }

    this.announce = as;
    this.values = { name: as.name, desc: as.desc, link: as.link, icon: as.icon };
  }

  render() {
    if (!this.values) {
      return;
    }

    const modified =
      this.values.name != this.announce.name ||
      this.values.desc != this.announce.desc ||
      this.values.link != this.announce.link ||
      this.values.icon != this.announce.icon ||
      !!this.icon;

    const iconImg = this.icon || (this.values.icon ? this.announce.iconData : null);

    return (
      <Host>
        <header>{this.app.msgs.announce.edit.title}</header>
        <div class={{ 'icon': true, 'no-icon': !iconImg }} onClick={this.handleIcon.click}>
          {iconImg && <img src={iconImg} />}
          {!iconImg && <span>{this.app.msgs.announce.edit.form.icon}</span>}
          <ap-icon icon="image" />
          <input
            type="file"
            accept="image/*"
            ref={this.handleIcon.ref}
            onChange={this.handleIcon.change}
          />
        </div>
        {iconImg && (
          <button class="icon-del clear" onClick={this.handleIcon.delete}>
            <ap-icon icon="trash" />
          </button>
        )}
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
        <button disabled={!this.values.name || !modified} onClick={this.handleSubmitClick}>
          {this.app.msgs.announce.edit.form.btn}
        </button>
        <a {...href('/')}>{this.app.msgs.common.back}</a>
        <button class="clear deletion-toggle" onClick={this.handleDeletionToggleClick}>
          {this.app.msgs.announce.edit.deletion.guide}
        </button>
        {this.showDeletion && (
          <Fragment>
            <div>{this.app.msgs.announce.edit.deletion.desc}</div>
            <button onClick={this.handleDeletionClick}>
              {this.app.msgs.announce.edit.deletion.btn(this.announce.name)}
            </button>
          </Fragment>
        )}
      </Host>
    );
  }
}
