'use strict';
const co = require('co');
const os = require('os');
const net = require('net');
const querystring = require('querystring');

/**
 * 增加qs
 * @param {string} url 链接
 * @param {object} object 参数对象
 * @returns 
 */
exports.addQs = function(url, object) {
  return url + (url.indexOf('?') >= 0 ? '&' : '?') + querystring.stringify(object || {});
};

/** 
 * 获取可用端口号
 * @param {number} port 要检测的端口号
*/
exports.getPort = async function(port) {
  /**
   * 端口是否可用
   * @param {number} port 端口号
   * @return {Promise.resolve(boolean)}
   */
  function isPortAvailable(port) {
    return new Promise(function(resolve) {
      const server = new net.Server();
      server.unref();
      server.on('error', (err) => {
        if (err.code === 'ENOTFOUND') {
          // 由于本地没有配置 localhost 导致出错的，忽略它
          console.info('ignore dns ENOTFOUND error, get free port: %s', port);
          return resolve(true);
        }
        resolve(false);
      });
      server.listen({ port }, () => {
        server.close(() => {
          resolve(true);
        });
      });
    });
  }

  return await new Promise(function(resolve, reject) {
    if (!Number.isInteger(port)) {
      return reject(new TypeError('端口必须是整数'));
    }

    if (port != 80) {
      if (port < 1024 || port > 65535) {
        return new RangeError('`port` 必须在 1024 - 65535 之间');
      }
    }

    resolve(
      co(function*() {
        for (let i = port; i < 65535; i++) {
          const res = yield isPortAvailable(i);
          if (res) {
            return i;
          }
        }
        return new Error('没有可用的端口');
      })
    );
  });
};


/**
 * 获取机器的ip地址
 * @returns 
 */
exports.getIPAdress = function() {
  var interfaces = os.networkInterfaces();
  for (var devName in interfaces) {
    var iface = interfaces[devName];
    for (var i = 0; i < iface.length; i++) {
      var alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        return alias.address;
      }
    }
  }
}