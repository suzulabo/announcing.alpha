const fs = require('fs-extra');

fs.emptyDirSync('src/ap-components');
fs.copySync('../shared-ui/ap-components/ap-input', 'src/shared-ui/ap-components/ap-input');
