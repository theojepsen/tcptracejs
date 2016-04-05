process.chdir(__dirname);
var TcpTrace = require('../');
var expect = require('expect.js');

var cons = {
'1': { id: 1, complete: false, hosts: [ { ip: '10.4.0.5', port: 56225 }, { ip:  '10.0.0.22', port: 1337 } ],  first_packet: 1459879034.000012,  last_packet: 1459879034.000012 },
'2': { id: 2, complete: false, hosts: [ { ip: '10.4.0.5', port: 56232 }, { ip: '10.0.0.22', port: 1337 } ], first_packet: 1459879205.000013, last_packet: 1459879205.000013 },
'3': { id: 3, complete: false, hosts: [ { ip: '10.4.0.5', port: 56234 }, { ip: '10.0.0.22', port: 1337 } ], first_packet: 1459879205.000013, last_packet: 1459879205.000013 },
'4': { id: 4, complete: false, hosts: [ { ip: '10.0.0.22', port: 1337 }, { ip: '10.4.0.5', port: 56225 } ], first_packet: 1459879274.000013, last_packet: 1459879274.000013 },
'5': { id: 5, complete: false, hosts: [ { ip: '10.0.0.22', port: 1337 }, { ip: '10.4.0.5', port: 56232 } ], first_packet: 1459879445.000013, last_packet: 1459879445.000013 },
'6': { id: 6, complete: false, hosts: [ { ip: '10.0.0.22', port: 1337 }, { ip: '10.4.0.5', port: 56234 } ], first_packet: 1459879445.000013, last_packet: 1459879445.000013 }
};

describe('Different ways of initialization', function () {
  it('Using new', function () {
    var tt = new TcpTrace('./in.cap');
    expect(tt).to.be.ok();
    expect(tt.getConnections).to.be.a('function');
  });
  it('Calling as a function', function () {
    var tt = TcpTrace('./in.cap');
    expect(tt).to.be.ok();
    expect(tt.getConnections).to.be.a('function');
  });
});

describe('Use event emitter or callback', function () {
  it('Event should be emitted', function (done) {
    var tt = TcpTrace('./in.cap');
    tt.once('connection', function (err, con) {
      expect(err).to.not.be.ok();
      expect(con).to.be.an('object');
      done();
    });
  });
  it('Done event should be emitted', function (done) {
    var tt = TcpTrace('./in.cap');
    tt.on('done', done);
  });
  it('Callback should be called', function (done) {
    var count = 0;
    var tt = TcpTrace('./in.cap', function (err, con) {
      expect(err).to.not.be.ok();
      expect(con).to.be.an('object');
      count++;
      if (count === 1) done();
    });
  });
});

describe('Find expected connections', function () {
  this.timeout(500);
  it('Correct addresses and ports', function (done) {
    var tt = new TcpTrace('./in.cap');
    tt.on('connection', function (err, con) {
      expect(cons).to.have.key(con.id +'');
      expect(con.complete).to.be(cons[con.id].complete);
      expect(con.last_packet).to.be(cons[con.id].last_packet);
      expect(con.first_packet).to.be(cons[con.id].first_packet);
      expect(con.hosts[0].ip).to.be(cons[con.id].hosts[0].ip);
      expect(con.hosts[0].port).to.be(cons[con.id].hosts[0].port);
      expect(con.hosts[1].ip).to.be(cons[con.id].hosts[1].ip);
      expect(con.hosts[1].port).to.be(cons[con.id].hosts[1].port);
    });
    tt.on('done', done);
  });
});
