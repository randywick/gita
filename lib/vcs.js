const path = require('path');
const chalk = require('chalk');
const fs = require('fs');
const log = require('./logger.js');
const util = require('./util.js');
const spawn = require('child_process').spawn;
const gitignore = require('gitignore');
const readline = require('readline');


/**
 * spawnCommand - a helper to promisify spawned external processes
 * 
 * @param {any} cmd
 * @param {any} args
 * @returns
 */
function spawnCommand(cmd, args) {
  log.debug('Spawning external process', {cmd, args})

  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args)

    child.stdout.on('data', data => {
      log.debug('Child stdout', data + '')
    })

    child.stderr.on('data', data => {
      log.debug('Child stderr', data + '')
    })

    child.on('close', code => {
      log.debug('Child process closed with code', code)
      if (code === 0) {
        return resolve();
      } else {
        return reject();
      }
    })

    child.on('error', err => {
      log.debug('Child process encountered an error', err);
      return reject(err);
    })
  })
}


/**
 * Entry point for local vcs.  This sets up vcs on the PWD and connects it
 * to the newly created repository
 * 
 * @param {string} responseBody
 * @returns {Promise}
 */
function init(responseBody) {
  const pathname = path.resolve(process.cwd())
  const repo = JSON.parse(responseBody);
  
  return testGitignore(pathname)
    .then(() => spawnCommand('git', ['init']))
    .then(() => spawnCommand('git', ['add', '--all']))
    .then(() => spawnCommand('git', ['remote', 'add', 'origin', repo.ssh_url]))
    .then(() => spawnCommand('git', ['commit', '-am', 'initial commit']))
    .then(() => spawnCommand('git', ['push', '-u', 'origin', 'master']))
    .then(() => {
      console.log('Initialized version control on directory and pushed initial state!')
    })

    .catch(err => {
      log.error('Error caught initializing VCS', err);
    })
}





const gitignoreTypes = [];


/**
 * Fetches a list of template .gitignore files
 * 
 * @returns {Promise}
 */
function getGitignoreTypes() {
  if (gitignoreTypes.length) {
    return Promise.resolve(gitignoreTypes)
  } 
  
  return new Promise((resolve, reject) => {
    gitignore.getTypes((err, result) => {
      if (err) {
        log.error('Error fetching gitignore types', err);
        return reject(err);
      }

      gitignoreTypes.push(...result)
      resolve(gitignoreTypes);
    })
  })
}



/**
 * Autocomplete function for gitignore template input
 * 
 * @param {string} partial
 * @param {Function} callback
 */
function completer(partial, callback) {
  const completions = types.map(type => {
    const raw = type;
    const normalized = type.toLowerCase().replace(/[ ]*/g, '');
    return {raw, normalized}
  });

  const normalizedPartial = partial.toLowerCase().replace(/[ ]*/g, '');
  const hits = completions
    .filter(value => value.normalized.indexOf(normalizedPartial) !== -1)
    .sort((a, b) => a.normalized.startsWith(normalizedPartial)? 1 : 0)
    .slice(0, 10)
    .map(item => item.raw)

  callback(null, [hits.length? hits : types, partial]);
}


/**
 * buildGitignore - Attempts to create a .gitignore file from a template.
 * This function is a mess!
 * 
 * @param {string} pathname
 * @param {boolean} hideList
 * @returns
 */
function buildGitignore(pathname, hideList) {
  return getGitignoreTypes()
    .then(types => {
      if (!hideList){
        console.log('\n');
        console.log(chalk.bold.yellow('Available gitignore types'));

        types.join(' ')
          .split(/(.{55,65}[^ ]*)/g)
          .filter(line => line.length)
          .map(line => line.trim())
          .forEach(line => console.log(chalk.white(line)));

        console.log('\n');
      }

      return new Promise((resolve, reject) => {
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
          completer
        });

        const prompt = '\n> ';
        const sentences = chalk.cyan([
          'Enter a type or blank if done.',
          'Press <tab> to complete.',
          'Enter `list` to display the list.'
        ].join(' '))
        
        rl.question(sentences + prompt, input => {
          rl.close();

          if (input.toLowerCase() === 'list') {
            return buildGitignore(pathname).then(() => resolve())
          }

          if (input === '') {
            return resolve();
          }

          const matchedType = types
            .filter(item => item.toLowerCase() === input.toLowerCase())

          if (!matchedType.length) {
            console.log(chalk.red(input, 'is not a valid type\n'));
            return buildGitignore(pathname, true).then(() => resolve());
          }

          const ws = fs.createWriteStream(pathname)
          gitignore.writeFile({ writable: ws, type: matchedType[0] }, err => {
            if (err) {
              console.log(chalk.red.bold('Error writing gitignore'))
              console.log(err);
              return reject(err);
            }
            
            console.log(
              chalk.green.bold('Created .gitignore for'),
              chalk.white.bold(matchedType[0]),
              '\n'
            )
          })

          ws.on('finish', () => {
            resolve();
          })

          
        })
      })

    })
}


/**
 * Tests whether a .gitignore file is present and initiates the template process
 * if necessary.
 * 
 * @param {any} dirname
 * @returns
 */
function testGitignore(dirname) {
  const pathname = path.resolve(dirname, '.gitignore');
  return util.fileExists(pathname)
    .then(exists => {
      if (!exists) {
        return buildGitignore(pathname)
      } else {
        return Promise.resolve();
      }
    })
}



module.exports = {
  init
}