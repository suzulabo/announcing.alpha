import { Component, Fragment, h, Host, Prop, State, Watch } from '@stencil/core';
import { App } from 'src/app/app';
import { Announce, AnnounceMetaBase, AnnounceMetaRule } from 'src/shared';
import { PromiseState } from 'src/shared-ui/utils/promise';
import { href, pushRoute, redirectRoute } from 'src/shared-ui/utils/route';
import { isURL } from 'src/utils/isurl';

@Component({
  tag: 'app-announce-edit',
  styleUrl: 'app-announce-edit.scss',
})
export class AppAnnounceEdit {
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

  @State()
  values!: { name?: string; desc?: string; link?: string; icon?: string; iconData?: string };

  @State()
  showDeletion = false;

  @State()
  showDeleteConfirm = false;

  private handleInput = {
    name: (ev: Event) => {
      this.values = { ...this.values, name: (ev.target as HTMLInputElement).value };
    },
    desc: (ev: Event) => {
      this.values = { ...this.values, desc: (ev.target as HTMLTextAreaElement).value };
    },
    link: (ev: Event) => {
      this.values = { ...this.values, link: (ev.target as HTMLInputElement).value };
    },
  };

  private handleImageResizing = (ev: CustomEvent<boolean>) => {
    this.app.loading = ev.detail;
  };

  private handleImageChange = (ev: CustomEvent<string>) => {
    this.values = { ...this.values, icon: undefined, iconData: ev.detail };
  };

  private handleSubmitClick = async () => {
    if (!this.values.name) {
      return;
    }
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
      pushRoute(`/${this.announceID}`);
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
      pushRoute('/');
    } finally {
      this.app.loading = false;
    }
  };

  private async loadAnnounce() {
    const id = this.announceID;
    const a = await this.app.getAnnounceAndMeta(id);
    if (a) {
      return {
        ...a,
        iconData: a.icon ? await this.app.getImage(a.icon) : undefined,
      };
    }
    return;
  }

  componentWillRender() {
    if (!this.announceState) {
      this.announceState = new PromiseState(this.loadAnnounce());
      this.announceState.then(a => {
        if (a) {
          this.values = {
            name: a.name,
            desc: a.desc,
            link: a.link,
            icon: a.icon,
            iconData: a.iconData,
          };
        }
      });
    }
  }

  render() {
    switch (this.announceState?.state()) {
      case 'pending':
        return <ap-spinner />;
      case 'rejected':
        redirectRoute(`/${this.announceID}`);
        return;
    }

    const announce = this.announceState?.result();
    if (!announce) {
      redirectRoute(`/${this.announceID}`);
      return;
    }

    this.app.setTitle(this.app.msgs.announceEdit.pageTitle(announce.name));

    const modified =
      this.values.name != announce.name ||
      this.values.desc != announce.desc ||
      this.values.link != announce.link ||
      this.values.icon != announce.icon ||
      this.values.iconData != announce.iconData;

    const canSubmit = !!this.values.name && isURL(this.values.link) && modified;

    return (
      <Host>
        <ap-image-input
          label={this.app.msgs.announceEdit.form.icon}
          data={this.values.iconData}
          resizeRect={{ width: 200, height: 200 }}
          onImageResizing={this.handleImageResizing}
          onImageChange={this.handleImageChange}
        />
        <ap-input
          label={this.app.msgs.announceEdit.form.name}
          value={this.values.name}
          onInput={this.handleInput.name}
          maxLength={AnnounceMetaRule.name.length}
        />
        <ap-input
          textarea={true}
          label={this.app.msgs.announceEdit.form.desc}
          value={this.values.desc}
          onInput={this.handleInput.desc}
          maxLength={AnnounceMetaRule.desc.length}
        />
        <ap-input
          label={this.app.msgs.announceEdit.form.link}
          value={this.values.link}
          onInput={this.handleInput.link}
          maxLength={AnnounceMetaRule.link.length}
        />
        <button disabled={!canSubmit} onClick={this.handleSubmitClick}>
          {this.app.msgs.announceEdit.form.btn}
        </button>
        <a {...href(`/${this.announceID}`, true)}>{this.app.msgs.common.back}</a>
        <button class="clear deletion-toggle" onClick={this.handleDeletionToggleClick}>
          {this.app.msgs.announceEdit.deletion.guide}
        </button>
        {this.showDeletion && (
          <Fragment>
            <div>{this.app.msgs.announceEdit.deletion.desc}</div>
            <button onClick={this.handleDeletionClick}>
              {this.app.msgs.announceEdit.deletion.btn(announce.name)}
            </button>
          </Fragment>
        )}
        {this.showDeleteConfirm && (
          <ap-modal onClose={this.handleDeleteModalClose}>
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
