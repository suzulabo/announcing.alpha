import { Component, h, Host, Prop, State } from '@stencil/core';
import { App } from 'src/app/app';
import { AnnounceState } from 'src/app/datatypes';
import { PostJSON } from 'src/shared';
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

  @Prop()
  postID!: string;

  @State()
  showDelete = false;

  private announce!: AnnounceState;
  private post!: PostJSON & { imgData?: string; imgLoader?: () => Promise<string> };

  async componentWillLoad() {
    const as = this.app.getAnnounceState(this.announceID);
    if (as?.state != 'SUCCESS') {
      pushRoute(`/${this.announceID}`, true);
      return;
    }
    this.announce = as.value;

    const post = await this.app.getPost(this.announceID, this.postID);
    if (!post) {
      pushRoute(`/${this.announceID}`, true);
      return;
    }
    this.post = { ...post, pT: post.pT.toMillis() };

    if (this.post.img) {
      this.post.imgData = await this.app.getImage(this.post.img);
      this.post.imgLoader = () => Promise.resolve(this.post.imgData || '');
    }

    this.app.setTitle(
      this.app.msgs.post.pageTitle(this.post.title || this.post.body?.substr(0, 20) || ''),
    );
  }

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
    if (!this.announce || !this.post) {
      return;
    }

    return (
      <Host>
        <ap-post post={this.post} msgs={{ datetime: this.app.msgs.common.datetime }} />
        <a class="back" {...href(`/${this.announceID}`, true)}>
          {this.app.msgs.common.back}
        </a>
        <hr />
        <div class="edit">
          <a {...href(`/${this.announceID}/${this.postID}/edit_`)}>{this.app.msgs.post.edit}</a>
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
