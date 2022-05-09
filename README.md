# 说明
在服务器端，建立一个 `websocket` 服务，用于文件的上传 和 下载。


# 实例
服务器端例子
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
  console.log(data);
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
  // 如 不设置key，则把内容上传到 Server 指定的 cwd 目录去
  // 如 key=default，就是上面说的，要把内容同步到 to 这个目录
  // 如 key=other，就是上面说的，要把内容同步到 to-other 这个目录
  url: 'ws://localhost:1199?key=other',
  // 如果不设置忽略目录，那么默认忽略掉 node_modules 和 .git 目录
  // 可以在 client.ignore() 函数中，进行目录的追加
  // ignore: [],
});

// 忽略掉匹配的文件
client.ignore('ignore/*.txt');

// 上传全部，dirname 可以指定上传的目录
// 如 dirname='.' 或者 不指定，则默认上传 client 设置的 cwd 的全部内容
client.upload({ dirname: '.' }).on('end', function() {
  // 触发 server 处的 restart 回调
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

如果有使用 `express.js`，那么需要稍微转换一下:
```javascript
var app = express();
// 省略 express 相关的配置

const { Server } = require('./index');
const { parse } = require('url');

// .start() 传入 noServer 时，不会监听端口
const wss = (new Server({ /* 设置好所有参数 */ })).start({ noServer: true });

// express 收到 emit('upgrade') 事件，进行处理
app.on('upgrade', function upgrade(request, socket, head) {
  const { pathname } = parse(request.url);

  // 可以加权限判定，或者路径判定之类的，不细写

  if (pathname === '/sync') {
    wss.handleUpgrade(request, socket, head, function done(ws) {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});


// 需这么创建服务器
var server = http.createServer(app);
server.listen(8080);

// 如 ws:// 协议，会触发这里的协议升级
server.on('upgrade', function upgrade(request, socket, head) {
  // 抛给 express 去处理
  app.emit('upgrade', request, socket, head);
});
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