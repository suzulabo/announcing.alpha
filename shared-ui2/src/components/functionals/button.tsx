import { FunctionalComponent, h } from '@stencil/core';

export const ApButton: FunctionalComponent<{
  class?: string;
  fill?: HTMLIonButtonElement['fill'];
  href?: string;
  onClick?: (event: MouseEvent) => void;
}> = (props, children) => {
  return (
    <ion-button fill="outline" {...props}>
      {children}
    </ion-button>
  );
};
