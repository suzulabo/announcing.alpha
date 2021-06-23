import { Component, Element, Event, EventEmitter, h, Host } from '@stencil/core';

@Component({
  tag: 'ap-modal',
  styleUrl: 'ap-modal.scss',
})
export class ApModal {
  @Element()
  // eslint-disable-next-line @stencil/element-type
  el!: HTMLElement;

  @Event()
  close!: EventEmitter;

  private handleClick = (ev: MouseEvent) => {
    if (ev.target == this.el) {
      this.close.emit();
    }
  };

  render() {
    return (
      <Host onClick={this.handleClick}>
        <div class="modal-content">
          <slot />
        </div>
      </Host>
    );
  }
}
