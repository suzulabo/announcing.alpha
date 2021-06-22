import { Component, Fragment, h, Host, Prop, State, Watch } from '@stencil/core';
import assert from 'assert';
import { App } from 'src/app/app';
import { PostRule } from 'src/shared';
import { ApNaviLinks } from 'src/shared-ui/ap-navi/ap-navi';
import { PromiseState } from 'src/shared-ui/utils/promise';
import { pushRoute, redirectRoute } from 'src/shared-ui/utils/route';
import { isURL } from 'src/utils/isurl';
import { AsyncReturnType } from 'type-fest';

@Component({
  tag: 'app-post-form',
  styleUrl: 'app-post-form.scss',
})
export class AppPostForm {
  @Prop()
  app!: App;

  @Prop()
  announceID!: string;

  @Watch('announceID')
  watchAnnounceID() {
    this.announceState = undefined;
    this.values = undefined;
  }

  @Prop()
  postID?: string;

  @Watch('postID')
  watchPostID() {
    this.values = undefined;

    this.naviLinks = [
      {
        label: this.app.msgs.common.back,
        href: this.postID ? `/${this.announceID}/${this.postID}` : `/${this.announceID}`,
        back: true,
      },
    ];
  }

  @State()
  values?: { title?: string; body?: string; link?: string; img?: string; imgData?: string };

  @State()
  announceState?: PromiseState<AsyncReturnType<AppPostForm['laodAnnounce']>>;

  @State()
  postState?: PromiseState<AsyncReturnType<AppPostForm['loadPost']>>;

  private naviLinks!: ApNaviLinks;

  private async laodAnnounce() {
    const id = this.announceID;
    const announce = await this.app.getAnnounceAndMeta(id);
    if (announce) {
      return {
        announce,
        iconImgPromise: announce.icon
          ? new PromiseState(this.app.getImage(announce.icon))
          : undefined,
      };
    }
    return;
  }

  private async loadPost() {
    const id = this.announceID;
    const postID = this.postID;
    if (!postID) return;

    const post = await this.app.getPost(id, postID);
    if (post) {
      return {
        post,
        imgData: post.img ? await this.app.getImage(post.img) : undefined,
      };
    }
    return;
  }

  private handlers = {
    input: {
      title: (ev: Event) => {
        this.values = { ...this.values, title: (ev.target as HTMLInputElement).value };
      },
      body: (ev: Event) => {
        this.values = { ...this.values, body: (ev.target as HTMLTextAreaElement).value };
      },
      link: (ev: Event) => {
        this.values = { ...this.values, link: (ev.target as HTMLInputElement).value };
      },
      img: (ev: CustomEvent<string>) => {
        this.values = { ...this.values, imgData: ev.detail };
      },
      resizing: (ev: CustomEvent<boolean>) => {
        this.app.loading = ev.detail;
      },
    },
    submit: async () => {
      if (!this.values) {
        return;
      }
      this.app.loading = true;
      try {
        await this.app.putPost(
          this.announceID,
          this.values.title,
          this.values.body,
          this.values.link,
          this.values.imgData?.split(',')[1],
          this.postID,
        );
        this.values = undefined;
        pushRoute(`/${this.announceID}`);
      } finally {
        this.app.loading = false;
      }
    },
  };

  componentWillLoad() {
    this.watchPostID();
  }

  componentWillRender() {
    if (!this.announceState) {
      this.announceState = new PromiseState(this.laodAnnounce());
    }

    if (!this.values) {
      if (!this.postID) {
        this.values = {};
      } else {
        this.postState = new PromiseState(this.loadPost());
        this.postState.then(value => {
          if (value) {
            this.values = { ...value.post, imgData: value.imgData };
          }
        });
      }
    }
  }

  private renderContext() {
    const announceStatus = this.announceState?.status();
    assert(announceStatus);
    const postStatus = this.postState?.status();
    const { announce } = this.announceState?.result() || {};

    const values = this.values || {};

    let canSubmit = (values.title || values.body) && isURL(values.link);
    if (canSubmit && this.postID) {
      const { post, imgData } = this.postState?.result() || {};
      if (!post) {
        canSubmit = false;
      } else {
        canSubmit =
          values.title != post.title ||
          values.body != post.body ||
          values.link != post.link ||
          values.imgData != imgData;
      }
    }

    const naviLinks = this.naviLinks;
    const backPath = `/${this.announceID}` + (this.postID ? `/${this.postID}` : '');
    const pageTitle = announce
      ? this.app.msgs.postForm.pageTitle(announce.name)
      : this.app.msgs.common.pageTitle;
    return {
      msgs: this.app.msgs,
      announceID: this.announceID,
      announceStatus,
      postStatus,
      values,
      canSubmit,
      handlers: this.handlers,
      naviLinks,
      backPath,
      pageTitle,
    };
  }

  render() {
    return render(this.renderContext());
  }
}

type RenderContext = ReturnType<AppPostForm['renderContext']>;

const render = (ctx: RenderContext) => {
  return (
    <Host>
      {renderAnnounce(ctx)}
      {renderForm(ctx)}
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
      redirectRoute(ctx.backPath);
      return;
    case 'fulfilled': {
      const { announce, iconImgPromise } = status.value;
      return <ap-announce announce={announce} iconImgPromise={iconImgPromise} />;
    }
    default:
      return <ap-spinner />;
  }
};

const renderForm = (ctx: RenderContext) => {
  return (
    <Fragment>
      <div class="form">
        <ap-image-input
          label={ctx.msgs.postForm.img}
          resizeRect={{ width: 800, height: 800 }}
          data={ctx.values.imgData}
          onImageResizing={ctx.handlers.input.resizing}
          onImageChange={ctx.handlers.input.img}
        />
        <ap-input
          label={ctx.msgs.postForm.title}
          value={ctx.values.title}
          maxLength={PostRule.title.length}
          onInput={ctx.handlers.input.title}
        />
        <ap-input
          textarea={true}
          label={ctx.msgs.postForm.body}
          value={ctx.values.body}
          maxLength={PostRule.body.length}
          onInput={ctx.handlers.input.body}
        />
        <ap-input
          label={ctx.msgs.postForm.lnik}
          value={ctx.values.link}
          maxLength={PostRule.link.length}
          onInput={ctx.handlers.input.link}
        />
        <button class="submit" disabled={!ctx.canSubmit} onClick={ctx.handlers.submit}>
          {ctx.msgs.postForm.btn}
        </button>
      </div>
    </Fragment>
  );
};
