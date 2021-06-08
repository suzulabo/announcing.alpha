import { Component, Fragment, h, Host, Prop, State } from '@stencil/core';
import { href } from '../utils/route';

const tweetIDPattern = new RegExp('^https://twitter\\.com/.+/status/([0-9]+)$');

@Component({
  tag: 'ap-post',
  styleUrl: 'ap-post.scss',
})
export class ApPost {
  @Prop()
  post!: {
    title?: string;
    body?: string;
    link?: string;
    pT: number;
    imgLoader?: () => Promise<string>;
    imgHref?: string;
  };

  @Prop()
  msgs!: {
    datetime: (v: number) => string;
  };

  @State()
  imageSrc?: string;

  componentWillLoad() {
    if (this.post.imgLoader) {
      this.post
        .imgLoader()
        .then(src => {
          if (src) {
            this.imageSrc = src;
          } else {
            this.imageSrc = 'ERROR';
          }
        })
        .catch(err => {
          console.error('imageLoader Error', err);
          this.imageSrc = 'ERROR';
        });
    }
  }

  private renderImage() {
    if (!this.imageSrc) {
      return <ap-spinner />;
    }

    if (this.imageSrc == 'ERROR') {
      return <ap-icon icon="exclamationDiamondFill" />;
    }

    return (
      <a {...href(this.post.imgHref)}>
        <img src={this.imageSrc} />
      </a>
    );
  }

  private renderTweet(link: string) {
    //
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
        {this.post.imgLoader && <div class="image">{this.renderImage()}</div>}
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
