import { _appEnv } from './appenv.env';

export interface AppEnvironment {
  firebaseConfig: {
    readonly apiKey: string;
    readonly authDomain: string;
    readonly projectId: string;
    readonly storageBucket: string;
    readonly messagingSenderId: string;
    readonly appId: string;
  };
  readonly functionsRegion: string;
  readonly vapidKey: string;
  readonly contact: string;
  sites: {
    console: string;
    client: string;
    docs: string;
  };
}

export class AppEnv {
  constructor(readonly env: AppEnvironment = _appEnv) {}
}
