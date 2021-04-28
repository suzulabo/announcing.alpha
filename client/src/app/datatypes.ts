import { Announce, AnnounceMetaJSON } from 'src/shared';

export interface Follow {
  name: string; // Needed after deleted
  notify: { enable: boolean; hours: number[] };
  readTime: number;
}

export interface AnnounceState extends Announce, AnnounceMetaJSON {
  id: string;
  iconData?: string;
}
