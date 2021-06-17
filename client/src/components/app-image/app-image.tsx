import { Component, Fragment, h, Host, Prop, State, Watch } from '@stencil/core';
import assert from 'assert';
import { App } from 'src/app/app';
import { ApNaviLinks } from 'src/shared-ui/ap-navi/ap-navi';
import { PromiseState } from 'src/shared-ui/utils/promise';
import { redirectRoute } from 'src/shared-ui/utils/route';

@Component({
  tag: 'app-image',
  styleUrl: 'app-image.scss',
})
export class AppImage {
  @Prop()
  app!: App;

  @Prop()
  announceID!: string;

  @Prop()
  postID!: string;

  @Watch('postID')
  watchPostID() {
    this.naviLinks = [
      {
        label: this.app.msgs.common.back,
        href: `/${this.announceID}/${this.postID}`,
        back: true,
      },
    ];
  }

  @Prop()
  imageID!: string;

  @Watch('imageID')
  watchImageID() {
    this.imageState = undefined;
  }

  @State()
  imageState?: PromiseState<string>;

  private naviLinks!: ApNaviLinks;

  componentWillLoad() {
    this.watchPostID();
  }

  componentWillRender() {
    if (!this.imageState) {
      this.imageState = new PromiseState(this.app.fetchImage(this.imageID));
    }
  }

  private renderContext() {
    const imgStatus = this.imageState?.status();
    assert(imgStatus);

    return {
      announceID: this.announceID,
      postID: this.postID,
      imgStatus,
      naviLinks: this.naviLinks,
    };
  }

  render() {
    return render(this.renderContext());
  }
}

type RenderContext = ReturnType<AppImage['renderContext']>;

const render = (ctx: RenderContext) => {
  return (
    <Host class="full">
      {renderContent(ctx)}
      <ap-navi links={ctx.naviLinks} />
    </Host>
  );
};

const renderContent = (ctx: RenderContext) => {
  switch (ctx.imgStatus.state) {
    case 'rejected':
    case 'fulfilled-empty':
      redirectRoute(`/${ctx.announceID}/${ctx.postID}`);
      return;
    case 'fulfilled':
      return (
        <Fragment>
          <pinch-zoom>
            <img src={ctx.imgStatus.value} />
          </pinch-zoom>
        </Fragment>
      );
    default:
      return <ap-spinner />;
  }
};
