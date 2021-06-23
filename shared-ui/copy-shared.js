const path = require('path');
const syncDirectory = require('sync-directory');

const watch = process.argv.includes('-w');

const syncDir = (src, dst) => {
  syncDirectory(path.resolve(src), path.resolve(dst), {
    watch,
  });
};

syncDir('../shared/src', 'src/shared');
