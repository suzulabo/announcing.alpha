import replace from '@rollup/plugin-replace';
import { Config } from '@stencil/core';
import { OutputTargetWww } from '@stencil/core/internal';
import { sass } from '@stencil/sass';
import nodePolyfills from 'rollup-plugin-node-polyfills';

// https://stenciljs.com/docs/config

declare var process: {
  env: {
    [key: string]: string;
  };
  argv: string[];
};

const buildSrc = () => {
  const commitId = process.env['COMMIT_ID'];
  const branchName = process.env['BRANCH_NAME'];
  if (commitId && branchName) {
    return `${branchName}/${commitId}`;
  }
  return 'local build';
};

const isCapacitor = process.env['CAP_BUILD'] != null;
if (isCapacitor) {
  console.log('Capacitor Build');
}

const outputTargetWww: OutputTargetWww = isCapacitor
  ? { type: 'www', dir: 'cap', serviceWorker: null }
  : {
      type: 'www',
      serviceWorker: {
        swSrc: 'src/sw.js',
        globPatterns: process.argv.includes('--dev') ? ['index.html'] : ['**/*.{js,html}'],
      },
      copy: [{ src: '../assetlinks.json', dest: '.well-known/assetlinks.json' }],
    };

export const config: Config = {
  globalScript: 'src/global/app.ts',
  taskQueue: 'async',
  outputTargets: [outputTargetWww],
  plugins: [
    sass({}),
    replace({
      __BUILD_SRC__: buildSrc(),
      __BUILT_TIME__: new Date().getTime().toString(),
      preventAssignment: true,
    }),
  ],
  rollupPlugins: {
    after: [nodePolyfills()],
  },
  devServer: {
    openBrowser: false,
    port: 3371,
  },
};
