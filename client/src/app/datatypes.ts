import { Announce, AnnounceMetaJSON } from 'src/shared';

export interface Follow {
  name: string; // Needed after deleted
  readTime: number;
}

export const NOT_FOUND = 'NOT_FOUND';
export type NotFound = typeof NOT_FOUND;

export const FETCH_ERROR = 'FETCH_ERROR';
export type FetchError = typeof FETCH_ERROR;

export interface AnnounceState extends Announce, AnnounceMetaJSON {
  id: string;
  iconLoader?: () => Promise<string>;
}

export class NotifyPostEvent extends CustomEvent<{ announceID: string; postID: string }> {}

/*
import { Announce, AnnounceMetaJSON } from 'src/shared';

export interface Follow {
  name: string; // Needed after deleted
  readTime: number;
}

export type DataResult<T> =
  | {
      state: 'SUCCESS';
      value: T;
    }
  | { state: 'NOT_FOUND' | 'ERROR'; value?: T };

export const successResult = <T>(value: T): DataResult<T> => {
  if (!value) {
    return;
  }
  return {
    state: 'SUCCESS',
    value,
  };
};
export const notFoundResult = <T>(): DataResult<T> => {
  return { state: 'NOT_FOUND' };
};
export const errorResult = <T>(): DataResult<T> => {
  return { state: 'ERROR' };
};

export interface AnnounceData extends Announce, AnnounceMetaJSON {
  id: string;
  iconLoader?: () => Promise<string>;
}

export class AnnounceUpdatedEvent extends CustomEvent<{ announceID: string }> {
  constructor(detail: { announceID: string }) {
    super('AnnounceUpdated', { detail });
  }
}
export class PostNotificationRecievedEvent extends CustomEvent<{
  announceID: string;
  postID: string;
}> {
  constructor(detail: { announceID: string; postID: string }) {
    super('PostNotificationRecieved', { detail });
  }
}

*/
