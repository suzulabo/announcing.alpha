import { Component, h, Host, Prop, State } from '@stencil/core';
import { App } from 'src/app/app';
import { AnnounceMetaRule } from 'src/shared';
import { pushRoute } from 'src/shared-ui/utils/route';

@Component({
  tag: 'app-announce-create',
  styleUrl: 'app-announce-create.scss',
})
export class AppAnnounceCreate {
  @Prop()
  app!: App;

  @State()
  values = { name: '', desc: '' };

  private naviLinks = [
    {
      label: this.app.msgs.common.back,
      href: '/',
      back: true,
    },
  ];

  private handlers = {
    input: {
      name: (ev: Event) => {
        this.values = { ...this.values, name: (ev.target as HTMLInputElement).value };
      },
      desc: (ev: Event) => {
        this.values = { ...this.values, desc: (ev.target as HTMLTextAreaElement).value };
      },
    },
    submit: async () => {
      await this.app.processLoading(async () => {
        await this.app.createAnnounce(this.values.name, this.values.desc);
        pushRoute('/', true);
      });
    },
  };

  private renderContext() {
    return {
      msgs: this.app.msgs,
      values: this.values,
      handlers: this.handlers,
      naviLinks: this.naviLinks,
      pageTitle: this.app.msgs.announceCreate.pageTitle,
    };
  }

  render() {
    return render(this.renderContext());
  }
}

type RenderContext = ReturnType<AppAnnounceCreate['renderContext']>;

const render = (ctx: RenderContext) => {
  return (
    <Host>
      <div class="form">
        <ap-input
          label={ctx.msgs.announceCreate.form.name}
          value={ctx.values.name}
          maxLength={AnnounceMetaRule.name.length}
          onInput={ctx.handlers.input.name}
        />
        <ap-input
          textarea={true}
          label={ctx.msgs.announceCreate.form.desc}
          value={ctx.values.desc}
          maxLength={AnnounceMetaRule.desc.length}
          onInput={ctx.handlers.input.desc}
        />
        <button class="submit" disabled={!ctx.values.name} onClick={ctx.handlers.submit}>
          {ctx.msgs.announceCreate.form.btn}
        </button>
      </div>
      <ap-navi links={ctx.naviLinks} />
      <ap-head pageTitle={ctx.pageTitle} />
    </Host>
  );
};
