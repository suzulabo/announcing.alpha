import { Component, h, Host, Prop, Watch } from '@stencil/core';
import Autolinker from 'autolinker';

@Component({
  tag: 'ap-textview',
  styleUrl: 'ap-textview.scss',
})
export class ApTextView {
  @Prop()
  text?: string;

  private effectedText?: string;

  componentWillLoad() {
    this.effect();
  }

  @Watch('text')
  watchText() {
    this.effect();
  }

  private effect() {
    this.effectedText = Autolinker.link(this.text || '', { stripPrefix: false, newWindow: false });
  }

  render() {
    return <Host innerHTML={this.effectedText}></Host>;
  }
}
