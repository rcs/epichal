'use strict';
var MegaHAL = require('./megahal');
var Url = require('url');
var Redis = require('redis');

var lineReader = require('line-reader');


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
lineReader.eachLine(process.argv[2], function(line,last,cb) {
  counter++;
  if( (counter % 100) === 0) {
    console.error(counter);
  }
  mh.learn(line, cb);
});
