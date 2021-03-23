const fs = require('fs-extra');

//fs.emptyDirSync('src/shared');
fs.copySync('../shared/src', 'src/shared');

//fs.emptyDirSync('src/shared-ui');
fs.copySync('../shared-ui/ap-components/ap-style', 'src/shared-ui/ap-components/ap-style');
fs.copySync('../shared-ui/ap-components/ap-input', 'src/shared-ui/ap-components/ap-input');
