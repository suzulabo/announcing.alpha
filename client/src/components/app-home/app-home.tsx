import { Component, FunctionalComponent, h, Host, Listen, Prop, State } from '@stencil/core';
import { App } from 'src/app/app';
import { Follow } from 'src/app/datatypes';
import { FirestoreUpdatedEvent } from 'src/app/firebase';
import { Announce, AnnounceMetaBase, PostJSON } from 'src/shared';
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
    PromiseState<
      Announce &
        AnnounceMetaBase & {
          announceIcon?: PromiseState<string>;
          latestPost?: PostJSON;
        }
    >
  >();

  private async loadAnnounce(id: string) {
    const a = await this.app.getAnnounceAndMeta(id);
    if (a) {
      const post = await this.app.getLatestPost(id, a);
      return {
        ...a,
        announceIcon: a.icon ? new PromiseState(this.app.fetchImage(a.icon)) : undefined,
        latestPost: post,
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

  private renderAnnounces() {
    const follows = this.app.getFollows();

    if (follows.length == 0) {
      return <div class="no-follows">{this.app.msgs.home.noFollows}</div>;
    }

    const msgs = this.app.msgs;

    const renderAnnounceCard = (id: string, follow: Follow) => {
      const announceState = this.announceStateMap.get(id);
      if (!announceState || announceState.state() == 'pending') {
        return (
          <AnnounceCard>
            <ap-spinner />
          </AnnounceCard>
        );
      }

      const announce = announceState.result();
      if (!announce) {
        return (
          <AnnounceCard>
            <div class="main">
              <span class="name">{follow.name}</span>
              <span class="data-error">
                {announceState.error() ? msgs.home.dataError : msgs.home.notFound}
              </span>
              <button class="anchor" data-announce-id={id} onClick={this.handleUnfollowClick}>
                {msgs.home.unfollowBtn}
              </button>
            </div>
          </AnnounceCard>
        );
      }

      const latestPost = announce.latestPost;
      const hasNew = (latestPost?.pT || 0) > follow.readTime;

      return (
        <AnnounceCard href={`/${id}`}>
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
          {announce.announceIcon && <ap-image srcPromise={announce.announceIcon} />}
        </AnnounceCard>
      );
    };

    return (
      <div class="announces">
        {follows?.map(([id, follow]) => {
          return renderAnnounceCard(id, follow);
        })}
      </div>
    );
  }

  render() {
    return <Host>{this.renderAnnounces()}</Host>;
  }
}

const AnnounceCard: FunctionalComponent<{ href?: string }> = (props, children) => {
  return (
    <a class="card" {...href(props.href)}>
      {children}
    </a>
  );
};
