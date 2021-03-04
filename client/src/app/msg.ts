import { msgs as jaMsgs } from './msgs/msg.ja';

const lang = 'ja';

const msgsMap = {
  ja: jaMsgs,
};

export const msgs = () => {
  return msgsMap[lang];
};

export const getLang = () => {
  return lang;
};

export class AppMsg {
  get lang() {
    return lang;
  }
  get msgs() {
    return msgsMap[lang];
  }
}
