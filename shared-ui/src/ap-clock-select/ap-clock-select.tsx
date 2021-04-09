import { Component, Event, EventEmitter, h, Host, Prop, State } from '@stencil/core';

@Component({
  tag: 'ap-clock-select',
  styleUrl: 'ap-clock-select.scss',
})
export class ApClockSelect {
  @Prop()
  msgs: {
    am: string;
    pm: string;
  };

  @Prop()
  selected: number[];

  @Event()
  hourClick: EventEmitter<number>;

  @State()
  ampm: 'am' | 'pm' = 'am';

  private handleAMClick = () => {
    this.ampm = 'am';
  };

  private handlePMClick = () => {
    this.ampm = 'pm';
  };

  private handleItemClick = (event: Event) => {
    const v = parseInt((event.target as HTMLElement).getAttribute('data-hour'));
    this.hourClick.emit(v);
  };

  render() {
    const hourStart = this.ampm == 'am' ? 0 : 12;

    return (
      <Host>
        <div class="outer">
          {[...Array(12)].map((_, i) => {
            return (
              <span
                class={{
                  hour: true,
                  [`hour${i}`]: true,
                  selected: this.selected?.includes(i + hourStart),
                }}
                data-hour={i + hourStart}
                onClick={this.handleItemClick}
              >
                {i}
              </span>
            );
          })}
          <div class="ampm">
            <span class={{ selected: this.ampm == 'am' }} onClick={this.handleAMClick}>
              {this.msgs.am}
            </span>
            <span class={{ selected: this.ampm == 'pm' }} onClick={this.handlePMClick}>
              {this.msgs.pm}
            </span>
          </div>
        </div>
      </Host>
    );
  }
}
