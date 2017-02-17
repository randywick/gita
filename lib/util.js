const chalk = require('chalk');
const fs = require('fs');
const log = require('./logger.js');
const path = require('path');


/**
 * fileExists - quick and dirty promisified existential crisis resolution engine.
 * Resolves true or false if a file does or does not exist; throws if the
 * specified pathname leads to a directory
 * 
 * @param {string} pathname
 * @returns
 */
function fileExists(pathname) {
  return new Promise((resolve, reject) => {
    fs.stat(pathname, (err, stat) => {
      if (err) {
        if (err.code === 'ENOENT') {
          return resolve(false);
        }

        return reject(err);
      }

      if (stat.isDirectory()) {
        return reject(new Error('PATHNAME IS A DIRECTORY'))
      }

      resolve(true)
    })
  })
}


/**
 * padRight
 * 
 * @param {any} value
 * @param {any} fitLength
 * @param {any} additionalPadding
 * @returns
 */
function padRight(value, fitLength, additionalPadding) {
  additionalPadding = additionalPadding || 0;

  let max;

  if (Array.isArray(fitLength)) {
    max = fitLength.reduce((max, next) => next.length > max? next.length : max, 0)
  } else if (typeof fitLength === 'string') {
    max = fitLength.length;
  } else if (parseInt(fitLength, 10) === fitLength) {
    max = fitLength;
  } else {
    return value
  }

  const testValue = chalk.hasColor(value)? chalk.stripColor(value) : value;
  max = Math.max(max + additionalPadding, testValue.length)

  return value + ' '.repeat(max - testValue.length);
}

module.exports = {
  padRight,
  fileExists
}