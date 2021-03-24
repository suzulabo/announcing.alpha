const fs = require('fs-extra');

//fs.emptyDirSync('src/shared');
const components = ['style', 'icon', 'loading', 'modal'];
for (const v of components) {
  fs.copySync(`../shared-ui/ap-components/ap-${v}`, `src/shared-ui/ap-components/ap-${v}`);
}
