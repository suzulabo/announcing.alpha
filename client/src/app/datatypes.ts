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
