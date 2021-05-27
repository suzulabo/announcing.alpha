import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  verbose: true,
  moduleDirectories: ['node_modules', '.'],
};
export default config;
