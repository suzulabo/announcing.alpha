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
