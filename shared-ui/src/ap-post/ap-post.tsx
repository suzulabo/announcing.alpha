import { Component, h, Host, Prop } from '@stencil/core';

@Component({
  tag: 'ap-post',
  styleUrl: 'ap-post.scss',
})
export class ApTextView {
  @Prop()
  post: {
    title?: string;
    body?: string;
    link?: string;
    imgData?: string;
    pT: number;
  };

  @Prop()
  msgs: {
    datetime: (v: number) => string;
  };

  render() {
    const post = this.post;

    return (
      <Host>
        {this.post.imgData && <img src={post.imgData} />}
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
