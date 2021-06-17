import { Component, Fragment, h, Host, Listen, Prop, State, Watch } from '@stencil/core';
import { App } from 'src/app/app';
import { Announce, AnnounceMetaBase, PostJSON } from 'src/shared';
import { FirestoreUpdatedEvent } from 'src/shared-ui/utils/firestore';
import { PromiseState } from 'src/shared-ui/utils/promise';
import { href, pushRoute } from 'src/shared-ui/utils/route';

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
        iconImgPromise?: PromiseState<string>;
        postsPromises: Record<string, PromiseState<PostJSON>>;
      }
  >;

  @State()
  postState?: PromiseState<PostJSON & { imgPromise?: PromiseState<string> }>;

  private async loadAnnounce() {
    const id = this.announceID;
    const a = await this.app.getAnnounceAndMeta(id);
    if (a) {
      return {
        ...a,
        imgPromise: a.icon ? new PromiseState(this.app.getImage(a.icon)) : undefined,
        postsPromises: this.app.getPosts(id, a),
      };
    }
    return;
  }

  private async loadPost() {
    const id = this.announceID;
    const postID = this.postID;
    const post = await this.app.getPostJSON(id, postID);
    if (post) {
      return {
        ...post,
        imgPromise: post.img ? new PromiseState(this.app.getImage(post.img)) : undefined,
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

  @State()
  showDelete = false;

  private handleDelete = (ev: Event) => {
    ev.preventDefault();
    this.showDelete = true;
  };

  private handleDeleteModalClose = () => {
    this.showDelete = false;
  };

  private handleDeleteClick = async () => {
    this.showDelete = false;
    this.app.loading = true;
    try {
      await this.app.deletePost(this.announceID, this.postID);
      pushRoute(`/${this.announceID}`, true);
    } finally {
      this.app.loading = false;
    }
  };

  render() {
    if (this.announceState?.noResult() || this.postState?.noResult()) {
      pushRoute(`/${this.announceID}`, true);
      return;
    }

    const announce = this.announceState?.result();
    const post = this.postState?.result();

    const renderContent = () => {
      if (!announce) {
        return <ap-spinner />;
      }

      const apAnnounce = (
        <ap-announce
          announce={announce}
          iconImgPromise={announce.iconImgPromise}
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

      this.app.setTitle(this.app.msgs.post.pageTitle(post.title || post.body?.substr(0, 20) || ''));

      return (
        <Fragment>
          {apAnnounce}
          <ap-post
            post={post}
            imgPromise={post.imgPromise}
            msgs={{ datetime: this.app.msgs.common.datetime }}
          />
        </Fragment>
      );
    };

    return (
      <Host>
        {renderContent()}
        <hr />
        <div class="edit">
          <a {...href(`/${this.announceID}/${this.postID}/edit`)}>{this.app.msgs.post.edit}</a>
          <a href="#" onClick={this.handleDelete}>
            {this.app.msgs.post.delete}
          </a>
        </div>
        {this.showDelete && (
          <ap-modal onClose={this.handleDeleteModalClose}>
            <div class="delete-modal">
              <div>{this.app.msgs.post.deleteConfirm}</div>
              <div class="buttons">
                <button onClick={this.handleDeleteModalClose}>{this.app.msgs.common.cancel}</button>
                <button onClick={this.handleDeleteClick}>{this.app.msgs.common.ok}</button>
              </div>
            </div>
          </ap-modal>
        )}
      </Host>
    );
  }
}
