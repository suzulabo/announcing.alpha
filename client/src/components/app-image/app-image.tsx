import { Component, Fragment, h, Host, Prop, State, Watch } from '@stencil/core';
import { App } from 'src/app/app';
import { ApNaviLinks } from 'src/shared-ui/ap-navi/ap-navi';
import { PromiseState } from 'src/shared-ui/utils/promise';
import { pushRoute } from 'src/shared-ui/utils/route';

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

  @Prop()
  imageID!: string;

  @Watch('imageID')
  watchImageID() {
    this.imageState = undefined;
  }

  @State()
  imageState?: PromiseState<string>;

  private naviLinks!: ApNaviLinks;

  componentWillRender() {
    this.naviLinks = [
      {
        label: this.app.msgs.common.back,
        href: `/${this.announceID}/${this.postID}`,
        back: true,
      },
    ];

    if (!this.imageState) {
      this.imageState = new PromiseState(this.app.fetchImage(this.imageID));
    }
  }

  render() {
    if (this.imageState?.noResult()) {
      pushRoute(`/${this.announceID}/${this.postID}`, true);
      return;
    }

    const image = this.imageState?.result();

    const renderContent = () => {
      if (image) {
        return (
          <Fragment>
            <pinch-zoom>
              <img src={image} />
            </pinch-zoom>
          </Fragment>
        );
      }
      return <ap-spinner />;
    };

    return (
      <Host class="full">
        {renderContent()}
        <ap-navi links={this.naviLinks} />
      </Host>
    );
  }
}
