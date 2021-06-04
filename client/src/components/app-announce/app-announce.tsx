import { Component, Fragment, h, Host, Prop, Watch } from '@stencil/core';
import { App } from 'src/app/app';

@Component({
  tag: 'app-announce',
  styleUrl: 'app-announce.scss',
})
export class AppAnnounce {
  @Prop()
  app!: App;

  @Prop()
  announceID!: string;
  @Watch('announceID')
  watchAnnounceID() {
    this.loadData();
  }

  private loadData() {
    this.app.loadAnnounce(this.announceID);
  }

  componentWillRender() {
    return this.loadData();
  }

  private postLoader = async (postID: string) => {
    const postResult = await this.app.fetchPost(this.announceID, postID);
    if (postResult.state == 'SUCCESS') {
      await this.app.setReadTime(this.announceID, postResult.value.pT);
    }

    return { ...postResult, hrefAttrs: this.app.href(`/${this.announceID}/${postID}`) };
  };

  render() {
    const msgs = this.app.msgs;
    const enableNotification = this.app.getNotification(this.announceID) != null;
    const follow = this.app.getFollow(this.announceID);

    const announce = this.app.getAnnounceState(this.announceID);

    const renderContent = () => {
      switch (announce?.state) {
        case 'NOT_FOUND':
          return (
            <Fragment>
              <div class="deleted">{msgs.announce.deleted}</div>
            </Fragment>
          );
        case 'DATA_ERROR':
          return (
            <Fragment>
              <div class="data-error">{msgs.announce.dataError}</div>
            </Fragment>
          );
        case 'SUCCESS': {
          this.app.setTitle(this.app.msgs.announce.pageTitle(announce.value.name));

          return (
            <Fragment>
              <a class="back" {...this.app.href('/', true)}>
                {msgs.common.back}
              </a>
              <a class="detail" {...this.app.href(`/${this.announceID}/config`)}>
                {msgs.announce.detail}
              </a>
              <ap-announce
                announce={{
                  ...announce.value,
                  hrefAttrs: this.app.href(`/${this.announceID}/config`),
                  isFollow: follow != null,
                  enableNotification,
                }}
                postLoader={this.postLoader}
                msgs={{
                  datetime: msgs.common.datetime,
                  noPosts: msgs.announce.noPosts,
                  postDataError: msgs.announce.dataError,
                }}
              ></ap-announce>
            </Fragment>
          );
        }
        default:
          return <ap-spinner />;
      }
    };

    return <Host>{renderContent()}</Host>;
  }
}
