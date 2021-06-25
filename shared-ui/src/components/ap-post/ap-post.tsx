import { Component, Fragment, h, Host, Prop } from '@stencil/core';
import { PostJSON } from 'src/shared';
import { PromiseState } from '../utils/promise';

const tweetIDPattern = new RegExp('^https://twitter\\.com/.+/status/([0-9]+)$');

@Component({
  tag: 'ap-post',
  styleUrl: 'ap-post.scss',
})
export class ApPost {
  @Prop()
  post!: PostJSON;

  @Prop()
  imgPromise?: PromiseState<string>;

  @Prop()
  imgHref?: string;

  @Prop()
  msgs!: {
    datetime: (v: number) => string;
  };

  @Prop()
  showTweet?: boolean;

  private renderTweet(link: string) {
    if (!this.showTweet) return;

    const m = link.match(tweetIDPattern);
    if (!m) {
      return;
    }

    const [, tweetID] = m;
    return <ap-twitter tweetID={tweetID} />;
  }

  render() {
    const post = this.post;

    return (
      <Host>
        {this.imgPromise && (
          <div class="image">
            <ap-image srcPromise={this.imgPromise} href={this.imgHref} />
          </div>
        )}
        <span class="date">{this.msgs.datetime(post.pT)}</span>
        {post.title && <span class="title">{post.title}</span>}
        {post.body && <ap-textview class="body" text={post.body} />}
        {post.link && (
          <Fragment>
            {this.renderTweet(post.link)}
            <a class="link" href={post.link}>
              {post.link}
            </a>
          </Fragment>
        )}
      </Host>
    );
  }
}
