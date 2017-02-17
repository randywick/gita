const chalk = require('chalk');
const moment = require('moment');
const util = require('./util.js');
const winston = require('winston');

const logLevel = process.env.LOG_LEVEL || 'info';
const TS_FMT = 'DD-MM-YYYY HH:mm:ss:SSS (ZZ)';


const levels = {
  error: ['red', 'bold'],
  warn: ['yellow', 'bold'],
  info: ['green', 'bold'],
  verbose: ['blue', 'bold'],
  debug: ['magenta', 'bold'],
  silly: ['bgCyan', 'black', 'bold']
}

const formatLevel = level => {
  const levelObj = levels[level]
  const result = (Array.isArray(levelObj) ? levelObj : [levelObj])
    .reduce((result, effect) => chalk[effect](result), level.toUpperCase())
    
  return util.padRight(`[${result}]`, Object.keys(levels), 2)
}


function formatEntry(options) {
  const timestamp = chalk.cyan(moment(options.timestamp()).format(TS_FMT))
  const level = formatLevel(options.level)
  const msgString = typeof options.message === 'string'? options.message : '';
  const message = chalk.white(msgString)
  const metaString = options.meta && Object.keys(options.meta).length
    ? '\n\t'+ JSON.stringify(options.meta)
    : ''
  const meta = chalk.dim(metaString)
  
  return `${level} ${timestamp} | ${message}${metaString}`
}


const logger = new (winston.Logger)({
  exitOnError: false,
  transports: [
    new (winston.transports.Console)({
      level: logLevel,
      timestamp: () => Date.now(),
      formatter: options => formatEntry(options)
    }),
  ]
});


logger.verbose = function() {
  logger.log('verbose', ...arguments);
}

logger.silly = function() {
  logger.log('silly', ...arguments);
}

logger.setLevel = level => logger.transports.console.level = level;

module.exports = logger;