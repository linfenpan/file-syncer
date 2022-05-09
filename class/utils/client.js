'use strict';

/** 
 * 发送数据 
 * @param {WebSocket} client
 * @param {object} data 要发送的数据
 * */
exports.send = async function(client, data) {
  return new Promise((resolve, reject) => {
    client.send(JSON.stringify(data), function(err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}