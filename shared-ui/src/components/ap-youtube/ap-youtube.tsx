import { Component, h, Host, Prop } from '@stencil/core';

@Component({
  tag: 'ap-youtube',
  styleUrl: 'ap-youtube.scss',
})
export class ApYoutube {
  @Prop()
  youtubeID?: string;

  render() {
    if (!this.youtubeID) return;

    return (
      <Host>
        <iframe
          src={`https://www.youtube.com/embed/${this.youtubeID}?playsinline=1`}
          frameborder="0"
        />
      </Host>
    );
  }
}
