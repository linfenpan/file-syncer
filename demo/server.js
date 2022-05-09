'use strict';
const path = require('path');
const { Server } = require('../index');

const server = new Server({
  cwd: __dirname
});

server.param('default', './to');
server.param('other', './to-other');

server.command('restart', function(data) {
  console.log('服务器重启了~', data);
});

server.start();