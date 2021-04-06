import replace from '@rollup/plugin-replace';
import { Config } from '@stencil/core';
import { sass } from '@stencil/sass';

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

export const config: Config = {
  globalScript: 'src/global/app.ts',
  taskQueue: 'async',
  outputTargets: [
    {
      type: 'www',
      serviceWorker: {
        swSrc: 'src/sw.js',
        globPatterns: process.argv.includes('--dev') ? ['index.html'] : ['**/*.{js,html}'],
      },
    },
  ],
  plugins: [
    sass({}),
    replace({
      __BUILD_SRC__: buildSrc(),
      __BUILT_TIME__: new Date().getTime().toString(),
      preventAssignment: true,
    }),
  ],
  devServer: {
    openBrowser: false,
    port: 3371,
  },
};
