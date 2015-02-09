'use strict';

var MegaHAL = require('./megahal');
var RedisStorage = require('./storage/redis');
var Redis = require('redis');

module.exports = function(robot) {
  var mh = MegaHAL({
    storage: RedisStorage({
      client: Redis.createClient()
    })
  });
  robot.catchAll( function( msg ) {
    if( !msg.message.text || !msg.message.room ) {
      return;
    }
    mh.learn(msg);
  });

  robot.respond( /(.{2,})/, function(msg) {
    mh.reply( msg.match[1], function( err, res ) {
      msg.send( res );
    });

  });
};
