import { Component, h, Host, Method, Prop } from '@stencil/core';

@Component({
  tag: 'ap-head',
})
export class ApHead {
  @Prop({ attribute: 'pageTitle' })
  pageTitle?: string;

  @Method()
  writeHead() {
    if (this.pageTitle) {
      document.title = this.pageTitle;
    }

    return Promise.resolve();
  }

  render() {
    void this.writeHead();

    return <Host></Host>;
  }
}
