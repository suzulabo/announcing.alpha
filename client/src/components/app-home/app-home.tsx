import { Component, h, Host, Listen, Prop, State } from '@stencil/core';
import { App } from 'src/app/app';
import { Follow } from 'src/app/datatypes';
import { AnnounceAndMeta, PostJSON } from 'src/shared';
import { FirestoreUpdatedEvent } from 'src/shared-ui/utils/firestore';
import { PromiseState } from 'src/shared-ui/utils/promise';
import { href } from 'src/shared-ui/utils/route';

@Component({
  tag: 'app-home',
  styleUrl: 'app-home.scss',
})
export class AppHome {
  @State()
  rerender = {};

  @Prop()
  app!: App;

  @Listen('FirestoreUpdated')
  handleFirestoreUpdated(event: FirestoreUpdatedEvent) {
    const { collection, id } = event.detail;
    if (collection == 'announces') {
      if (this.announceStateMap.has(id)) {
        this.announceStateMap.set(id, new PromiseState(this.loadAnnounce(id)));
      }
      this.rerender = {};
    }
  }

  private announceStateMap = new Map<
    string,
    PromiseState<{
      announce: AnnounceAndMeta;
      iconImgPromise?: PromiseState<string>;
      latestPost?: PostJSON;
    }>
  >();

  private async loadAnnounce(id: string) {
    const announce = await this.app.getAnnounceAndMeta(id);
    if (announce) {
      const latestPost = await this.app.getLatestPost(id, announce);
      return {
        announce,
        iconImgPromise: announce.icon
          ? new PromiseState(this.app.fetchImage(announce.icon))
          : undefined,
        latestPost,
      };
    }
    return;
  }

  componentWillLoad() {
    this.app.setTitle(this.app.msgs.home.pageTitle);
  }

  componentWillRender() {
    const follows = this.app.getFollows();
    for (const [id] of follows) {
      if (!this.announceStateMap.has(id)) {
        this.announceStateMap.set(id, new PromiseState(this.loadAnnounce(id)));
      }
    }
  }

  private handleUnfollowClick = async (event: Event) => {
    const id = (event.target as HTMLElement).getAttribute('data-announce-id');
    if (id) {
      await this.app.processLoading(async () => {
        await this.app.deleteFollow(id);
      });
    }
  };

  private renderAnnounce(id: string, follow: Follow) {
    const msgs = this.app.msgs;
    const announceState = this.announceStateMap.get(id);
    if (!announceState) return;

    const status = announceState.status();

    switch (status.state) {
      case 'rejected':
      case 'fulfilled-empty':
        return (
          <a class="card">
            <div class="main">
              <span class="name">{follow.name}</span>
              <span class="data-error">
                {status.state == 'rejected' ? msgs.home.dataError : msgs.home.notFound}
              </span>
              <button class="anchor" data-announce-id={id} onClick={this.handleUnfollowClick}>
                {msgs.home.unfollowBtn}
              </button>
            </div>
          </a>
        );
      case 'fulfilled': {
        const { announce, iconImgPromise, latestPost } = status.value;
        const hasNew = (latestPost?.pT || 0) > follow.readTime;

        return (
          <a class="card" {...href(`/${id}`)}>
            <div class="main">
              <span class="name">{announce.name}</span>
              {latestPost && (
                <div class="latest">
                  {hasNew && <span class="badge">{msgs.home.newBadge}</span>}
                  <span class="pT">{msgs.common.datetime(latestPost?.pT)}</span>
                  <span class="title">{latestPost.title || latestPost.body}</span>
                </div>
              )}
            </div>
            {iconImgPromise && <ap-image srcPromise={iconImgPromise} />}
          </a>
        );
      }
      default:
        <a class="card">
          <ap-spinner />
        </a>;
    }
  }

  private renderAnnounces() {
    const follows = this.app.getFollows();

    if (follows.length == 0) {
      return <div class="no-follows">{this.app.msgs.home.noFollows}</div>;
    }

    return (
      <div class="announces">
        {follows?.map(([id, follow]) => {
          return this.renderAnnounce(id, follow);
        })}
      </div>
    );
  }

  render() {
    return <Host>{this.renderAnnounces()}</Host>;
  }
}
