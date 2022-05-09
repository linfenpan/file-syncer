'use strict';
const path = require('path');
const ServerHelper = require('./server-helper');

class CommandHelper extends ServerHelper{
  constructor(server, cwd) {
    super('download', server);
    this.cwd = cwd;
  }

  receive(json) {
    const { url, dirname = '.', ignore = [] } = json;
    const Client = require('./client');
    let client = new Client({
      url,
      ignore,
      cwd: this.cwd,
    });
    const end = (e) => {
      client.command('end', e || {});
      client = null;
    };
    client.upload({
      dirname: path.join(this.cwd, '.', dirname),
    }).on('end', function() {
      end();
    }).on('error', function({ failList }) {
      end({ error: true, failList, msg: '部分文件同步失败' });
    });
  }
}

module.exports = CommandHelper;