'use strict';
/**
 * 上传的分串
 */
class UploadChunk {
  constructor(id, index, chunk) {
    this.id = id;
    this.type = 'upload';
    this.index = index || 0;
    this.chunk = chunk;
  }

  toJSON() {
    const { id, type, index, chunk } = this;
    return {
      id, type, index, chunk
    };
  }
}

UploadChunk.fromJSON = function(json) {
  if (
    ('id' in json)
    && json.type === 'upload'
    && typeof json.chunk === 'string'
    && typeof json.index === 'number'
  ) {
    return new UploadChunk(
      json.id,
      json.index,
      json.chunk
    );
  }
  return null;
};

module.exports = UploadChunk;