import { Component, Fragment, h, Host, Prop, State, Watch } from '@stencil/core';
import { Announce, DataResult, DATA_ERROR, PostJSON } from 'src/shared';
import { href } from '../utils/route';

export type PostLaoderResult = DataResult<PostJSON> & { href?: string };

type PostsMapValue =
  | (PostLaoderResult & { hrefAttrs?: Record<string, any> })
  | 'LOADING'
  | undefined;

@Component({
  tag: 'ap-posts',
  styleUrl: 'ap-posts.scss',
})
export class ApPosts {
  @Prop()
  posts!: Announce['posts'];
  @Watch('posts')
  watchPosts() {
    const pe = Object.entries(this.posts);
    pe.sort(([, p1], [, p2]) => {
      return p2.pT.toMillis() - p1.pT.toMillis();
    });

    this.postsMap.map = new Map();
    this.visibleMap = new Map();
    const map = this.postsMap.map;
    pe.forEach(([id]) => {
      map.set(id, undefined);
    });
    this.postsMap = { map };

    if (this.iob) {
      this.iob.disconnect();
    }
    this.iob = new IntersectionObserver(this.iobCallback, {
      rootMargin: '100px 0px 100px 0px',
    });
  }

  @Prop()
  postLoader!: (id: string) => Promise<PostLaoderResult>;

  @Prop()
  msgs!: {
    datetime: (d: number) => string;
    dataError: string;
  };

  @State()
  postsMap = {
    map: new Map<string, PostsMapValue>(),
  };

  private visibleMap = new Map<string, boolean>();

  private iob!: IntersectionObserver;

  private iobCallback = (entries: IntersectionObserverEntry[]) => {
    if (entries.length == 0) {
      return;
    }

    const map = this.postsMap.map;

    for (const entry of entries) {
      const postID = entry.target.getAttribute('data-postid');
      if (!postID) {
        continue;
      }

      this.visibleMap.set(postID, entry.isIntersecting);

      if (!entry.isIntersecting) {
        continue;
      }

      if (map.get(postID) != undefined) {
        continue;
      }

      map.set(postID, 'LOADING');

      this.postLoader(postID)
        .then(result => {
          map.set(postID, { ...result, hrefAttrs: result.href ? href(result.href) : undefined });
          this.postsMap = { map };
        })
        .catch(err => {
          console.error('postLoader Error', err);
          map.set(postID, DATA_ERROR);
          this.postsMap = { map };
        });
    }

    this.postsMap = { map };
  };

  componentWillLoad() {
    this.watchPosts();
  }

  disconnectedCallback() {
    this.iob?.disconnect();
  }

  private handleRef = (elm?: HTMLElement) => {
    if (elm) {
      this.iob.observe(elm);
    }
  };

  private renderPost(
    postID: string,
    postResult: PostsMapValue,
  ): { hrefAttrs?: Record<string, any>; el: any } {
    if (!postResult || !this.visibleMap.get(postID)) {
      return { el: <Fragment></Fragment> };
    }

    if (postResult == 'LOADING') {
      return {
        el: <ap-spinner />,
      };
    }

    if (postResult.state != 'SUCCESS') {
      return { el: <Fragment>{this.msgs.dataError}</Fragment> };
    }

    const post = postResult.value;
    return {
      hrefAttrs: postResult.hrefAttrs,
      el: (
        <Fragment>
          <span class="date">{this.msgs.datetime(post.pT)}</span>
          {post.title && <span class="title">{post.title}</span>}
          {post.body && <div class="body">{post.body}</div>}
        </Fragment>
      ),
    };
  }

  render() {
    return (
      <Host>
        {[...this.postsMap.map.entries()].map(([id, result]) => {
          const r = this.renderPost(id, result);
          return (
            <a key={id} data-postid={id} ref={this.handleRef} class="card post" {...r.hrefAttrs}>
              {r.el}
            </a>
          );
        })}
      </Host>
    );
  }
}
