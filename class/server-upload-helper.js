'use strict';
const FileUploader = require('./server-file-uploader');
const ServerHelper = require('./server-helper');

class ReceiveHelper extends ServerHelper {
  constructor(cwd, server) {
    super('upload', server);

    this.cwd = cwd || process.cwd();
    this.server = server;
    this.map = {};
  }

  receive(json) {
    const { map } = this;
    let server = this.server;

    if (!map[json.id]) {
      map[json.id] = new FileUploader(this.cwd, json.id);
      map[json.id].on('end', (data) => {
        data && server.send(JSON.stringify(data));
        delete map[json.id];
        server = null;
      });
    }

    if (map[json.id]) {
      map[json.id].receive(json);
    }
  }
}

module.exports = ReceiveHelper;