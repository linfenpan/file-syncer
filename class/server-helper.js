'use strict';

class ReceiveHelper {
  constructor(type, server) {
    this.server = server;
    this.server.on('message', (data) => {
      let json;
      try {
        json = JSON.parse(data.toString());
      } catch (e) {
        // nothing...
      }
      if (json && json.type === type) {
        this.receive(json);
      }
    });
  }

  receive(json) {
    throw new Error('应该重新 receive 方法');
  }
}

module.exports = ReceiveHelper;