import { Component, h, Host, Listen, Prop, State, Watch } from '@stencil/core';
import assert from 'assert';

import { App } from 'src/app/app';
import { ApNaviLinks } from 'src/shared-ui/ap-navi/ap-navi';
import { FirestoreUpdatedEvent } from 'src/shared-ui/utils/firestore';
import { PageVisible } from 'src/shared-ui/utils/pagevisible';
import { PromiseState } from 'src/shared-ui/utils/promise';
import { pushRoute, redirectRoute } from 'src/shared-ui/utils/route';
import { AsyncReturnType } from 'type-fest';

@Component({
  tag: 'app-post',
  styleUrl: 'app-post.scss',
})
export class AppPost {
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
    this.announceState = undefined;
  }

  @Prop()
  postID!: string;

  @Watch('postID')
  watchPostID() {
    this.postState = undefined;

    this.naviLinks = [
      {
        label: this.app.msgs.common.back,
        href: `/${this.announceID}`,
        back: true,
      },
      {
        label: this.app.msgs.post.edit,
        href: `/${this.announceID}/${this.postID}/edit`,
      },
      {
        label: this.app.msgs.post.delete,
        handler: this.handlers.deletion.show,
      },
    ];
    this.naviLinksLoading = [
      {
        label: this.app.msgs.common.back,
        href: `/${this.announceID}`,
        back: true,
      },
    ];
  }

  @Listen('FirestoreUpdated', { target: 'window' })
  handleFirestoreUpdated(event: FirestoreUpdatedEvent) {
    const { collection, id } = event.detail;
    if (collection == 'announces' && id == this.announceID) {
      this.announceState = undefined;
    }
  }

  @State()
  showDelete = false;

  @State()
  announceState?: PromiseState<AsyncReturnType<AppPost['loadAnnounce']>>;

  @State()
  postState?: PromiseState<AsyncReturnType<AppPost['loadPost']>>;

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

  private async loadPost() {
    const id = this.announceID;
    const postID = this.postID;
    const post = await this.app.getPostJSON(id, postID);
    if (post) {
      return {
        post,
        imgPromise: post.img ? new PromiseState(this.app.getImage(post.img)) : undefined,
      };
    }
    return;
  }

  private handlers = {
    deletion: {
      show: () => {
        this.showDelete = true;
      },

      close: () => {
        this.showDelete = false;
      },

      deleteClick: async () => {
        this.showDelete = false;
        this.app.loading = true;
        try {
          await this.app.deletePost(this.announceID, this.postID);
          pushRoute(`/${this.announceID}`, true);
        } finally {
          this.app.loading = false;
        }
      },
    },
  };

  componentWillLoad() {
    this.watchAnnounceID();
    this.watchPostID();
  }

  componentWillRender() {
    if (!this.announceState) {
      this.announceState = new PromiseState(this.loadAnnounce());
    }
    if (!this.postState) {
      this.postState = new PromiseState(this.loadPost());
    }
  }

  private renderContext() {
    const announceStatus = this.announceState?.status();
    assert(announceStatus);
    const postStatus = this.postState?.status();
    assert(postStatus);

    const { announce } = this.announceState?.result() || {};
    const { post } = this.postState?.result() || {};
    const naviLinks = announce && post ? this.naviLinks : this.naviLinksLoading;
    const pageTitle =
      announce && post
        ? this.app.msgs.post.pageTitle(post?.title || post?.body?.substr(0, 20) || '')
        : this.app.msgs.common.pageTitle;
    return {
      msgs: this.app.msgs,
      announceID: this.announceID,
      postID: this.postID,
      announceStatus,
      postStatus,
      showDelete: this.showDelete,
      handlers: this.handlers,
      naviLinks,
      pageTitle,
    };
  }

  render() {
    return render(this.renderContext());
  }
}

type RenderContext = ReturnType<AppPost['renderContext']>;

const render = (ctx: RenderContext) => {
  return (
    <Host>
      {renderAnnounce(ctx)}
      {renderPost(ctx)}
      {renderDeleteModal(ctx)}
      <ap-navi links={ctx.naviLinks} />
      <ap-head pageTitle={ctx.pageTitle} />
    </Host>
  );
};

const renderAnnounce = (ctx: RenderContext) => {
  const status = ctx.announceStatus;

  switch (status.state) {
    case 'rejected':
    case 'fulfilled-empty':
      redirectRoute(`/${ctx.announceID}`);
      return;
    case 'fulfilled': {
      const { announce, iconImgPromise } = status.value;
      return <ap-announce announce={announce} iconImgPromise={iconImgPromise} />;
    }
    default:
      return <ap-spinner />;
  }
};

const renderPost = (ctx: RenderContext) => {
  if (ctx.announceStatus.state != 'fulfilled') return;

  const status = ctx.postStatus;

  switch (status.state) {
    case 'rejected':
    case 'fulfilled-empty':
      redirectRoute(`/${ctx.announceID}`);
      return;
    case 'fulfilled': {
      const { post, imgPromise } = status.value;

      return (
        <ap-post
          post={post}
          imgPromise={imgPromise}
          msgs={{ datetime: ctx.msgs.common.datetime }}
        />
      );
    }
    default:
      return <ap-spinner />;
  }
};

const renderDeleteModal = (ctx: RenderContext) => {
  if (!ctx.showDelete) return;

  return (
    <ap-modal onClose={ctx.handlers.deletion.close}>
      <div class="delete-modal">
        <div>{ctx.msgs.post.deleteConfirm}</div>
        <div class="buttons">
          <button onClick={ctx.handlers.deletion.close}>{ctx.msgs.common.cancel}</button>
          <button onClick={ctx.handlers.deletion.deleteClick}>{ctx.msgs.common.ok}</button>
        </div>
      </div>
    </ap-modal>
  );
};
