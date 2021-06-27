import { Component, Fragment, h, Host, Prop } from '@stencil/core';
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

  private naviLinks: ApNaviLinks = [
    {
      label: this.app.msgs.common.back,
      href: '/',
      back: true,
    },
  ];

  private async toggleConfig(key: keyof ClientConfig) {
    const config = this.app.getConfig() || {};
    config[key] = !config[key];
    await this.app.setConfig(config);
  }

  private handlers = {
    embedTwitter: async () => {
      await this.toggleConfig('embedTwitter');
    },
    embedYoutube: async () => {
      await this.toggleConfig('embedYoutube');
    },
  };

  private renderContext() {
    return {
      msgs: this.app.msgs,
      config: this.app.getConfig() || {},
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
