import { Announce, AnnounceMeta } from 'src/shared';

export interface AnnounceState extends Announce, AnnounceMeta {
  id: string;
  iconData?: string;
  iconLoader?: () => Promise<string>;
}
