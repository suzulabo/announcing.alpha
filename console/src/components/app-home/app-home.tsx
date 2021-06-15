import { Component, h, Host, Listen, Prop, State } from '@stencil/core';
import { App } from 'src/app/app';
import { Announce, AnnounceMetaBase, Post, User } from 'src/shared';
import { FirestoreUpdatedEvent } from 'src/shared-ui/utils/firestore';
import { PromiseState } from 'src/shared-ui/utils/promise';
import { href, pushRoute } from 'src/shared-ui/utils/route';

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
    if (collection == 'users') {
      this.userState = undefined;
      return;
    }
    if (collection == 'announces') {
      if (this.announceStateMap.has(id)) {
        this.announceStateMap.set(id, new PromiseState(this.loadAnnounce(id)));
      }
      this.rerender = {};
    }
  }

  @State()
  userState?: PromiseState<User>;

  @State()
  private announceStateMap = new Map<
    string,
    PromiseState<
      Announce &
        AnnounceMetaBase & {
          announceIcon?: PromiseState<string>;
          latestPost?: Post;
        }
    >
  >();

  private async loadAnnounce(id: string) {
    const a = await this.app.getAnnounceAndMeta(id);
    if (a) {
      const post = await this.app.getLatestPost(id, a);
      return {
        ...a,
        announceIcon: a.icon ? new PromiseState(this.app.getImage(a.icon)) : undefined,
        latestPost: post,
      };
    }
    return;
  }

  componentWillRender() {
    if (!this.userState) {
      this.userState = new PromiseState(this.app.getUser());
      this.userState.then(v => {
        if (v?.announces) {
          for (const id of v.announces) {
            this.announceStateMap.set(id, new PromiseState(this.loadAnnounce(id)));
          }
        }
      });
    }
  }

  private handleSignOutClick = async () => {
    await this.app.signOut();
    pushRoute('/signin');
  };

  private renderAnnounces() {
    if (this.userState?.state() == 'pending') {
      return <ap-spinner />;
    }

    if (this.userState?.error()) {
      return <span class="data-error">{this.app.msgs.home.dataError}</span>;
    }

    const user = this.userState?.result();
    if (!user) {
      return;
    }

    return user.announces?.map(id => {
      const announceState = this.announceStateMap.get(id);
      if (!announceState) {
        return;
      }

      const state = announceState.state();
      switch (state) {
        case 'rejected':
          console.error('load announce error', announceState.error());
          return <a class="announce-box">{this.app.msgs.home.dataError}</a>;
        case 'fulfilled': {
          const announce = announceState.result();
          if (!announce) {
            return;
          }
          return (
            <a class="announce-box" {...href(`/${id}`)}>
              <div class="head">
                <span class="name">{announce.name}</span>
                {announce.announceIcon && <ap-image srcPromise={announce.announceIcon} />}
              </div>
              <span class="desc">{announce.desc}</span>
            </a>
          );
        }
        default:
          return (
            <a class="announce-box">
              <ap-spinner />
            </a>
          );
      }
    });
  }

  render() {
    return (
      <Host>
        <div class="announces-grid">{this.renderAnnounces()}</div>
        <a class="create button" {...href('/create')}>
          {this.app.msgs.home.createAnnounceBtn}
        </a>
        <button class="logout anchor" onClick={this.handleSignOutClick}>
          {this.app.msgs.home.signOut}
        </button>
      </Host>
    );
  }
}
