import { NotificationMode } from 'src/shared';

export interface Follow {
  notify: { mode: NotificationMode; hours: number[] };
  readTime: number;
}
