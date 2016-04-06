var split = require('split');
var moment = require('moment');
var fs = require('fs');
var util = require("util");
var EventEmitter = require("events").EventEmitter;
var spawn = require('child_process').spawn;

function dateStrToSec(str) { // return secs.fracs since epoch
  var unix_ms = +moment(str, "ddd MMM DD HH:mm:ss:.SSSSSS YYYY");
  var unix_s = Math.floor(unix_ms / 1000);
  var us = parseInt(str.split('.')[1].split(' ')[0], 10) / 1e6;
  return unix_s + us;
}

function TcpTrace() {
  var self = this;
  var args = Array.prototype.slice.call(arguments, 0);

  if (! (self instanceof TcpTrace))
    return new TcpTrace(args[0], args[1]);

  TcpTrace.prototype.__init.apply(self, args);
}
util.inherits(TcpTrace, EventEmitter);

TcpTrace.prototype.__init = function () {
  var self = this;
  var args = Array.prototype.slice.call(arguments, 0);
  if (args.length < 1) throw new Error("not enough arguments for TcpTrace");
  self.opts = args[0];
  if (typeof args[0] === 'string') self.opts = {filename: args[0]};

  if (!self.opts.filename) throw new Error("No pcap file specified");
  if (!fs.existsSync(self.opts.filename)) throw new Error("File does not exist: " + self.opts.filename);

  var optional_cb = args[1];
  if (optional_cb && typeof optional_cb !== 'function') throw new Error("callback is not a function");
  self.getConnections(optional_cb);
};


TcpTrace.prototype.getConnections = function (callback) {
  var self = this;
  var args = ['-n', '-l', self.opts.filename];
  var proc = spawn('tcptrace', args);
  proc.stderr.pipe(process.stderr);

  var m, curr_conn;

  proc.stdout.pipe(split())
  .on('data', function (line) {
    if (curr_conn === undefined) {
      if (!(m = line.match(/^TCP connection ([0-9]+):/))) return;
      curr_conn = {
        id: parseInt(m[1]),
        complete: false,
        hosts: []
      };
      return;
    }

    if (line === '================================') {
      curr_conn = undefined;
      return;
    }

    if ((m = line.match(/^\s+host \w+:\s+([^:]+):(.+)/))) {
      curr_conn.hosts.push({ip: m[1], port: parseInt(m[2], 10)});
    }
    else if ((m = line.match(/^\s+complete conn:\s+(yes|no)/))) {
      curr_conn.complete = m[1] === 'yes';
    }
    else if ((m = line.match(/^\s+first packet:\s+(.*)$/))) {
      curr_conn.first_packet = dateStrToSec(m[1]);
    }
    else if ((m = line.match(/^\s+last packet:\s+(.*)$/))) {
      curr_conn.last_packet = dateStrToSec(m[1]);

      // This was the last field, so emit connection
      if (callback) callback(null, curr_conn);
      self.emit('connection', null, curr_conn);
    }
  });

  proc.on('exit', function (code, signal) {
    if (code === 0) return self.emit('done');
    var err = new Error('tcptrace exited with code ' + code + ' (' + signal + ')');
    if (callback) callback(err);
    self.emit('error', err);
    self.emit('done', err);
  });
  proc.on('error', function (err) {
    if (self.listenerCount('error')) return self.emit('error', err);
    else throw err;
  });
};

module.exports = TcpTrace;
