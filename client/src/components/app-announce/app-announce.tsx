import { Component, Fragment, h, Host, Listen, Prop, State, Watch } from '@stencil/core';
import { App } from 'src/app/app';
import { AnnounceAndMeta, PostJSON } from 'src/shared';
import { ApNaviLinks } from 'src/shared-ui/ap-navi/ap-navi';
import { FirestoreUpdatedEvent } from 'src/shared-ui/utils/firestore';
import { PromiseState } from 'src/shared-ui/utils/promise';

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
    this.announceState = undefined;

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

  @Listen('FirestoreUpdated')
  handleFirestoreUpdated(event: FirestoreUpdatedEvent) {
    const { collection, id } = event.detail;
    if (collection == 'announces' && id == this.announceID) {
      this.announceState = undefined;
    }
  }

  @State()
  announceState?: PromiseState<{
    announce: AnnounceAndMeta;
    iconImgPromise?: PromiseState<string>;
    postsPromises: Record<string, PromiseState<PostJSON>>;
  }>;

  private naviLinks!: ApNaviLinks;
  private naviLinksLoading!: ApNaviLinks;

  componentWillLoad() {
    this.watchAnnounceID();
  }

  private async loadAnnounce() {
    const id = this.announceID;
    const announce = await this.app.getAnnounceAndMeta(id);
    if (announce) {
      return {
        announce,
        iconImgPromise: announce.icon
          ? new PromiseState(this.app.fetchImage(announce.icon))
          : undefined,
        postsPromises: this.app.getPosts(id, announce),
      };
    }
    return;
  }

  componentWillRender() {
    if (!this.announceState) {
      this.announceState = new PromiseState(this.loadAnnounce());
    }
  }

  private renderContent() {
    const announceState = this.announceState;
    if (!announceState) return;

    const msgs = this.app.msgs;
    const enableNotification = this.app.getNotification(this.announceID) != null;
    const follow = this.app.getFollow(this.announceID);

    const status = announceState.status();
    switch (status.state) {
      case 'rejected':
        return (
          <Fragment>
            <div class="data-error">{msgs.announce.dataError}</div>
          </Fragment>
        );
      case 'fulfilled-empty':
        return (
          <Fragment>
            <div class="deleted">{msgs.announce.deleted}</div>
          </Fragment>
        );

      case 'fulfilled': {
        const { announce, iconImgPromise, postsPromises } = status.value;

        this.app.setTitle(this.app.msgs.announce.pageTitle(announce.name));

        return (
          <Fragment>
            <ap-announce
              announce={announce}
              href={`/${this.announceID}/config`}
              iconImgPromise={iconImgPromise}
              icons={{
                isFollow: follow != null,
                enableNotification,
              }}
            ></ap-announce>
            <ap-posts
              posts={announce.posts}
              postsPromises={postsPromises}
              hrefFormat={`/${this.announceID}/:postID`}
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
  }

  render() {
    const links =
      this.announceState?.status().state == 'fulfilled' ? this.naviLinks : this.naviLinksLoading;

    return (
      <Host>
        {this.renderContent()}
        <ap-navi links={links} />
      </Host>
    );
  }
}
