import { Component, Fragment, h, Host, Listen, Prop, State, Watch } from '@stencil/core';
import { App } from 'src/app/app';
import { Announce, AnnounceMetaBase, PostJSON } from 'src/shared';
import { ApNaviLinks } from 'src/shared-ui/ap-navi/ap-navi';
import { FirestoreUpdatedEvent } from 'src/shared-ui/utils/firestore';
import { PromiseState } from 'src/shared-ui/utils/promise';
import { pushRoute } from 'src/shared-ui/utils/route';

@Component({
  tag: 'app-post',
  styleUrl: 'app-post.scss',
})
export class AppPost {
  @Prop()
  app!: App;

  @Prop()
  announceID!: string;

  @Watch('announceID')
  watchAnnounceID() {
    this.announceState = undefined;

    this.naviLinksLoading = [
      {
        label: this.app.msgs.common.back,
        href: `/${this.announceID}`,
        back: true,
      },
    ];
    this.naviLinks = [...this.naviLinksLoading];
    if (this.app.checkShareSupport()) {
      this.naviLinks.push({
        label: this.app.msgs.post.share,
        handler: this.shareClick,
      });
    }
  }

  @Prop()
  postID!: string;

  @Watch('postID')
  watchPostID() {
    this.postState = undefined;
  }

  @Listen('FirestoreUpdated')
  handleFirestoreUpdated(event: FirestoreUpdatedEvent) {
    const { collection, id } = event.detail;
    if (collection == 'announces' && id == this.announceID) {
      this.announceState = undefined;
    }
  }

  @State()
  announceState?: PromiseState<
    Announce &
      AnnounceMetaBase & {
        announceIcon?: PromiseState<string>;
        postsPromises: Record<string, PromiseState<PostJSON>>;
      }
  >;

  @State()
  postState?: PromiseState<PostJSON & { imgPromise?: PromiseState<string>; imgHref?: string }>;

  private naviLinks!: ApNaviLinks;
  private naviLinksLoading!: ApNaviLinks;

  private async loadAnnounce() {
    const id = this.announceID;
    const a = await this.app.getAnnounceAndMeta(id);
    if (a) {
      return {
        ...a,
        announceIcon: a.icon ? new PromiseState(this.app.fetchImage(a.icon)) : undefined,
        postsPromises: this.app.getPosts(id, a),
      };
    }
    return;
  }

  private async loadPost() {
    const id = this.announceID;
    const postID = this.postID;
    const post = await this.app.fetchPost(id, postID);
    if (post) {
      return {
        ...post,
        imgPromise: post.img ? new PromiseState(this.app.fetchImage(post.img)) : undefined,
        imgHref: post.img ? `/${this.announceID}/${this.postID}/image/${post.img}` : undefined,
      };
    }
    return;
  }

  componentWillLoad() {
    this.watchAnnounceID();
  }

  componentWillRender() {
    if (!this.announceState) {
      this.announceState = new PromiseState(this.loadAnnounce());
    }
    if (!this.postState) {
      this.postState = new PromiseState(this.loadPost());
    }
  }

  private shareClick = async () => {
    try {
      await this.app.share(`${this.app.clientSite}/${this.announceID}/${this.postID}`);
    } catch {
      //
    }
  };

  render() {
    if (this.announceState?.noResult() || this.postState?.noResult()) {
      pushRoute(`/${this.announceID}`, true);
      return;
    }

    const announce = this.announceState?.result();
    const post = this.postState?.result();
    const enableNotification = this.app.getNotification(this.announceID) != null;
    const isFollow = this.app.getFollow(this.announceID) != null;

    const renderContent = () => {
      if (!announce) {
        return <ap-spinner />;
      }

      const apAnnounce = (
        <ap-announce
          announce={announce}
          announceIcon={announce.announceIcon}
          icons={{ isFollow, enableNotification }}
          href={`/${this.announceID}`}
        />
      );

      if (!post) {
        return (
          <Fragment>
            {apAnnounce}
            <ap-spinner />
          </Fragment>
        );
      }

      this.app.setTitle(
        this.app.msgs.post.pageTitle(announce.name, post.title || post.body?.substr(0, 20) || ''),
      );

      return (
        <Fragment>
          {apAnnounce}
          <ap-post
            post={post}
            imgPromise={post.imgPromise}
            imgHref={post.imgHref}
            msgs={{ datetime: this.app.msgs.common.datetime }}
          />
        </Fragment>
      );
    };

    const loaded = !!post;

    return (
      <Host>
        {renderContent()}
        <ap-navi links={loaded ? this.naviLinks : this.naviLinksLoading} />
      </Host>
    );
  }
}
