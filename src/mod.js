'use strict';

var path = require('path');
var inquirer = require('inquirer');
var util = require('./util');

module.exports = function (type, url, force, cwd) {
    console.log('\nWelcome to wiwi ' + type + ' generator!\n');
    var abc = util.loadAbc();
     // interaction
    var promptTask = inquirer.prompt([{
        name: 'name',
        message: type + ' name',
        validate: function(name) {
            return /^\w[\w\-\.]*\w$/.test(name) ? true : 'name is not valid';
        }
    }]);

    // start to generate files when templates and answers are ready
    Promise.all([
        new Promise(function(resolve) {
            util.fetchTpl(url, resolve, force);
        }),
        promptTask
    ]).then(function(results) {

        // deal with custom prompt config
        var promptConfigPath = path.join(results[0], type + '.js');
        var cmdCfg = loadConfig(promptConfigPath);
        var filter = cmdCfg.filter;
        var done = cmdCfg.done;
        util.customPrompts(promptConfigPath, results[1], abc).then(function(answers) {

        // make files
        util.makeFiles(path.join(results[0], type), abc.root, answers, filter, done, cwd);
        });
    }).catch(function(err) {
        console.error(err);
    });
};

// load prompt config file
function loadConfig(promptConfigPath) {
    try {
      return require(promptConfigPath);
    } catch(e) {
      return {};
    }
}
  