'use strict';
const ServerHelper = require('./server-helper');

class CommandHelper extends ServerHelper{
  constructor(server, callback) {
    super('command', server);
    if (typeof callback !== 'function') {
      throw new Error('ReceiveHelper 的第二个参数，必须是 function');
    }
    this.callback = callback;
  }

  receive(json) {
    const { command, params = {} } = json;
    if (command) {
      this.callback(command, params);
    }
  }
}

module.exports = CommandHelper;