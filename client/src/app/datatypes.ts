import { Announce, AnnounceMeta } from 'announsing-shared';

export interface AnnounceState extends Announce, AnnounceMeta {
  id: string;
  iconData?: string;
}
