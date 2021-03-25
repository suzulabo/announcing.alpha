const fs = require('fs-extra');

//fs.emptyDirSync('src/shared');
fs.copySync('../shared/src', 'src/shared');

//fs.emptyDirSync('src/shared');
const components = ['style', 'icon', 'loading', 'modal'];
for (const v of components) {
  fs.copySync(`../shared-ui/src/ap-${v}`, `src/shared-ui/ap-${v}`);
}
