import { Component, Fragment, h, Host, Prop, Watch } from '@stencil/core';
import { App } from 'src/app/app';
import { ApNaviLinks } from 'src/shared-ui/ap-navi/ap-navi';

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

  private naviLinks!: ApNaviLinks;
  private naviLinksLoading!: ApNaviLinks;

  private loadData() {
    this.app.loadAnnounce(this.announceID);

    this.naviLinks = [
      {
        label: this.app.msgs.common.back,
        href: '/',
        back: true,
      },
      {
        label: this.app.msgs.announce.detail,
        href: `/${this.announceID}/config`,
      },
    ];
    this.naviLinksLoading = [
      {
        label: this.app.msgs.common.back,
        href: '/',
        back: true,
      },
    ];
  }

  componentWillRender() {
    return this.loadData();
  }

  private postLoader = async (postID: string) => {
    const postResult = await this.app.fetchPost(this.announceID, postID);
    if (postResult.state == 'SUCCESS') {
      await this.app.setReadTime(this.announceID, postResult.value.pT);
    }

    return {
      ...postResult,
      href: `/${this.announceID}/${postID}`,
      hrefAttrs: this.app.href(`/${this.announceID}/${postID}`),
    };
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
              <ap-announce
                announce={{
                  ...announce.value,
                  href: `/${this.announceID}/config`,
                  isFollow: follow != null,
                  enableNotification,
                }}
              ></ap-announce>
              <ap-posts
                posts={announce.value.posts}
                postLoader={this.postLoader}
                msgs={{
                  datetime: msgs.common.datetime,
                  dataError: msgs.announce.dataError,
                }}
              />
            </Fragment>
          );
        }
        default:
          return <ap-spinner />;
      }
    };

    return (
      <Host>
        {renderContent()}
        <ap-navi links={announce?.state == 'SUCCESS' ? this.naviLinks : this.naviLinksLoading} />
      </Host>
    );
  }
}
