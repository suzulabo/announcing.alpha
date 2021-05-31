import { Component, Fragment, h, Prop, State } from '@stencil/core';
import { App } from 'src/app/app';
import { DataResult } from 'src/app/datatypes';

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

  private backPath!: string;

  @State()
  image?: DataResult<string>;

  componentWillLoad() {
    this.backPath = `/${this.announceID}/${this.postID}`;

    this.app
      .fetchImage(this.imageID)
      .then(result => {
        if (result?.state != 'SUCCESS') {
          this.app.pushRoute(this.backPath, true);
        }
        this.image = result;
      })
      .catch(err => {
        console.error(err);
        this.app.pushRoute(this.backPath, true);
      });
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

              <ion-router-link class="back" href={this.backPath} routerDirection="back">
                <ap-icon icon="xCircle" />
              </ion-router-link>
            </Fragment>
          );
        default:
          return <ap-spinner />;
      }
    };

    return (
      <ion-content>
        <div class="x-content">{renderContent()}</div>
      </ion-content>
    );
  }
}
