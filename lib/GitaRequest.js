

const EventEmitter = require('events').EventEmitter;
const https = require('https');
const log = require('./logger.js');

const ROOT_ENDPOINT = 'api.github.com';
const USER_AGENT = 'randywick/gita';
const API_ENV_KEY = 'GITA_GITHUB_API_KEY';



/**
 * GitaRequest
 * 
 * @class GitaRequest
 * @extends {EventEmitter}
 */
class GitaRequest extends EventEmitter {


  /**
   * Creates an instance of GitaRequest.
   * 
   * 
   * @memberOf GitaRequest
   */
  constructor() {
    super();

    this.readyState = false;
    this.user = {};

    this.init();
  }

  /**
   * init()
   * 
   * 
   * @memberOf GitaRequest
   */
  init() {
    log.debug('requesting user');

    this.makeRequest('GET', '/user')
      .then(response => {
        log.debug('user retrieved');

        this.user = JSON.parse(response.body);

        log.debug('emitting ready event');
        this.readyState = true;
        this.emit('ready');
      })

      .catch(err => {
        log.error('Error in init', err);
      })
  }


  /**
   * makeRequest
   * 
   * @param {any} method
   * @param {any} path
   * @returns
   * 
   * @memberOf GitaRequest
   */
  makeRequest(method, path, body) {
    return new Promise((resolve, reject) => {
      const headers = {
        'User-Agent': USER_AGENT,
        'Authorization': 'application/vnd.github.v3+json'
      };

      if (process.env[API_ENV_KEY]) {
        headers.Authorization = `token ${process.env[API_ENV_KEY]}`;
      }

      if (body) {
        headers['Content-Type'] = 'application/json';
      }

      const options = {
        headers,
        method,
        path,
        hostname: ROOT_ENDPOINT
      };

      const req = https.request(options, res => {
        log.debug('Response, status code', res.statusCode);

        let body = '';
        res.on('data', data => {
          log.debug('response chunk')
          body += data
        });

        res.on('end', () => {
          log.debug('end of response')

          resolve({
            body,
            statusCode: res.statusCode
          });
        });
      });

      req.end(body);
    })
  }


  /**
   * getRepos
   * 
   * @returns {Promise}
   * 
   * @memberOf GitaRequest
   */
  getRepos() {
    return this.onReady()
      .then(() => this.makeRequest('GET', '/user/repos'))
      .then(response => {
        // possible validation point
        return response.body;
      })
      .then(json => JSON.parse(json))
      .then(repos => {
        const allRepos = repos.map(repo => {
          return {
            id: repo.id,
            name: repo.name,
            owner: repo.owner
          }
        })

        const myRepos = allRepos.filter(repo => repo.owner.id === this.user.id);
        const otherRepos = allRepos.filter(repo => repo.owner.id !== this.user.id);

        return {
          allRepos,
          myRepos,
          otherRepos
        }
      })
  }

  createRepo(name, description, isPrivate) {
    const body = JSON.stringify({
      name,
      description,
      private: isPrivate
    })

    return this.onReady()
      .then(() => this.makeRequest('POST', '/user/repos', body))
  }


  /**
   * onReady
   * 
   * @param {Function|null} callback
   * @returns Promise
   * 
   * @memberOf GitaRequest
   */
  onReady(callback) {
    const cb = callback instanceof Function? callback : () => {};

    log.debug('entering onReady', cb)

    return new Promise((resolve, reject) => {
      if (this.readyState) {
        log.debug('already ready');
        cb();
        return resolve(this);
      }

      this.on('ready', () => {
        log.debug('ready state event');
        cb();
        return resolve(this);
      });
    })
  }
}

module.exports = GitaRequest;