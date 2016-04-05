# TcpTrace JS
A Node.js wrapper for `tcptrace`.

## Synopsis
```js
var tt = new TcpTrace('./in.cap');

var first_time, last_time = 0;
tt.on('connection', function (err, con) {
  console.log(con.hosts[0].ip, 'talked with', con.hosts[1].ip);

  if (!first_time) first_time = con.first_packet;
  if (con.last_packet > last_time) last_time = con.last_packet;

});

tt.on('done', function (err) {
  console.log('elapsed time', last_time - first_time);
};
```


