import { AnnounceState, PostState } from './datatypes';
import { AppFirebase } from './firebase';
import { AppState } from './state';

export class AppData {
  constructor(private appFirebase: AppFirebase, private appState: AppState) {}

  readonly announces = {
    load: () => {
      this.appFirebase.listenAnnounces(async docs => {
        console.log('docs', docs);
        docs.sort((v1, v2) => {
          return v2[1].uT - v1[1].uT;
        });

        const as = [] as AnnounceState[];
        for (const [id, a] of docs) {
          const postsData = [] as PostState[];
          if (a.posts) {
            for (const postID of a.posts) {
              const post = await this.appFirebase.getPost(id, postID);
              if (post) {
                postsData.push({ ...post, id: postID });
              }
            }
          }

          postsData.sort((v1, v2) => {
            return v2.pT - v1.pT;
          });

          const meta = await this.appFirebase.getAnnounceMeta(id, a.mid);

          as.push({ ...a, ...meta, id, postsData });
        }

        this.appState.updateAnnounces(as);
      });
    },
    create: (data: { name: string; desc?: string }) => {
      return this.appFirebase.callCreateAnnounce(data);
    },
    update: (...args: Parameters<AppFirebase['updateAnnounce']>) => {
      return this.appFirebase.updateAnnounce(...args);
    },
    delete: (id: string) => {
      return this.appFirebase.deleteAnnounce(id);
    },
    post: {
      put: (...args: Parameters<AppFirebase['putPost']>) => {
        return this.appFirebase.putPost(...args);
      },
      delete: (...args: Parameters<AppFirebase['deletePost']>) => {
        return this.appFirebase.deletePost(...args);
      },

      get: (...args: Parameters<AppFirebase['getPost']>) => {
        return this.appFirebase.getPost(...args);
      },
    } as const,
    import: (id: string, url: string) => {
      return this.appFirebase.callImportFeed({ id, url });
    },
  } as const;
}
