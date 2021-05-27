import { Component, h, Host, Prop, State } from '@stencil/core';

@Component({
  tag: 'ap-post',
  styleUrl: 'ap-post.scss',
})
export class ApTextView {
  @Prop()
  post!: {
    title?: string;
    body?: string;
    link?: string;
    imgLoader?: () => Promise<string>;
    imgAnchorAttrs?: { [k: string]: any };
    pT: number;
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
      <a {...this.post.imgAnchorAttrs}>
        <img src={this.imageSrc} />
      </a>
    );
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
          <a class="link" href={post.link}>
            {post.link}
          </a>
        )}
      </Host>
    );
  }
}
