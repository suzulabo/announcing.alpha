import { Component, Element, h, Host, Prop, State } from '@stencil/core';
import { twttr } from './twttr';

@Component({
  tag: 'ap-twitter',
  styleUrl: 'ap-twitter.scss',
})
export class ApTwitter {
  @Element()
  el!: HTMLApTwitterElement;

  @Prop()
  tweetID?: string;

  @State()
  twttr?: any;

  componentWillLoad() {
    twttr
      .then(v => {
        this.twttr = v;
      })
      .catch(err => {
        console.error('twttr load error', err);
      });
  }

  componentDidRender() {
    if (!this.twttr) {
      return;
    }
    if (this.tweetID) {
      this.twttr.widgets.createTweet(this.tweetID, this.el, {});
    }
  }

  render() {
    return <Host></Host>;
  }
}
