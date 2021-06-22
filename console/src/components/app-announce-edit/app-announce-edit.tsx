import { Component, Fragment, h, Host, Listen, Prop, State, Watch } from '@stencil/core';
import assert from 'assert';
import { App } from 'src/app/app';
import { AnnounceMetaRule } from 'src/shared';
import { ApNaviLinks } from 'src/shared-ui/ap-navi/ap-navi';
import { PromiseState } from 'src/shared-ui/utils/promise';
import { pushRoute, redirectRoute } from 'src/shared-ui/utils/route';
import { isURL } from 'src/utils/isurl';
import { AsyncReturnType } from 'type-fest';

@Component({
  tag: 'app-announce-edit',
  styleUrl: 'app-announce-edit.scss',
})
export class AppAnnounceEdit {
  @Listen('PageActivated')
  listenPageActivated() {
    this.announceState = undefined;
  }

  @Prop()
  app!: App;

  @Prop()
  announceID!: string;

  @Watch('announceID')
  watchAnnounceID() {
    this.announceState = undefined;

    this.naviLinks = [
      {
        label: this.app.msgs.common.back,
        href: `/${this.announceID}`,
        back: true,
      },
    ];
  }

  @State()
  values?: { name?: string; desc?: string; link?: string; icon?: string; iconData?: string };

  @State()
  showDeletion = false;

  @State()
  showDeleteConfirm = false;

  @State()
  announceState?: PromiseState<AsyncReturnType<AppAnnounceEdit['loadAnnounce']>>;

  private async loadAnnounce() {
    const id = this.announceID;
    const announce = await this.app.getAnnounceAndMeta(id);
    if (announce) {
      return {
        announce,
        iconData: announce.icon ? await this.app.getImage(announce.icon) : undefined,
      };
    }
    return;
  }

  private naviLinks!: ApNaviLinks;

  private handlers = {
    input: {
      name: (ev: Event) => {
        this.values = { ...this.values, name: (ev.target as HTMLInputElement).value };
      },
      desc: (ev: Event) => {
        this.values = { ...this.values, desc: (ev.target as HTMLTextAreaElement).value };
      },
      link: (ev: Event) => {
        this.values = { ...this.values, link: (ev.target as HTMLInputElement).value };
      },
    },
    image: {
      resize: (ev: CustomEvent<boolean>) => {
        this.app.loading = ev.detail;
      },
      change: (ev: CustomEvent<string>) => {
        this.values = { ...this.values, icon: undefined, iconData: ev.detail };
      },
    },
    deletion: {
      toggle: () => {
        this.showDeletion = !this.showDeletion;
      },

      show: () => {
        this.showDeleteConfirm = true;
      },

      close: () => {
        this.showDeleteConfirm = false;
      },
      deleteClick: async () => {
        this.showDeleteConfirm = false;
        this.app.loading = true;
        try {
          await this.app.deleteAnnounce(this.announceID);
          pushRoute('/');
        } finally {
          this.app.loading = false;
        }
      },
    },
    submit: async () => {
      if (!this.values?.name) {
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
    },
  };

  componentWillLoad() {
    this.watchAnnounceID();
  }

  componentWillRender() {
    if (!this.announceState) {
      this.values = undefined;
      this.announceState = new PromiseState(this.loadAnnounce());
      this.announceState.then(value => {
        if (value) {
          const { announce, iconData } = value;
          this.values = {
            ...announce,
            iconData,
          };
        }
      });
    }
  }

  private renderContext() {
    const announceStatus = this.announceState?.status();
    assert(announceStatus);

    const { announce, iconData } = this.announceState?.result() || {};

    const values = this.values || {};
    const modified =
      values.name != announce?.name ||
      values.desc != announce?.desc ||
      values.link != announce?.link ||
      values.icon != announce?.icon ||
      values.iconData != iconData;

    const canSubmit = !!values.name && isURL(values.link) && modified;

    return {
      msgs: this.app.msgs,
      announceID: this.announceID,
      values,
      announceStatus,
      canSubmit,
      showDeletion: this.showDeletion,
      showDeleteConfirm: this.showDeleteConfirm,
      handlers: this.handlers,
      naviLinks: this.naviLinks,
      pageTitle: announce
        ? this.app.msgs.announceEdit.pageTitle(announce.name)
        : this.app.msgs.common.pageTitle,
    };
  }

  render() {
    return render(this.renderContext());
  }
}

type RenderContext = ReturnType<AppAnnounceEdit['renderContext']>;

const render = (ctx: RenderContext) => {
  return (
    <Host>
      {renderForm(ctx)}
      <ap-navi links={ctx.naviLinks} />
      <ap-head pageTitle={ctx.pageTitle} />
    </Host>
  );
};

const renderForm = (ctx: RenderContext) => {
  switch (ctx.announceStatus.state) {
    case 'pending':
      return <ap-spinner />;
    case 'rejected':
    case 'fulfilled-empty':
      redirectRoute(`/${ctx.announceID}`);
      return;
  }

  const { announce } = ctx.announceStatus.value;

  return (
    <Fragment>
      <div class="form">
        <ap-image-input
          label={ctx.msgs.announceEdit.form.icon}
          data={ctx.values.iconData}
          resizeRect={{ width: 200, height: 200 }}
          border={true}
          onImageResizing={ctx.handlers.image.resize}
          onImageChange={ctx.handlers.image.change}
        />
        <ap-input
          label={ctx.msgs.announceEdit.form.name}
          value={ctx.values.name}
          onInput={ctx.handlers.input.name}
          maxLength={AnnounceMetaRule.name.length}
        />
        <ap-input
          textarea={true}
          label={ctx.msgs.announceEdit.form.desc}
          value={ctx.values.desc}
          onInput={ctx.handlers.input.desc}
          maxLength={AnnounceMetaRule.desc.length}
        />
        <ap-input
          label={ctx.msgs.announceEdit.form.link}
          value={ctx.values.link}
          onInput={ctx.handlers.input.link}
          maxLength={AnnounceMetaRule.link.length}
        />
        <button class="submit" disabled={!ctx.canSubmit} onClick={ctx.handlers.submit}>
          {ctx.msgs.announceEdit.form.btn}
        </button>
        <button class="clear deletion-toggle" onClick={ctx.handlers.deletion.toggle}>
          {ctx.msgs.announceEdit.deletion.guide}
        </button>
      </div>
      {ctx.showDeletion && (
        <Fragment>
          <div class="deletion">
            <div>{ctx.msgs.announceEdit.deletion.desc}</div>
            <button onClick={ctx.handlers.deletion.show}>
              {ctx.msgs.announceEdit.deletion.btn(announce.name)}
            </button>
          </div>
        </Fragment>
      )}
      {ctx.showDeleteConfirm && (
        <ap-modal onClose={ctx.handlers.deletion.close}>
          <div class="delete-modal">
            <div>{ctx.msgs.announceEdit.deletion.confirm}</div>
            <div class="buttons">
              <button onClick={ctx.handlers.deletion.close}>{ctx.msgs.common.cancel}</button>
              <button onClick={ctx.handlers.deletion.deleteClick}>{ctx.msgs.common.ok}</button>
            </div>
          </div>
        </ap-modal>
      )}
    </Fragment>
  );
};
