import { Component, h, Host, Prop, State } from '@stencil/core';
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
  imageID!: string;

  @Prop()
  backPath!: string;

  @State()
  image?: DataResult<string>;

  componentWillLoad() {
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
    switch (this.image?.state) {
      case 'SUCCESS':
        return (
          <Host>
            <pinch-zoom>
              <img src={this.image.value} />
            </pinch-zoom>
            <a class="icon" {...this.app.href(this.backPath, true)}>
              <ap-icon icon="xCircle" />
            </a>
          </Host>
        );
      default:
        return <ap-spinner />;
    }
  }
}
