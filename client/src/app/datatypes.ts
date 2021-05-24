import { Announce, AnnounceMetaJSON } from 'src/shared';

export interface Follow {
  name: string; // Needed after deleted
  readTime: number;
}

export type DataResult<T> =
  | { state: 'NOT_FOUND' | 'DATA_ERROR' }
  | {
      state: 'SUCCESS';
      value: T;
    };

export interface NotFound {
  state: 'NOT_FOUND';
}
export const NOT_FOUND: NotFound = { state: 'NOT_FOUND' };

export interface DataError {
  state: 'DATA_ERROR';
}
export const DATA_ERROR: DataError = { state: 'DATA_ERROR' };

export interface AnnounceState extends Announce, AnnounceMetaJSON {
  id: string;
  iconLoader?: () => Promise<string>;
}

export class PostNotificationRecievedEvent extends CustomEvent<{
  announceID: string;
  postID: string;
}> {
  constructor(detail: { announceID: string; postID: string }) {
    super('PostNotificationRecieved', { detail });
  }
}

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
