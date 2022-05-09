# 说明
因为经常因为权限问题，导致内容无法同步，所以特定写了一个 sync 模块，用来把文件同步到远程，或者把远程文件，下载到本地。

# 实例
服务器例子
```javascript
// server.js
const { Server } = require('./index');

const server = new Server({
  // 文件放置的目录
  cwd: process.cwd(),
  // 监听的端口号，默认就是 1199
  port: 1199,
});

// 链接中，?key=default，放置到 to 目录
server.param('default', './to');
// 链接中，?key=other，放置到 to-other 目录
server.param('other', './to-other');

// 接收到客户端的 restart 命令后，要怎么处理
server.command('restart', function(data) {
  console.log('服务器重启了~', data);
});

// 启动服务
server.start();
```

客户端例子
```javascript
// client.js
const path = require('path');
const { Client } = require('./index');

const client = new Client({
  // 要同步的目录
  cwd: path.resolve(__dirname, './from'),
  // 上面 server.js 对应的地址，key 为 server.param 指定的值
  // 如 key=other，就是上面说的，要把内容同步到 to-other 这个目录
  url: 'ws://localhost:1199?key=other'
});

// 忽略掉匹配的文件
client.ignore('ignore/*.txt');

// 上传全部，dirname 可以指定上传的目录
client.upload({ dirname: '.' }).on('end', function() {
  console.log('上传结束后，要求服务器重启');
  client.command('restart');
});

// // 下载文件
// client.download({
//   cwd: './download', // 存储在什么地方
//   remote: './child', // 下载远程的什么文件 or 目录
// });
```

与现存 http.server 配合使用例子:
```javascript
import { createServer } from 'http';
import { parse } from 'url';
import { WebSocketServer } from 'ws';
const { Server } = require('./index');

const server = createServer();
const wssServer = new Server({
  cwd: '.'
});
const wss = wssServer.start({ noServer: true });

server.on('upgrade', function upgrade(request, socket, head) {
  const { pathname } = parse(request.url);

  if (pathname === '/foo') {
    wss.handleUpgrade(request, socket, head, function done(ws) {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

server.listen(8080);
```


# 参考资料

> https://blog.csdn.net/Uniquelike/article/details/52574476
> https://www.npmjs.com/package/ws#api-docs
> https://www.npmjs.com/package/formidable
> https://www.npmjs.com/package/busboy

# TODO
- md5 校验，相同 md5 的，就不同步了
- 严格模式，删除不存在的文件
- 下载允许请求的方式，进行获取
[ook] - 跟 express 配套使用