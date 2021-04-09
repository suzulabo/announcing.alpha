import { Component, Event, EventEmitter, h, Host, Prop } from '@stencil/core';

@Component({
  tag: 'ap-clock-select',
  styleUrl: 'ap-clock-select.scss',
})
export class ApClockSelect {
  @Prop()
  selected: number[];

  @Event()
  hourClick: EventEmitter<number>;

  private handleItemClick = (event: Event) => {
    const v = parseInt((event.target as HTMLElement).getAttribute('data-hour'));
    this.hourClick.emit(v);
  };

  render() {
    return (
      <Host>
        <div class="outer">
          {[...Array(12)].map((_, i) => {
            return (
              <span
                class={{ [`hour${i}`]: true, selected: this.selected?.includes(i) }}
                data-hour={i}
                onClick={this.handleItemClick}
              >
                {i}
              </span>
            );
          })}
        </div>
      </Host>
    );
  }
}
