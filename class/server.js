'use strict';
const ws = require('ws');
const path = require('path');
const EventEmitter = require('events').EventEmitter;
const { WebSocketServer } = ws;
const { URL } = require('url');
const UploadHelper = require('./server-upload-helper');
const CommandHelper = require('./server-command-helper');
const DownloadHelper = require('./server-download-helper');

class Server extends EventEmitter {
  constructor({ cwd, port } = {}) {
    super();

    this.cwd = cwd || process.cwd();
    this.port = port || 1199;

    // 参数与目录的对照关系
    this.key2dir = { };
  }

  /**
   * 设置链接上 ?key= 这个值，对应的目录
  */
  param(key, dir) {
    this.key2dir[key] = path.join(this.cwd, '.', dir);
  }

  /**
   * 监听命令的触发
   * @param {*} key 命令名字 
   * @param {*} fn 命令回调
   * @returns 
   */
  command(key, fn) {
    this.on(`command:${key}`, fn);
    return this;
  }

  /**
   * 监听参数 ?type=upload|download 这两个内容
   */
  start(options = {}) {
    const { port, cwd, key2dir } = this;
    if (!options.noServer) {
      options.port = port;
    }
    const wss = new WebSocketServer({ ...options });
    const ctx = this;

    const heartbeat = function() {
      this.isAlive = true;
    };

    wss.on('connection', function(ws, req) {
      ws.isAlive = true;
      ws.on('pong', heartbeat);

      const url = new URL(`http://localhost${req.url}`);
      const params = url.searchParams || {};

      let helper = null;
      switch (params.get('type')) {
        case 'upload':
          helper = new UploadHelper(
            key2dir[params.get('key')] || cwd,
            ws
          );
          break;
        case 'download':
          helper = new DownloadHelper(ws, key2dir[params.get('key')] || cwd);
          break;
        case 'command':
          helper = new CommandHelper(ws, function(key, data) {
            ctx.emit(`command:${key}`, data);
          });
          break;
        default:
          ws.send('unknown type~');
          ws.terminate();
      }
    });

    const interval = setInterval(function ping() {
      wss.clients.forEach(function each(ws) {
        if (ws.isAlive === false) {
          return ws.terminate();
        }
    
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);
    
    wss.on('close', function close() {
      clearInterval(interval);
    });
    
    if (!options.noServer) {
      console.log(`listening port: ${port}`);
    }

    return wss;
  }

  // 与已有服务器，进行链接
  connect(server) {
    const wss = this.start({ noServer: true });
    server.on('upgrade', function upgrade(request, socket, head) {
      wss.handleUpgrade(request, socket, head, function done(ws) {
        wss.emit('connection', ws, request, client);
      });
    });
  }
}

module.exports = Server;