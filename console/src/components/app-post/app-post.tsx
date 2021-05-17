import { Component, h, Host, Prop, State } from '@stencil/core';
import { App } from 'src/app/app';
import { AnnounceState } from 'src/app/datatypes';
import { PostJSON } from 'src/shared';

@Component({
  tag: 'app-post',
  styleUrl: 'app-post.scss',
})
export class AppPost {
  @Prop()
  app: App;

  @Prop()
  announceID: string;

  @Prop()
  postID: string;

  @State()
  showDelete = false;

  private announce: AnnounceState;
  private post: PostJSON & { imgData?: string };

  async componentWillLoad() {
    await this.app.processLoading(async () => {
      await this.app.loadAnnounce(this.announceID);

      const as = this.app.getAnnounceState(this.announceID);
      if (!as) {
        this.app.pushRoute(`/${this.announceID}`, true);
        return;
      }
      this.announce = as;

      const post = await this.app.getPost(this.announceID, this.postID);
      if (!post) {
        this.app.pushRoute(`/${this.announceID}`, true);
        return;
      }
      this.post = { ...post, pT: post.pT.toMillis() };

      if (this.post.img) {
        this.post.imgData = await this.app.getImage(this.post.img);
      }

      this.app.setTitle(
        this.app.msgs.post.pageTitle(this.post.title || this.post.body.substr(0, 20)),
      );
    });
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
      this.app.pushRoute(`/${this.announceID}`, true);
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
        <a class="back" {...this.app.href(`/${this.announceID}`, true)}>
          {this.app.msgs.common.back}
        </a>
        <hr />
        <div class="edit">
          <a {...this.app.href(`/${this.announceID}/${this.postID}/edit_`)}>
            {this.app.msgs.post.edit}
          </a>
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
