import { Component, Fragment, h, Host, Listen, Prop, State, Watch } from '@stencil/core';
import QRCodeStyling from 'qr-code-styling';
import { App } from 'src/app/app';
import { Announce, AnnounceMetaBase, PostJSON } from 'src/shared';
import { FirestoreUpdatedEvent } from 'src/shared-ui/utils/firestore';
import { PromiseState } from 'src/shared-ui/utils/promise';
import { href, redirectRoute } from 'src/shared-ui/utils/route';

@Component({
  tag: 'app-announce',
  styleUrl: 'app-announce.scss',
})
export class AppAnnounce {
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

    this.announceState = undefined;
  }

  @Listen('FirestoreUpdated')
  handleFirestoreUpdated(event: FirestoreUpdatedEvent) {
    const { collection, id } = event.detail;
    if (collection == 'announces' && id == this.announceID) {
      this.announceState = undefined;
    }
  }

  @State()
  announceState?: PromiseState<
    Announce &
      AnnounceMetaBase & {
        iconImgPromise?: PromiseState<string>;
        postsPromises: Record<string, PromiseState<PostJSON>>;
      }
  >;

  @State()
  showURL = false;

  @State()
  showQRCode = false;

  private qrCode!: QRCodeStyling;

  componentWillLoad() {
    this.watchAnnounceID();
  }

  private async loadAnnounce() {
    const id = this.announceID;
    const a = await this.app.getAnnounceAndMeta(id);
    if (a) {
      return {
        ...a,
        announceIcon: a.icon ? new PromiseState(this.app.getImage(a.icon)) : undefined,
        postsPromises: this.app.getPosts(id, a),
      };
    }
    return;
  }

  private get clientURL() {
    return `${this.app.clientSite}/${this.announceID}`;
  }

  private urlModal = {
    urlEl: undefined as HTMLElement | undefined,
    handlers: {
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
        const urlEl = this.urlModal.urlEl;
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
        const announce = this.announceState?.result();
        if (announce) {
          this.qrCode.download({ name: `qrcode-${announce.name}`, extension: 'png' });
        }
      },
      urlRef: (el?: HTMLElement) => {
        if (el) {
          this.urlModal.urlEl = el;
        }
      },
      qrcodeRef: (el?: HTMLElement) => {
        if (el) {
          this.qrCode.append(el);
        }
      },
    },
  };

  componentWillRender() {
    if (!this.announceState) {
      this.announceState = new PromiseState(this.loadAnnounce());
    }
  }

  render() {
    const announceState = this.announceState;
    if (!announceState) {
      return;
    }

    const msgs = this.app.msgs;
    const state = announceState.state();
    const url = this.clientURL;

    const renderContent = () => {
      switch (state) {
        case 'rejected':
          return (
            <Fragment>
              <div class="data-error">{msgs.announce.dataError}</div>
            </Fragment>
          );
        case 'fulfilled': {
          const announce = announceState.result();
          if (!announce) {
            redirectRoute('/');
            return;
          }

          this.app.setTitle(this.app.msgs.announce.pageTitle(announce.name));

          return (
            <Fragment>
              <ap-announce
                announce={announce}
                href={`/${this.announceID}/config`}
                iconImgPromise={announce.iconImgPromise}
              ></ap-announce>
              <div class="buttons" slot="bottomAnnounce">
                <a class="button small" {...href(`${this.announceID}/edit`)}>
                  {msgs.announce.edit}
                </a>
                <button class="small" onClick={this.urlModal.handlers.show}>
                  {msgs.announce.showURL}
                </button>
              </div>
              <a class="button new-post" {...href(`${this.announceID}/post`)}>
                {this.app.msgs.announce.newPost}
              </a>
              <ap-posts
                posts={announce.posts}
                postsPromises={announce.postsPromises}
                hrefFormat={`/${this.announceID}/:postID`}
                msgs={{
                  datetime: msgs.common.datetime,
                  dataError: msgs.announce.dataError,
                }}
              />
            </Fragment>
          );
        }
        default:
          return <ap-spinner />;
      }
    };

    return (
      <Host>
        {renderContent()}

        <a {...href('/', true)}>{this.app.msgs.common.back}</a>
        {this.showURL && (
          <ap-modal onClose={this.urlModal.handlers.close}>
            <div class="url-modal">
              {!this.showQRCode && (
                <button class="anchor" onClick={this.urlModal.handlers.showQrCode}>
                  {msgs.announce.showQRCode}
                </button>
              )}
              {this.showQRCode && (
                <Fragment>
                  <div class="qr" ref={this.urlModal.handlers.qrcodeRef} />
                  <input
                    class="qr-size"
                    type="range"
                    min="100"
                    max="300"
                    value="200"
                    step="50"
                    onInput={this.urlModal.handlers.qrsize}
                  />
                  <button class="slim qr-download" onClick={this.urlModal.handlers.download}>
                    {msgs.announce.downloadQRCode}
                  </button>
                </Fragment>
              )}
              <div class="url" ref={this.urlModal.handlers.urlRef}>
                {url}
              </div>
              <div class="buttons">
                <a class="button slim open" href={url} target="_blank" rel="noopener">
                  {msgs.announce.openURL}
                </a>
                <button class="slim copy" onClick={this.urlModal.handlers.copy}>
                  {msgs.announce.copyURL}
                </button>
                <button class="slim close" onClick={this.urlModal.handlers.close}>
                  {msgs.common.close}
                </button>
              </div>
            </div>
          </ap-modal>
        )}
      </Host>
    );
  }
}
