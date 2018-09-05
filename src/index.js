'use strict';

var proj = require('./proj');
var mod = require('./mod');
var util = require('./util');
var pkg = require('../package.json');

module.exports = {
    command: 'init <type>',
    description: pkg.description,
    options: [
        [ '-t, --template <uri>', 'template zip url' ],
        [ '-f, --force', 'force to fetch new template' ],
        [ '-c, --cwd', 'generate module at cwd' ]
    ],
    action: function(type, command) {
        var template = util.getAlias(command.template || type);
        var force = command.force;
        var cwd = command.cwd;

        // template should be an url or a local dir
        if (!/^https?:\/\//.test(template) && !util.existsDirectory(template)) {
          console.error('Can not load template: ' + template);
          return;
        }

        // generate a project if type is proj or alias to an url or is a local dir
        if ((type !== 'mod' && type !== 'page') && (/^https?:\/\//.test(util.getAlias(type)) || util.existsDirectory(type))) {
            proj(template, force);
        } else {
            mod(type, template, force, cwd);
        }
    }
}