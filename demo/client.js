'use strict';
const path = require('path');
const { Client } = require('../index');
const client = new Client({
  cwd: path.resolve(__dirname, './from'),
  url: 'ws://localhost:1199?key=other'
});
client.ignore('ignore/*.txt');

// 上传全部
client.upload({ dirname: '.' }).on('end', function() {
  console.log('上传结束后，要求服务器重启');
  client.command('restart');
});

// // 仅上传 child 目录
// client.upload({ dirname: './child' })

// // 下载文件
// client.download({
//   cwd: './download', // 存储在什么地方
//   remote: './child', // 下载远程的什么文件
// });