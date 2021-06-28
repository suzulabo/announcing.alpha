import { Component, Fragment, h, Host, Listen, Prop, State, Watch } from '@stencil/core';
import assert from 'assert';
import QRCodeStyling from 'qr-code-styling';
import { App } from 'src/app/app';
import { ApNaviLinks } from 'src/shared-ui/ap-navi/ap-navi';
import { FirestoreUpdatedEvent } from 'src/shared-ui/utils/firestore';
import { PageVisible } from 'src/shared-ui/utils/pagevisible';
import { PromiseState } from 'src/shared-ui/utils/promise';
import { href, redirectRoute } from 'src/shared-ui/utils/route';
import { AsyncReturnType } from 'type-fest';

@Component({
  tag: 'app-announce',
  styleUrl: 'app-announce.scss',
})
export class AppAnnounce {
  @Prop()
  pageVisible!: PageVisible;

  componentShouldUpdate() {
    return this.pageVisible.shouldUpdate();
  }

  @Prop()
  app!: App;

  @Prop()
  announceID!: string;

  @Watch('announceID')
  watchAnnounceID() {
    this.qrCode = new QRCodeStyling({
      width: 200,
      height: 200,
      dotsOptions: {
        color: '#333333',
        type: 'extra-rounded',
      },
      cornersSquareOptions: {
        type: 'extra-rounded',
      },
      data: this.clientURL,
    });

    this.naviLinks = [
      {
        label: this.app.msgs.common.back,
        href: '/',
        back: true,
      },
      {
        label: this.app.msgs.announce.newPostNavi,
        href: `/${this.announceID}/post`,
      },
    ];
    this.naviLinksLoading = [
      {
        label: this.app.msgs.common.back,
        href: '/',
        back: true,
      },
    ];

    this.announceState = undefined;
  }

  @Listen('FirestoreUpdated', { target: 'window' })
  handleFirestoreUpdated(event: FirestoreUpdatedEvent) {
    const { collection, id } = event.detail;
    if (collection == 'announces' && id == this.announceID) {
      this.announceState = undefined;
    }
  }

  @State()
  announceState?: PromiseState<AsyncReturnType<AppAnnounce['loadAnnounce']>>;

  @State()
  showURL = false;

  @State()
  showQRCode = false;

  private qrCode!: QRCodeStyling;
  private naviLinks!: ApNaviLinks;
  private naviLinksLoading!: ApNaviLinks;

  private async loadAnnounce() {
    const id = this.announceID;
    const announce = await this.app.getAnnounceAndMeta(id);
    if (announce) {
      return {
        announce,
        iconImgPromise: announce.icon
          ? new PromiseState(this.app.getImage(announce.icon))
          : undefined,
        postsPromises: this.app.getPosts(id, announce),
      };
    }
    return;
  }

  private get clientURL() {
    return `${this.app.clientSite}/${this.announceID}`;
  }

  private urlElement?: HTMLElement;

  private handlers = {
    urlModal: {
      show: () => {
        this.showURL = true;
        this.showQRCode = false;
      },
      close: () => {
        this.showURL = false;
      },
      showQrCode: () => {
        this.showQRCode = true;
      },
      copy: async () => {
        const urlEl = this.urlElement;
        if (!urlEl) {
          return;
        }

        await navigator.clipboard.writeText(this.clientURL);

        urlEl.classList.remove('copied');

        // void codeEl.offsetWidth; <- It is removed when production build
        if (!isNaN(urlEl.offsetWidth)) {
          urlEl.classList.add('copied');
        }
      },
      qrsize: (event: Event) => {
        const el = event.target as HTMLInputElement;
        const w = parseInt(el.value);
        this.qrCode.update({ width: w, height: w });
      },
      download: () => {
        const { announce } = this.announceState?.result() || {};
        if (announce) {
          void this.qrCode.download({ name: `qrcode-${announce.name}`, extension: 'png' });
        }
      },
      urlRef: (el?: HTMLElement) => {
        if (el) {
          this.urlElement = el;
        }
      },
      qrcodeRef: (el?: HTMLElement) => {
        if (el) {
          this.qrCode.append(el);
        }
      },
    },
  };

  componentWillLoad() {
    this.watchAnnounceID();
  }

  componentWillRender() {
    if (!this.announceState) {
      this.announceState = new PromiseState(this.loadAnnounce());
    }
  }

  private renderContext() {
    const announceStatus = this.announceState?.status();
    assert(announceStatus);
    const { announce } = this.announceState?.result() || {};
    const naviLinks = announce ? this.naviLinks : this.naviLinksLoading;
    const pageTitle = announce
      ? this.app.msgs.announce.pageTitle(announce.name)
      : this.app.msgs.common.pageTitle;
    return {
      msgs: this.app.msgs,
      announceID: this.announceID,
      announceStatus,
      naviLinks,
      pageTitle,
      showURL: this.showURL,
      showQRCode: this.showQRCode,
      clientURL: this.clientURL,
      handlers: this.handlers,
    };
  }

  render() {
    return render(this.renderContext());
  }
}

type RenderContext = ReturnType<AppAnnounce['renderContext']>;

const render = (ctx: RenderContext) => {
  return (
    <Host>
      {renderContent(ctx)}
      {renderURLModal(ctx)}
      <ap-navi links={ctx.naviLinks} position="sticky" />
      <ap-head pageTitle={ctx.pageTitle} />
    </Host>
  );
};

const renderContent = (ctx: RenderContext) => {
  switch (ctx.announceStatus.state) {
    case 'rejected':
      return (
        <Fragment>
          <div class="data-error">{ctx.msgs.announce.dataError}</div>
        </Fragment>
      );
    case 'fulfilled-empty':
      redirectRoute('/');
      return;
    case 'fulfilled': {
      const { announce, iconImgPromise, postsPromises } = ctx.announceStatus.value;

      return (
        <Fragment>
          <ap-announce
            announce={announce}
            href={`/${ctx.announceID}/edit`}
            iconImgPromise={iconImgPromise}
            showDetails={true}
          ></ap-announce>
          <div class="actions">
            <div class="line1">
              <a class="button small" {...href(`${ctx.announceID}/edit`)}>
                {ctx.msgs.announce.edit}
              </a>
              <button class="small" onClick={ctx.handlers.urlModal.show}>
                {ctx.msgs.announce.showURL}
              </button>
            </div>
            <hr />
            <a class="button slim new-post" {...href(`${ctx.announceID}/post`)}>
              {ctx.msgs.announce.newPost}
            </a>
          </div>
          <ap-posts
            posts={announce.posts}
            postsPromises={postsPromises}
            hrefFormat={`/${ctx.announceID}/:postID`}
            msgs={{
              datetime: ctx.msgs.common.datetime,
              dataError: ctx.msgs.announce.dataError,
            }}
          />
        </Fragment>
      );
    }
    default:
      return <ap-spinner />;
  }
};

const renderURLModal = (ctx: RenderContext) => {
  if (!ctx.showURL) return;

  return (
    <ap-modal onClose={ctx.handlers.urlModal.close}>
      <div class="url-modal">
        {!ctx.showQRCode && (
          <button class="show-qr anchor" onClick={ctx.handlers.urlModal.showQrCode}>
            {ctx.msgs.announce.showQRCode}
          </button>
        )}
        {ctx.showQRCode && (
          <Fragment>
            <div class="qr">
              <div ref={ctx.handlers.urlModal.qrcodeRef} />
              <input
                class="qr-size"
                type="range"
                min="100"
                max="300"
                value="200"
                step="50"
                onInput={ctx.handlers.urlModal.qrsize}
              />
              <button class="slim qr-download" onClick={ctx.handlers.urlModal.download}>
                {ctx.msgs.announce.downloadQRCode}
              </button>
            </div>
          </Fragment>
        )}
        <div class="url" ref={ctx.handlers.urlModal.urlRef}>
          {ctx.clientURL}
        </div>
        <div class="buttons">
          <a class="button slim open" href={ctx.clientURL} target="_blank" rel="noopener">
            {ctx.msgs.announce.openURL}
          </a>
          <button class="slim copy" onClick={ctx.handlers.urlModal.copy}>
            {ctx.msgs.announce.copyURL}
          </button>
          <button class="slim close" onClick={ctx.handlers.urlModal.close}>
            {ctx.msgs.common.close}
          </button>
        </div>
      </div>
    </ap-modal>
  );
};
