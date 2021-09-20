const { resolve } = require('path');
const { emptyDirSync, copySync } = require('fs-extra');

const src = resolve(__dirname, '..', '..', 'ionic-native', 'dist', '@ionic-native', 'plugins', 'wikitude');
const dest = resolve(__dirname, '..', 'node_modules', '@ionic-native', 'wikitude');

emptyDirSync(dest);
copySync(src, dest);
