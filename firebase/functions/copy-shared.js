const fs = require('fs-extra');

const copy = (src, dest) => {
  fs.copySync(src, dest, { preserveTimestamps: true });
};

copy('../../shared/src', 'src/shared');
