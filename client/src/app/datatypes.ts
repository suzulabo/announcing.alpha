import { NotificationMode } from 'announsing-shared';

export interface Follow {
  notify: { mode: NotificationMode; hours: number[] };
  readTime: number;
}
