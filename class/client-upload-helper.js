'use strict';
const fs = require('fs');
const UploadChunk = require('./upload-chunk');
const UploadSignal = require('./upload-signal');

let UploadId = 1;
class UploadHelper {
  constructor(filepath, to, client) {
    this.from = filepath;
    this.content = fs.readFileSync(filepath).toString('base64');
    this.to = to || path.basename(filepath);
    this.length = this.content.length;
    this.chunkLength = 1024 * 1000;
    this.client = client;
    this.id = UploadId++;
  }

  async send(data) {
    return new Promise((resolve, reject) => {
      this.client.send(JSON.stringify(data), function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async start() {
    let resolve, reject;
    const promise = new Promise((r, j) => {
      resolve = r;
      reject = j;
    });
    const { client, to, content, length, chunkLength, id } = this;
    
    const signal = new UploadSignal(
      id, to, Math.ceil(length / chunkLength)
    );

    // 发送头部
    await this.send(signal.toJSON());

    // 分chunks，因为ws传输，是有大小限制的
    let index = 0;
    const chunks = [];
    while (index < length) {
      chunks.push(content.slice(index, index + chunkLength));
      index += chunkLength;
    }

    const sendChunk = async (index) => {
      const chunk = new UploadChunk(
        id, index, chunks[index]
      );
      await this.send(chunk.toJSON());
    }

    const watch = (data) => {
      let json = null;
      try {
        json = JSON.parse(data.toString());
      } catch (e) {
        // nothing
      }
      if (!json || json.id !== id) {
        return;
      }
      switch (json.type) {
        case 'uploadEnd':
        case 'uploadError':
          client.off('message', watch);
          this.client = null;
          if (json.error) {
            console.error(json.error);
            reject(json.error)
          } else {
            resolve();
          }
          break;          
      }
    };
    client.on('message', watch);

    // 分串发送
    for (let i = 0; i < chunks.length; i++) {
      await sendChunk(i);
    }
    
    // 发送报表尾
    signal.finish();
    await this.send(signal.toJSON());

    return promise;
  }
}

module.exports = UploadHelper;