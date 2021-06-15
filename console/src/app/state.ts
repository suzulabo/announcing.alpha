import { createStore } from '@stencil/store';

const { state } = createStore({ signIn: false });

export class AppState {
  signIn = {
    set: (v: boolean) => {
      state.signIn = v;
    },
    get: () => {
      return state.signIn;
    },
  };
}
