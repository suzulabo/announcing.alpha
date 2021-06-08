import { Component, Fragment, h, Host, Prop, State, Watch } from '@stencil/core';
import { App } from 'src/app/app';
import { DataResult } from 'src/shared';
import { ApNaviLinks } from 'src/shared-ui/ap-navi/ap-navi';

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
    this.loadImage();
  }

  @State()
  image?: DataResult<string>;

  private naviLinks!: ApNaviLinks;

  private loadImage() {
    this.naviLinks = [
      {
        label: this.app.msgs.common.back,
        href: `/${this.announceID}/${this.postID}`,
        back: true,
      },
    ];

    this.image = undefined;

    this.app
      .fetchImage(this.imageID)
      .then(result => {
        if (result?.state != 'SUCCESS') {
          this.app.pushRoute(`/${this.announceID}/${this.postID}`, true);
        }
        this.image = result;
      })
      .catch(err => {
        console.error(err);
        this.app.pushRoute(`/${this.announceID}/${this.postID}`, true);
      });
  }

  componentWillLoad() {
    this.loadImage();
  }

  render() {
    const renderContent = () => {
      switch (this.image?.state) {
        case 'SUCCESS':
          return (
            <Fragment>
              <pinch-zoom>
                <img src={this.image.value} />
              </pinch-zoom>
            </Fragment>
          );
        default:
          return <ap-spinner />;
      }
    };

    return (
      <Host class="full">
        {renderContent()}
        <ap-navi links={this.naviLinks} />
      </Host>
    );
  }
}
