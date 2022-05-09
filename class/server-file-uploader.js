'use strict';
const fs = require('fs-extra');
const path = require('path');
const EventEmitter = require('events').EventEmitter;
const UploadSignal = require('./upload-signal');
const UploadChunk = require('./upload-chunk');

/**
 * 服务端，接受文件上传
 * 需实现 .receive 和 emmit('end', { })
 */
class FileUploader extends EventEmitter {
  constructor(cwd, id) {
    super();
    this.id = id;
    this.chunks = {};
    this.path = '';
    this.cwd = cwd || process.cwd();
  }

  receive(data) {
    // data = { type: upload, id, length, end: true|false, path }
    // data = { type: upload, id, index, chunk }
    const instance = UploadSignal.fromJSON(data) || UploadChunk.fromJSON(data);
    if (instance instanceof UploadSignal) {
      if (instance.end) {

        const chunks = Array.from(this.chunks);
        if (chunks.find(i => i == null)) {
          this.emit('end', {
            id: this.id,
            type: 'uploadError',
            error: '数据不完整，忽略本次写入'
          });
        } else {
          const buffer = Buffer.from(chunks.join(''), 'base64');
          fs.ensureFileSync(this.path);
          fs.writeFileSync(this.path, buffer);
          this.emit('end', {
            id: this.id,
            type: 'uploadEnd'
          });
        }
      } else {
        this.chunks.length = instance.length;
        this.path = path.join(this.cwd, '.', instance.path);
      }
    } else if (instance instanceof UploadChunk) {
      this.chunks[instance.index] = instance.chunk;
    }
  }
}

module.exports = FileUploader;