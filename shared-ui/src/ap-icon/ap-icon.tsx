import { Component, h, Prop } from '@stencil/core';
import squareChecked from 'bootstrap-icons/icons/check2-square.svg';
import dizzy from 'bootstrap-icons/icons/emoji-dizzy.svg';
import frown from 'bootstrap-icons/icons/emoji-frown.svg';
import github from 'bootstrap-icons/icons/github.svg';
import google from 'bootstrap-icons/icons/google.svg';
import image from 'bootstrap-icons/icons/image.svg';
import square from 'bootstrap-icons/icons/square.svg';
import trash from 'bootstrap-icons/icons/trash.svg';
import twitter from 'bootstrap-icons/icons/twitter.svg';

const svgMap = {
  github,
  google,
  twitter,
  image,
  trash,
  dizzy,
  frown,
  square,
  squareChecked,
};

@Component({
  tag: 'ap-icon',
  styleUrl: 'ap-icon.scss',
})
export class ApIcon {
  @Prop()
  icon:
    | 'github'
    | 'google'
    | 'twitter'
    | 'image'
    | 'trash'
    | 'dizzy'
    | 'frown'
    | 'square'
    | 'squareChecked';

  render() {
    return <img src={svgMap[this.icon]} />;
  }
}
