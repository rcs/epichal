'use strict';

var MegaHAL = require('../src/node-megahal/src/megahal');
var RedisStorage = require('../src/node-megahal/src/storage/redis');
var Redis = require('redis');
var Url = require('url');

module.exports = function(robot) {
  var client, info;

  // Make it like redis brain does
  info = Url.parse(
    process.env.REDISTOGO_URL ||
    process.env.REDISCLOUD_URL ||
    process.env.BOXEN_REDIS_URL ||
    'redis://localhost:6379'
  );

  client = Redis.createClient(info.port, info.hostname);

  if (info.auth) {
      client.auth(info.auth.split(':')[1]);
  }

  var mh = MegaHAL({
    storage: RedisStorage({
      client: client
    })
  });

  robot.hear( /.{5,}/, function( msg ) {
    if( !msg.message.text || !msg.message.room ) {
      return;
    }
    var split = msg.message.text.split(/\b/);
    if( split[0].toUpperCase() !== robot.name.toUpperCase() ) {

      mh.learn(msg.message.text, function() {
        robot.logger.debug('learned ' + msg.message.text );
      });
    }
  });

  robot.hear( /.+/, function(msg) {
    robot.logger.debug('matching a response');
    if( !msg.message.text ) {
      return;
    }
    var split = msg.message.text.split(/\b/);
    if( split[0].toUpperCase() === robot.name.toUpperCase() ) {
      robot.logger.debug('Making it happen from megahal');
      mh.reply( split.slice(2).join(''), function( err, res ) {
        msg.send( res );
      });
    }

  });
};
