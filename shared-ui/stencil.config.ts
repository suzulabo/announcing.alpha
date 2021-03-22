import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'shared-ui',
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: '../loader',
    },
    {
      type: 'dist-custom-elements-bundle',
    },
  ],
};
