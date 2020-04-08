/**
 * Generic disk functions.
 */

const logger = require('utils/logger');
const fs = require('fs');
const crypto = require('crypto');
const uint32Bytes = 4;

// Reads a file. Wraps fs.readFile into a native promise
function readFile(filePath, encoding) {
  return new Promise((resolve, reject) => fs.readFile(filePath, encoding, (err, str) => {
    if (err) {
      reject(err);
    } else {
      resolve(str);
    }
  }));
}

// Reads a file as a utf8 string. Wraps fs.readFile into a native promise
function readUtf8File(filePath) {
  return readFile(filePath, 'utf8');
}

function readJsonFile(filePath) {
  return readUtf8File(filePath).then(JSON.parse);
}

// Writes a string to a file. Wraps fs.writeFile into a native promise
// This is _not_ concurrency safe, so don't export it without making it like writeJsonFile
function writeFile(filePath, data, encoding) {
  return new Promise((resolve, reject) => fs.writeFile(filePath, data, encoding, err => {
    if (err) {
      reject(err);
    } else {
      resolve();
    }
  }));
}

function writeJsonFile(filePath, obj) {
  const tempFileName = `${filePath}.${crypto.randomBytes(uint32Bytes).readUInt32LE(0)}`;

  return writeFile(tempFileName, JSON.stringify(obj), 'utf8')
    .then(() => new Promise((resolve, reject) => fs.rename(tempFileName, filePath, err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    })))
    .catch(err => {
      if (err) {
        fs.unlink(tempFileName, err => {
          logger.warn('Error removing temporary file after error', 'disk', {err, tempFileName});
        });
      }
      throw err;
    });
}

module.exports = {
  readFile,
  readUtf8File,
  readJsonFile,
  writeJsonFile,
};
