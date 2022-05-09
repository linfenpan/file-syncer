'use strict';
/**
 * 上传的信号
 */
class UploadChunk {
  constructor(id, path, length) {
    this.id = id;
    this.type = 'upload';
    this.path = path;
    this.end = false;
    this.length = length;
  }

  finish() {
    this.end = true;
  }

  toJSON() {
    const { id, type, path, end, length } = this;
    return {
      id, type, path, end, length
    };
  }
}

UploadChunk.fromJSON = function(json) {
  if (
    ('id' in json)
    && json.type === 'upload' 
    && json.path 
    && typeof json.length === 'number' 
    && ('end' in json)
  ) {
    const instance = new UploadChunk(
      json.id,
      json.path,
      json.length
    );
    instance.end = !!json.end;
    return instance;
  }
  return null;
}

module.exports = UploadChunk;