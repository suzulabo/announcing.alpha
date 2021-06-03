import { Component, h, Host, Prop } from '@stencil/core';
import bell from 'bootstrap-icons/icons/bell.svg';
import squareChecked from 'bootstrap-icons/icons/check2-square.svg';
import dizzy from 'bootstrap-icons/icons/emoji-dizzy.svg';
import frown from 'bootstrap-icons/icons/emoji-frown.svg';
import exclamationDiamondFill from 'bootstrap-icons/icons/exclamation-diamond-fill.svg';
import github from 'bootstrap-icons/icons/github.svg';
import google from 'bootstrap-icons/icons/google.svg';
import heart from 'bootstrap-icons/icons/heart.svg';
import image from 'bootstrap-icons/icons/image.svg';
import square from 'bootstrap-icons/icons/square.svg';
import trash from 'bootstrap-icons/icons/trash.svg';
import twitter from 'bootstrap-icons/icons/twitter.svg';
import xCircle from 'bootstrap-icons/icons/x-circle.svg';

const toHTML = (s: string) => {
  return atob(s.split(',')[1]);
};

const svgMap = {
  github: toHTML(github),
  google: toHTML(google),
  twitter: toHTML(twitter),
  image: toHTML(image),
  trash: toHTML(trash),
  dizzy: toHTML(dizzy),
  frown: toHTML(frown),
  square: toHTML(square),
  squareChecked: toHTML(squareChecked),
  xCircle: toHTML(xCircle),
  exclamationDiamondFill: toHTML(exclamationDiamondFill),
  heart: toHTML(heart),
  bell: toHTML(bell),
};
export type Icons = keyof typeof svgMap;

@Component({
  tag: 'ap-icon',
  styleUrl: 'ap-icon.scss',
})
export class ApIcon {
  @Prop()
  icon?: Icons;

  render() {
    return <Host innerHTML={this.icon && svgMap[this.icon]}></Host>;
  }
}
