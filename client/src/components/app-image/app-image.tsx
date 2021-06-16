import { Component, Fragment, h, Host, Prop, State, Watch } from '@stencil/core';
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

  private renderContent() {
    const status = this.imageState?.status();

    switch (status?.state) {
      case 'rejected':
      case 'fulfilled-empty':
        redirectRoute(`/${this.announceID}/${this.postID}`);
        return;
      case 'fulfilled':
        return (
          <Fragment>
            <pinch-zoom>
              <img src={status.value} />
            </pinch-zoom>
          </Fragment>
        );
      default:
        return <ap-spinner />;
    }
  }

  render() {
    return (
      <Host class="full">
        {this.renderContent()}
        <ap-navi links={this.naviLinks} />
      </Host>
    );
  }
}
