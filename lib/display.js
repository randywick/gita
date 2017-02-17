const chalk = require('chalk');
const util = require('./util.js');


function displayRepos(repos, title) {
  const ids = repos.map(repo => repo.id);
  console.log('\n', chalk.bold.yellow(title))

  repos.forEach(repo => {
    const id = util.padRight(repo.id + '', ids, 1)
    console.log(chalk.dim(id), '-', chalk.white(repo.name))
  })
}



function newRepoProps(json) {
  const titles = {
    git_url: 'Git URL',
    ssh_url: 'SSH URL',
    html_url: 'URL',
    private: 'Private',
    name: 'Name',
    id: 'ID'
  }

  const data = JSON.parse(json);

  if (!data.id) {
    console.log(data)
  }

  console.log('\n', chalk.bold.yellow('Created Repository'))
  Object.keys(titles).forEach(key => {
    const heading = util.padRight(titles[key], Object.values(titles), 1)
    console.log(chalk.dim(heading), chalk.white(data[key]))
  })
}


function validationError(json) {
  const data = JSON.parse(json);

  console.log('\n', chalk.bold.red('Validation Error'))
  data.errors
    .map(err => `- ${err.resource} ${err.message}`)
    .forEach(err => console.log(chalk.white(err)))

  console.log('Repository was NOT created\n')
}


module.exports = {
  displayRepos,
  newRepoProps,
  validationError
}