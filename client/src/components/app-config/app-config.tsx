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

  private config!: ClientConfig;

  private naviLinks: ApNaviLinks = [
    {
      label: this.app.msgs.common.back,
      href: '/',
      back: true,
    },
  ];

  async componentWillRender() {
    this.config = (await this.app.getConfig()) || {};
  }

  private renderContext() {
    return {
      msgs: this.app.msgs,
      config: this.config,
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
  return <Fragment>neko{JSON.stringify(ctx.config)}</Fragment>;
};
