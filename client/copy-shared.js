const fs = require('fs-extra');

fs.emptyDirSync('src/shared');
fs.copySync('../shared/src', 'src/shared');
