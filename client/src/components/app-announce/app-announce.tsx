import { Component, Fragment, h, Host, Listen, Prop, State, Watch } from '@stencil/core';
import { App } from 'src/app/app';
import { FirestoreUpdatedEvent } from 'src/app/firebase';
import { Announce, AnnounceMetaBase, PostJSON } from 'src/shared';
import { ApNaviLinks } from 'src/shared-ui/ap-navi/ap-navi';
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

  private naviLinks!: ApNaviLinks;
  private naviLinksLoading!: ApNaviLinks;

  componentWillLoad() {
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

  private async loadAnnounce(id: string) {
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

  componentWillRender() {
    if (!this.announceState) {
      this.announceState = new PromiseState(this.loadAnnounce(this.announceID));
    }
  }

  render() {
    const announceState = this.announceState;
    if (!announceState) {
      return;
    }

    const msgs = this.app.msgs;
    const enableNotification = this.app.getNotification(this.announceID) != null;
    const follow = this.app.getFollow(this.announceID);
    const state = announceState.state();

    const renderContent = () => {
      switch (state) {
        case 'rejected':
          return (
            <Fragment>
              <div class="data-error">{msgs.announce.dataError}</div>
            </Fragment>
          );
        case 'fulfilled': {
          const announce = announceState.result();
          if (!announce) {
            return (
              <Fragment>
                <div class="deleted">{msgs.announce.deleted}</div>
              </Fragment>
            );
          }

          this.app.setTitle(this.app.msgs.announce.pageTitle(announce.name));

          return (
            <Fragment>
              <ap-announce
                announce={announce}
                href={`/${this.announceID}/config`}
                announceIcon={announce.announceIcon}
                icons={{
                  isFollow: follow != null,
                  enableNotification,
                }}
              ></ap-announce>
              <ap-posts
                posts={announce.posts}
                postsPromises={announce.postsPromises}
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
    };

    return (
      <Host>
        {renderContent()}
        <ap-navi links={announceState.result() ? this.naviLinks : this.naviLinksLoading} />
      </Host>
    );
  }
}
