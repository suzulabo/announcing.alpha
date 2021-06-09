import { Component, Fragment, h, Host, Prop, State } from '@stencil/core';
import QRCodeStyling from 'qr-code-styling';
import { App } from 'src/app/app';

@Component({
  tag: 'app-announce',
  styleUrl: 'app-announce.scss',
})
export class AppAnnounce {
  @Prop()
  app: App;

  @Prop()
  announceID: string;

  @State()
  showURL = false;

  @State()
  showQRCode = false;

  private qrCode: QRCodeStyling;

  async componentWillLoad() {
    await this.app.processLoading(async () => {
      await this.app.loadAnnounce(this.announceID);

      const as = this.app.getAnnounceState(this.announceID);
      if (!as) {
        this.app.pushRoute('/');
        return;
      }

      this.app.setTitle(this.app.msgs.announce.pageTitle(as.name));

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
    });
  }

  /*
  private postLoader = async (postID: string) => {
    const post = await this.app.getPost(this.announceID, postID);
    if (!post) {
      return;
    }
    return {
      ...post,
      pT: post.pT.toMillis(),
      href: `/${this.announceID}/${postID}`,
    };
  };
  */

  private get clientURL() {
    return `${this.app.clientSite}/${this.announceID}`;
  }

  private urlModal = {
    urlEl: null as HTMLElement,
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
        const announce = this.app.getAnnounceState(this.announceID);
        if (announce) {
          this.qrCode.download({ name: `qrcode-${announce.name}`, extension: 'png' });
        }
      },
      urlRef: (el: HTMLElement) => {
        this.urlModal.urlEl = el;
      },
      qrcodeRef: (el: HTMLElement) => {
        this.qrCode.append(el);
      },
    },
  };

  render() {
    const announce = this.app.getAnnounceState(this.announceID);
    if (!announce) {
      return;
    }

    const msgs = this.app.msgs;

    const url = this.clientURL;

    return (
      <Host>
        <ap-announce announce={announce}>
          <div class="buttons" slot="bottomAnnounce">
            <a class="button small" {...this.app.href(`${this.announceID}/edit_`)}>
              {msgs.announce.edit}
            </a>
            <button class="small" onClick={this.urlModal.handlers.show}>
              {msgs.announce.showURL}
            </button>
          </div>
          <a
            slot="beforePosts"
            class="button new-post"
            {...this.app.href(`${this.announceID}/post_`)}
          >
            {this.app.msgs.announce.newPost}
          </a>
        </ap-announce>
        <a {...this.app.href('/', true)}>{this.app.msgs.common.back}</a>
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
