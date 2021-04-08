import { Component, h, Prop } from '@stencil/core';
import dizzy from 'bootstrap-icons/icons/emoji-dizzy.svg';
import github from 'bootstrap-icons/icons/github.svg';
import google from 'bootstrap-icons/icons/google.svg';
import image from 'bootstrap-icons/icons/image.svg';
import trash from 'bootstrap-icons/icons/trash.svg';

const svgMap = {
  github,
  google,
  image,
  trash,
  dizzy,
};

@Component({
  tag: 'ap-icon',
  styleUrl: 'ap-icon.scss',
})
export class ApIcon {
  @Prop()
  icon: 'github' | 'google' | 'image' | 'trash' | 'dizzy';

  render() {
    return <img src={svgMap[this.icon]} />;
  }
}
