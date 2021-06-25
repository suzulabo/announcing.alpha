import { Component, Fragment, h, Host, Prop, State } from '@stencil/core';
import { App } from 'src/app/app';
import { ClientConfig } from 'src/app/datatypes';
import { ApNaviLinks } from 'src/shared-ui/ap-navi/ap-navi';

@Component({
  tag: 'app-config',
  styleUrl: 'app-config.scss',
})
export class AppConfig {
  @Prop()
  app!: App;

  @State()
  config?: ClientConfig;

  private naviLinks: ApNaviLinks = [
    {
      label: this.app.msgs.common.back,
      href: '/',
      back: true,
    },
  ];

  private handlers = {
    noStoreHistory: async () => {
      if (this.config) {
        this.config.noStoreHistory = !this.config.noStoreHistory;
        await this.app.setConfig(this.config);
        this.config = undefined;
      }
    },
    embedTwitter: async () => {
      if (this.config) {
        this.config.embedTwitter = !this.config.embedTwitter;
        await this.app.setConfig(this.config);
        this.config = undefined;
      }
    },
    embedYoutube: async () => {
      if (this.config) {
        this.config.embedYoutube = !this.config.embedYoutube;
        await this.app.setConfig(this.config);
        this.config = undefined;
      }
    },
  };

  async componentWillRender() {
    this.config = (await this.app.getConfig()) || {};
  }

  private renderContext() {
    return {
      msgs: this.app.msgs,
      config: this.config || {},
      handlers: this.handlers,
      naviLinks: this.naviLinks,
      pageTitle: this.app.msgs.config.pageTitle,
    };
  }

  render() {
    return render(this.renderContext());
  }
}

type RenderContext = ReturnType<AppConfig['renderContext']>;

const render = (ctx: RenderContext) => {
  return (
    <Host>
      {renderForm(ctx)}
      <ap-navi links={ctx.naviLinks} />
      <ap-head pageTitle={ctx.pageTitle} />
    </Host>
  );
};

const renderForm = (ctx: RenderContext) => {
  return (
    <Fragment>
      <div class="form">
        <ap-checkbox
          label={ctx.msgs.config.noStoreHistory}
          checked={ctx.config.noStoreHistory}
          onClick={ctx.handlers.noStoreHistory}
        />
        <hr />
        <ap-checkbox
          label={ctx.msgs.config.embedTwitter}
          checked={ctx.config.embedTwitter}
          onClick={ctx.handlers.embedTwitter}
        />
        <ap-textview class="desc" text={ctx.msgs.config.embedTwitterDesc} />
        <hr />
        <ap-checkbox
          label={ctx.msgs.config.embedYoutube}
          checked={ctx.config.embedYoutube}
          onClick={ctx.handlers.embedYoutube}
        />
        <ap-textview class="desc" text={ctx.msgs.config.embedYoutubeDesc} />
      </div>
    </Fragment>
  );
};
