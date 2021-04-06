const fs = require('fs-extra');

const copy = (src, dest) => {
  fs.copySync(src, dest, { preserveTimestamps: true });
};

copy('../shared/src', 'src/shared');

const components = ['style', 'error', 'icon', 'textview', 'loading', 'modal', 'announce', 'post'];
for (const v of components) {
  copy(`../shared-ui/src/ap-${v}`, `src/shared-ui/ap-${v}`);
}
