'use strict';
const fs = require('fs-extra');
const mm = require('micromatch');
const path = require('path');
const WebSocket = require('ws');
const UploadHelper = require('./client-upload-helper');
const EventEmitter = require('events').EventEmitter;
const { listDirFiles } = require('./utils/dir');
const { addQs, getPort, getIPAdress } = require('./utils/url');
const clientSend = require('./utils/client').send;

class Client {
  constructor({ url, cwd, ignore } = {}) {
    if (!url) {
      throw new Error(`请设置 websocket 的地址`);
    }
    this.url = url;
    this.cwd = cwd || process.cwd();
    this.ignoreList = ignore || [
      'node_modules',
      '.git',
    ]; // 忽略的列表，支持 glob 表达式
    this.ignore(ignore);
  }

  /**
   * 增加要忽略的目录
   * @param {string|array} list 
   * @returns 
   */
  ignore(list) {
    if (!list) {
      return;
    }
    if (!Array.isArray(list)) {
      list = [list];
    }
    const arr = this.ignoreList.concat(list);
    this.ignoreList = [ ...new Set(arr) ];
  }

  /**
   * 获取要发送的文件列表
   * @param {*} dirname 
   * @returns {array}
   */
  getFileList(dirname = '.') {
    const { cwd } = this;
    let list = listDirFiles(path.resolve(cwd, dirname), true);
    this.ignoreList.forEach(ignore => {
      list = list.filter(s => {
        return !mm.contains(s, ignore);
      });
    });
    return list.map(s => {
      return path.relative(cwd, s);
    });
  }

  /**
   * 打开客户端
   * @param {*} param0 
   * @param {function} callback 
   * @returns 
   */
  openClient({ qs } = {}, callback) {
    const client = new WebSocket(
      addQs(this.url, qs)
    );

    client.on('open', async function() {
      await callback(client);
      client.close();
    });

    // client.on('close', function close() {
    //   console.log('client disconnected');
    // });

    // 做个心跳检测，感觉不做，好像也可以~
    function heartbeat() {
      clearTimeout(this.pingTimeout);

      // Use `WebSocket#terminate()`, which immediately destroys the connection,
      // instead of `WebSocket#close()`, which waits for the close timer.
      // Delay should be equal to the interval at which your server
      // sends out pings plus a conservative assumption of the latency.
      this.pingTimeout = setTimeout(() => {
        this.terminate();
        console.error('服务器没响应，已经中断了链接');
      }, 30000 + 1000);
    }

    client.on('open', heartbeat);
    client.on('ping', heartbeat);
    client.on('close', function clear() {
      clearTimeout(this.pingTimeout);
    });

    return client;
  }

  /**
   * 上传数据
   * @param {object} param0
   * @property {string} [param0.dirname="."] 要上传的目录
   */
  upload({ dirname = '.' } = {}) {
    const emitter = new EventEmitter();

    const list = this.getFileList(dirname);
    const { cwd } = this;
    const failList = [];
    const client = this.openClient({
      qs: { type: 'upload' }
    }, async function(client) {
      for (const filepath  of list) {
        const fromFilepath = path.resolve(cwd, filepath);
        let helper = new UploadHelper(
          fromFilepath,
          filepath,
          client
        );
        try {
          const result = await helper.start();
          console.log(`sync: ${filepath}`);
        } catch (e) {
          console.log(e);
          failList.push(fromFilepath);
        }
      };
      // await Promise.allSettled(
      //   list.map(filepath => {
      //     const fromFilepath = path.resolve(cwd, filepath);
      //     let helper = new UploadHelper(
      //       fromFilepath,
      //       filepath,
      //       client
      //     );
      //     const result = helper.start();
      //     result.then(() => {
      //       console.log(`sync: ${filepath}`);
      //     }).catch(e => {
      //       console.log(e);
      //       failList.push(fromFilepath);
      //     });
      //     return result;
      //   })
      // );
    });

    client.on('close', function clear() {
      if (failList.length) {
        console.log('以下文件，同步失败，请重试:', failList);
        emitter.emit('error', { failList });
      } else {
        console.log('全部同步成功了');
        emitter.emit('end');
      }
    });

    return emitter;
  }

  /**
   * 发送某个命令，给服务器
   * @param {*} key 
   * @param {object} [params={}] 附带给命令的额外参数
   */
  command(key, params) {
    this.openClient({
      qs: { type: 'command' }
    }, async function(client) {
      await clientSend(client, {
        type: 'command',
        command: key,
        params: params || {}
      });
    });
  }

  /**
   * 下载文件
   */
  download({ remote = '.', cwd } = {}) {
    const ctx = this;
    cwd = cwd || this.cwd;
    this.openClient({
      qs: { type: 'download' }
    }, async function(client) {
      const Server = require('./server');
      const port = await getPort(1199);
      const ip = getIPAdress();
      const server = new Server({
        cwd,
        port,
      });
      const wss = server.start();
      server.command('end', function() {
        wss.close();
      });

      await clientSend(client, {
        type: 'download',
        url: `ws://${ip}:${port}`,
        ignore: ctx.ignoreList,
        dirname: remote,
      });
    });
  }
}

module.exports = Client;