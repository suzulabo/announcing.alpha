import { Component, Fragment, h, Host, Prop } from '@stencil/core';
import { App } from 'src/app/app';
import { AnnounceState } from 'src/app/datatypes';

@Component({
  tag: 'app-posts',
  styleUrl: 'app-posts.scss',
})
export class AppPosts {
  @Prop()
  app: App;

  @Prop()
  announceID: string;

  private announce: AnnounceState;

  async componentWillLoad() {
    const as = await this.app.getAnnounceState(this.announceID.toUpperCase());
    if (!as) {
      this.app.pushRoute('/');
      return;
    }

    this.announce = as;
  }

  render() {
    if (!this.announce) {
      return;
    }

    return (
      <Host>
        {!this.announce.posts && (
          <Fragment>
            <div>{this.app.msgs.post.home.noPosts}</div>
            <a href={`f`}>{this.app.msgs.post.home.newPost}</a>
          </Fragment>
        )}
      </Host>
    );
  }
}
