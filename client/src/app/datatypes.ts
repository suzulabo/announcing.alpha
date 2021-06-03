import { Announce, AnnounceMetaJSON, PostJSON } from 'src/shared';

export interface Follow {
  name: string; // Needed after deleted
  readTime: number;
}

export interface AnnounceState extends Announce, AnnounceMetaJSON {
  id: string;
  latestPost?: PostJSON;
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
