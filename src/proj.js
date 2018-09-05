'use strict';

var path = require('path');
var spawn = require('child_process').spawn;
var chalk = require('chalk');
var gitConfig = require('git-config');
var inquirer = require('inquirer');

var util = require('./util');

module.exports = function (url, force) {
    console.log('');
    console.log('Welcome to wiwi project generator!');
    console.log('I will use this template to generate your project:');
    console.log(chalk.green(url));
    console.log('May I ask you some questions?');
    console.log('');
    
    var abc = util.loadAbc();
    var config = gitConfig.sync(path.join(abc.root, '.git', 'config')) || {};
    var promptTask = inquirer.prompt([{
        name: 'name',
        message: 'Project name',
        default: path.basename(process.cwd()),
        validate: function(name) {
          return /^\w[\w\-]*\w$/.test(name) ? true : 'name is not valid';
        }
      }, {
        name: 'description',
        message: 'Project description',
        default: 'An awesome project'
      }, {
        name: 'author',
        message: 'Author name',
        default: process.env['USER'] || process.env['USERNAME'] || ''
      }, {
        name: 'version',
        message: 'Project version',
        default: '1.0.0',
        validate: function(version) {
          return /^\d+\.\d+\.\d+([\.\-\w])*$/.test(version) ? true : 'version is not valid';
        }
      }, {
        name: 'homepage',
        message: 'Project homepage'
      }, {
        name: 'repository',
        message: 'Project repository',
        default: (config['remote "origin"'] || {}).url || ''
      }, {
        name: 'npm',
        message: 'Npm registry',
        default: 'https://registry.npm.taobao.org'
    }]);
    // start to generate files when templates and answers are ready
    
    Promise.all([
        new Promise(function(resolve) {
            util.fetchTpl(url, resolve, force);
        }),
        promptTask
    ]).then(function(results) {
        var answers = results[1];
        answers.template = url;

        // deal with custom prompt config
        var promptConfigPath = path.join(results[0], 'proj.js');
        var cmdCfg = loadConfig(promptConfigPath);
        var filter = cmdCfg.filter;
        var done = cmdCfg.done;
        util.customPrompts(promptConfigPath, answers, abc.options).then(function(answers) {
            // make files
            util.makeFiles(path.join(results[0], 'proj'), abc.root, answers, filter, function() {
                npmInstall(answers.npm, abc.root);
                done && done(abc.root);
            });
        }).catch(function(err) {
            console.log(err);
        });
    });
};

// get npm registry
function getNpmRegistry(npm) {
    
    switch (npm) {
      case 'npm':
        return {
          cmd: 'npm',
          registry: 'https://registry.npmjs.org'
        };
      case 'cnpm':
        return {
          cmd: 'cnpm',
          registry: 'https://registry.npm.taobao.org'
        };
      case 'tnpm':
        return {
          cmd: 'tnpm',
          registry: 'http://registry.npm.alibaba-inc.com'
        };
      default:
        return {
          cmd: 'npm',
          registry: npm
        };
    }
  }
  
  // call npm install
  function npmInstall(npm, root) {
    var npmRegistry = getNpmRegistry(npm);
    spawn(process.platform === 'win32' ? npmRegistry.cmd + '.cmd' : npmRegistry.cmd, [
      'install',
      '--registry=' + npmRegistry.registry
    ], {
      cwd: root,
      stdio: 'inherit',
      stderr: 'inherit'
    }).on('exit', function(code) {
      // if (code === 0 && util.loadAbc().options.libraries) {
      //   buildLibraries(root);
      // }
    });
  }
  
  // build libraries
  function buildLibraries(cwd) {
    spawn(process.platform === 'win32' ? 'wiwi.cmd' : 'wiwi', [
      'lib'
    ], {
      cwd: root,
      stdio: 'inherit',
      stderr: 'inherit'
    });
  }

// load prompt config file
function loadConfig(promptConfigPath) {
    try {
      return require(promptConfigPath);
    } catch(e) {
      return {};
    }
}