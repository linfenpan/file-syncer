'use strict';
const fs = require('fs-extra');
const path = require('path');

/**
 * 文件路径，是否目录
 * @return {Boolean}
*/
function isDirectory(filepath) {
  try {
    const stats = fs.statSync(filepath);
    return stats.isDirectory();
  } catch (e) {
    return false;
  }
};

/**
 * 遍历目录的所有文件
 * @param {string} dir 目录的绝对路径
 * @param {boolean} isDeep 是否遍历子目录
 * @return {array<abs path>}
 */
exports.listDirFiles = function listDirFiles(dir, isDeep) {
  const result = [];
  isDeep = isDeep === void 0 ? true: !!isDeep;

  if (!fs.existsSync(dir)) {
    return result;
  }

  if (isDirectory(dir)) {
    const fileList = fs.readdirSync(dir);
    
    for (let i = 0, ilen = fileList.length; i < ilen; i++) {
      const filepath = path.resolve(dir, fileList[i]);

      if (isDirectory(filepath)) {
        if (isDeep) {
          result.push.apply(result, listDirFiles(filepath, isDeep));
        }
      } else {
        result.push(filepath);
      }
    }
  } else {
    result.push(dir);
  }

  return result;
}