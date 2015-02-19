'use strict';
var fs = require('fs');
var readline = require('readline');
var stream = require('stream');
var MegaHAL = require('./megahal');
var Url = require('url');
var Redis = require('redis');

console.log(process.argv);
var instream = fs.createReadStream(process.argv[2]);
var outstream = new stream();

var rl = readline.createInterface(instream, outstream);

// Make it like redis brain does
var info = Url.parse(
  process.env.REDISTOGO_URL ||
  process.env.REDISCLOUD_URL ||
  process.env.BOXEN_REDIS_URL ||
  'redis://localhost:6379'
);

var client = Redis.createClient(info.port, info.hostname);

if (info.auth) {
    client.auth(info.auth.split(':')[1]);
}

var mh = MegaHAL({
  storage: require('./storage/redis')({
    client: client
  })
});

var counter = 0;
rl.on('line', function(line) {
  counter++;
  if( (counter % 100) === 0) {
    console.log(counter);
  }
  mh.learn(line);
});



