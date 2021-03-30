import { Component, h, Host, Prop, State } from '@stencil/core';
import { App } from 'src/app/app';
import { AnnounceState } from 'src/app/datatypes';

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

  private announce: AnnounceState;

  async componentWillLoad() {
    const as = await this.app.getAnnounceState(this.announceID);
    if (!as) {
      this.app.pushRoute('/');
      return;
    }

    this.announce = as;
  }

  private postLoader = async (postID: string) => {
    const post = await this.app.getPost(this.announceID, postID);
    if (!post) {
      return;
    }
    return { ...post, anchorAttrs: this.app.href(`/${this.announceID}/${postID}`) };
  };

  private urlModal = {
    urlEl: null as HTMLElement,
    handlers: {
      show: () => {
        this.showURL = true;
      },
      close: () => {
        this.showURL = false;
      },
      copy: async () => {
        const urlEl = this.urlModal.urlEl;
        if (!urlEl) {
          return;
        }

        await navigator.clipboard.writeText(`${this.app.clientSite}/${this.announceID}`);

        urlEl.classList.remove('copied');

        // void codeEl.offsetWidth; <- It is removed when production build
        if (!isNaN(urlEl.offsetWidth)) {
          urlEl.classList.add('copied');
        }
      },
      urlRef: (el: HTMLElement) => {
        this.urlModal.urlEl = el;
      },
    },
  };

  render() {
    const msgs = this.app.msgs;

    const url = `${this.app.clientSite}/${this.announceID}`;

    return (
      <Host>
        <ap-announce
          announce={this.announce}
          postLoader={this.postLoader}
          msgs={{
            datetime: msgs.common.datetime,
            noPosts: msgs.announce.noPosts,
          }}
        >
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
              <div class="url" ref={this.urlModal.handlers.urlRef}>
                {url}
              </div>
              <div class="buttons">
                <a class="button slim open" href={url} target="_blank" rel="noopener">
                  {msgs.announce.open}
                </a>
                <button class="slim copy" onClick={this.urlModal.handlers.copy}>
                  {msgs.announce.copy}
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
