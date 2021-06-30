import { Component, Fragment, h, Host, Prop } from '@stencil/core';
import { App } from 'src/app/app';
import { ApNaviLinks } from 'src/shared-ui/ap-navi/ap-navi';

@Component({
  tag: 'app-about',
  styleUrl: 'app-about.scss',
})
export class AppAbout {
  @Prop()
  app!: App;

  private naviLinks: ApNaviLinks = [
    {
      label: this.app.msgs.common.back,
      href: '/',
      back: true,
    },
  ];
  private renderContext() {
    return {
      msgs: this.app.msgs,
      manualSite: this.app.manualSite,
      buildInfo: this.app.buildInfo,
      naviLinks: this.naviLinks,
      pageTitle: this.app.msgs.about.pageTitle,
    };
  }

  render() {
    return render(this.renderContext());
  }
}

type RenderContext = ReturnType<AppAbout['renderContext']>;

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
      <div class="manual">
        <a href={ctx.manualSite} target="manual" rel="noopener">
          {ctx.msgs.about.manualLink}
        </a>
      </div>
      <div class="about">
        <span class="name">Announcing♪ Client</span>
        <span class="version">Version: {ctx.buildInfo.src}</span>
        <span class="build-time">Built at: {ctx.msgs.common.datetime(ctx.buildInfo.time)}</span>
        <a href="https://github.com/suzulabo/announcing" target="_blank" rel="noopener">
          <ap-icon icon="github" />
        </a>
      </div>
    </Fragment>
  );
};
