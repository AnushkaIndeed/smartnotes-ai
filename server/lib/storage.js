const path = require('path');

const STORAGE_DIR = path.resolve(process.env.STORAGE_DIR || path.join(__dirname, '..', 'storage'));

// Turns a storage key like 'userId/fileId.pdf' into an absolute path, refusing anything outside STORAGE_DIR.
function storagePath(key) {
  const abs = path.resolve(STORAGE_DIR, key);
  if (!abs.startsWith(STORAGE_DIR + path.sep)) throw new Error('Invalid storage key');
  return abs;
}

module.exports = { STORAGE_DIR, storagePath };