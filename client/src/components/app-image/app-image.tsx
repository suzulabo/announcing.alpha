import { Component, Fragment, h, Host, Prop, State, Watch } from '@stencil/core';
import { App } from 'src/app/app';
import { DataResult } from 'src/shared';

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

  private loadImage() {
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

              <a class="back" {...this.app.href(`/${this.announceID}/${this.postID}`, true)}>
                <ap-icon icon="xCircle" />
              </a>
            </Fragment>
          );
        default:
          return <ap-spinner />;
      }
    };

    return <Host>{renderContent()}</Host>;
  }
}
