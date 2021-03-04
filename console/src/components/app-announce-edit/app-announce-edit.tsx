import { Component, Fragment, h, Host, Prop, State } from '@stencil/core';
import { App } from 'src/app/app';
import { AnnounceState } from 'src/app/datatypes';

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
  values: { name?: string; desc?: string; link?: string; icon?: string; iconData?: string };

  private announce: AnnounceState;

  @State()
  showDeletion = false;

  @State()
  showDeleteConfirm = false;

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

  private handleImageChange = (ev: CustomEvent<string>) => {
    this.values = { ...this.values, icon: undefined, iconData: ev.detail };
  };

  private handleSubmitClick = async () => {
    this.app.loading = true;
    try {
      await this.app.editAnnounce(
        this.announceID,
        this.values.name,
        this.values.desc,
        this.values.link,
        this.values.icon,
        this.values.icon ? undefined : this.values.iconData?.split(',')[1],
      );
      this.app.pushRoute('/');
    } finally {
      this.app.loading = false;
    }
  };

  private handleDeletionToggleClick = () => {
    this.showDeletion = !this.showDeletion;
  };

  private handleDeletionClick = () => {
    this.showDeleteConfirm = true;
  };

  private handleDeleteModalClose = () => {
    this.showDeleteConfirm = false;
  };

  private handleDeleteClick = async () => {
    this.showDeleteConfirm = false;
    this.app.loading = true;
    try {
      await this.app.deleteAnnounce(this.announceID);
      this.app.pushRoute('/');
    } finally {
      this.app.loading = false;
    }
  };

  async componentWillLoad() {
    const as = await this.app.getAnnounceState(this.announceID);
    if (!as) {
      this.app.pushRoute('/');
      return;
    }

    this.announce = as;
    this.values = {
      name: as.name,
      desc: as.desc,
      link: as.link,
      icon: as.icon,
      iconData: as.iconData,
    };
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
      this.values.iconData != this.announce.iconData;

    return (
      <Host>
        <ap-image-input
          app={this.app}
          label={this.app.msgs.announceEdit.form.icon}
          data={this.values.iconData}
          resizeRect={{ width: 200, height: 200 }}
          onImageChange={this.handleImageChange}
        />
        <input
          placeholder={this.app.msgs.announceEdit.form.name}
          value={this.values.name}
          onInput={this.handleInput.name}
        />
        <textarea
          placeholder={this.app.msgs.announceEdit.form.desc}
          onInput={this.handleInput.desc}
        >
          {this.values.desc}
        </textarea>
        <input
          placeholder={this.app.msgs.announceEdit.form.link}
          value={this.values.link}
          onInput={this.handleInput.link}
        />
        <button disabled={!this.values.name || !modified} onClick={this.handleSubmitClick}>
          {this.app.msgs.announceEdit.form.btn}
        </button>
        <a {...this.app.href('/', true)}>{this.app.msgs.common.back}</a>
        <button class="clear deletion-toggle" onClick={this.handleDeletionToggleClick}>
          {this.app.msgs.announceEdit.deletion.guide}
        </button>
        {this.showDeletion && (
          <Fragment>
            <div>{this.app.msgs.announceEdit.deletion.desc}</div>
            <button onClick={this.handleDeletionClick}>
              {this.app.msgs.announceEdit.deletion.btn(this.announce.name)}
            </button>
          </Fragment>
        )}
        {this.showDeleteConfirm && (
          <ap-modal>
            <div class="delete-modal">
              <div>{this.app.msgs.announceEdit.deletion.confirm}</div>
              <div class="buttons">
                <button onClick={this.handleDeleteModalClose}>{this.app.msgs.common.cancel}</button>
                <button onClick={this.handleDeleteClick}>{this.app.msgs.common.ok}</button>
              </div>
            </div>
          </ap-modal>
        )}
      </Host>
    );
  }
}
