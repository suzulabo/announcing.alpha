import { Component, h, Host, Listen, Prop, State } from '@stencil/core';
import assert from 'assert';
import { App } from 'src/app/app';
import { ApNaviLinks } from 'src/shared-ui/ap-navi/ap-navi';
import { FirestoreUpdatedEvent } from 'src/shared-ui/utils/firestore';
import { PageVisible } from 'src/shared-ui/utils/pagevisible';
import { PromiseState } from 'src/shared-ui/utils/promise';
import { href } from 'src/shared-ui/utils/route';
import { AsyncReturnType } from 'type-fest';

@Component({
  tag: 'app-home',
  styleUrl: 'app-home.scss',
})
export class AppHome {
  @Prop()
  pageVisible!: PageVisible;

  componentShouldUpdate() {
    return this.pageVisible.shouldUpdate();
  }

  @Listen('PageActivated')
  listenPageActivated() {
    this.rerender = {};
  }

  @Listen('AppBackButton', { target: 'window' })
  handleAppBackButton() {
    if (this.pageVisible.isVisible()) {
      this.app.exitApp();
    }
  }

  @Listen('FirestoreUpdated', { target: 'window' })
  handleFirestoreUpdated(event: FirestoreUpdatedEvent) {
    const { collection, id } = event.detail;
    if (collection == 'announces') {
      if (this.announceStateMap.has(id)) {
        this.announceStateMap.set(id, new PromiseState(this.loadAnnounce(id)));
      }
      this.rerender = {};
    }
  }

  @State()
  rerender = {};

  @Prop()
  app!: App;

  private announceStateMap = new Map<
    string,
    PromiseState<AsyncReturnType<AppHome['loadAnnounce']>>
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

  private naviLinks: ApNaviLinks = [
    {
      label: '',
    },
    {
      label: this.app.msgs.home.config,
      href: '/config',
    },
    {
      label: this.app.msgs.home.about,
      href: '/about',
    },
  ];

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

  private renderContext() {
    const follows = this.app.getFollows();
    const announces = follows.map(([id, follow]) => {
      const state = this.announceStateMap.get(id);
      assert(state);
      const status = state.status();
      return {
        id,
        status,
        follow,
      };
    });

    const pT = (status: typeof announces[number]['status']) => {
      if (status.state == 'fulfilled') {
        return status.value.latestPost?.pT || 0;
      }
      return 0;
    };

    announces.sort((a1, a2) => {
      return pT(a2.status) - pT(a1.status);
    });

    return {
      msgs: this.app.msgs,
      pageTitle: this.app.msgs.home.pageTitle,
      announces,
      naviLinks: this.naviLinks,
      handleUnfollowClick: this.handleUnfollowClick,
    };
  }

  render() {
    return render(this.renderContext());
  }
}

type RenderContext = ReturnType<AppHome['renderContext']>;

const render = (ctx: RenderContext) => {
  return (
    <Host>
      {renderContent(ctx)}
      <ap-navi links={ctx.naviLinks} />
      <ap-head pageTitle={ctx.pageTitle} />
    </Host>
  );
};

const renderContent = (ctx: RenderContext) => {
  if (ctx.announces.length == 0) {
    return <div class="no-follows">{ctx.msgs.home.noFollows}</div>;
  }

  return (
    <div class="announces">
      {ctx.announces.map(v => {
        return renderAnnounce(ctx, v);
      })}
    </div>
  );
};

const renderAnnounce = (ctx: RenderContext, a: RenderContext['announces'][number]) => {
  const msgs = ctx.msgs;
  const { id, status, follow } = a;

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
            <button class="anchor" data-announce-id={id} onClick={ctx.handleUnfollowClick}>
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
      return (
        <a class="card">
          <ap-spinner />
        </a>
      );
  }
};
