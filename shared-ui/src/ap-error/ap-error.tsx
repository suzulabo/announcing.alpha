import { Component, h, Host, Listen, Prop, State } from '@stencil/core';

@Component({
  tag: 'ap-error',
  styleUrl: 'ap-error.scss',
})
export class ApError {
  @Prop()
  msgs: {
    main: string;
    close: string;
    showErrors: string;
    datetime: (d: number) => string;
  } = {
    main: 'Woops!\nPlease try again later',
    close: 'Close',
    showErrors: 'Show errors',
    datetime: (d: number) => {
      return new Date(d).toLocaleString();
    },
  };

  @State()
  show = false;

  @State()
  showErrors = false;

  private errors = [] as { time: Date; msg: string }[];

  private addError(msg: string) {
    this.errors.push({ time: new Date(), msg: msg });
    this.show = true;
    this.showErrors = false;
  }

  @Listen('error', { target: 'window' })
  handleError(event: ErrorEvent) {
    console.error('handleError', event);
    event.preventDefault();

    this.addError(event.error.stack);
  }

  @Listen('unhandledrejection', { target: 'window' })
  handleUnhandledRejection(event: PromiseRejectionEvent) {
    console.error('handleUnhandledRejection', event);
    event.preventDefault();

    const reason = event.reason;
    this.addError(reason?.toString() || reason?.message);
  }

  private handleClose = () => {
    this.show = false;
  };

  private handleShowErrors = () => {
    this.showErrors = true;
  };

  render() {
    return (
      <Host>
        {this.show && (
          <ap-modal onClose={this.handleClose}>
            <div class="error-modal">
              <ap-icon icon="dizzy" />
              <span class="main">{this.msgs.main}</span>
              <button class="slim" onClick={this.handleClose}>
                {this.msgs.close}
              </button>
              {!this.showErrors && (
                <button class="anchor show-errors" onClick={this.handleShowErrors}>
                  {this.msgs.showErrors}
                </button>
              )}
              {this.showErrors && (
                <div class="errors">
                  {[...this.errors]
                    .reverse()
                    .map(v => {
                      return `${this.msgs.datetime(v.time.getTime())}\n${v.msg}\n`;
                    })
                    .join('\n')}
                </div>
              )}
            </div>
          </ap-modal>
        )}
      </Host>
    );
  }
}
