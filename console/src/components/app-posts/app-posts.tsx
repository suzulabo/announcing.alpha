import { Component, Fragment, h, Host, Prop, State } from '@stencil/core';
import { App } from 'src/app/app';
import { AnnounceState } from 'src/app/datatypes';

const PAGE_SIZE = 10;

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

  @State()
  renderedPosts = [];

  async componentWillLoad() {
    const as = await this.app.getAnnounceState(this.announceID.toUpperCase());
    if (!as) {
      this.app.pushRoute('/');
      return;
    }

    this.announce = as;

    void this.loadPosts();
  }

  private async loadPosts() {
    if (!this.announce.posts) {
      return;
    }

    console.log(this.announce);
    const id = this.announceID.toUpperCase();
    const posts = this.announce.posts
      .reverse()
      .slice(this.renderedPosts.length, this.renderedPosts.length + PAGE_SIZE);

    const rendered = [];

    for (const postID of posts) {
      const post = await this.app.getPost(id, postID);
      if (!post) {
        rendered.push(<div>no post data</div>);
      } else {
        rendered.push(<div class="post-box">{post.title}</div>);
      }
    }

    this.renderedPosts = [...this.renderedPosts, ...rendered];
  }

  render() {
    if (!this.announce) {
      return;
    }

    const noPosts = !this.announce.posts || this.announce.posts.length == 0;

    return (
      <Host>
        {noPosts && (
          <Fragment>
            <div>{this.app.msgs.post.home.noPosts}</div>
            <a href={`f`}>{this.app.msgs.post.home.newPost}</a>
          </Fragment>
        )}
        {!noPosts && (
          <Fragment>
            <a class="button" href="f">
              +
            </a>
            {this.renderedPosts}
          </Fragment>
        )}
      </Host>
    );
  }
}
