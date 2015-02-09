/* global describe */
'use strict';
var Redis= require('redis');
var RedisStorage = require('../../src/storage/redis');


var redisStorage = RedisStorage({client: Redis.createClient()});
describe('storage/redis', function() {
  require('./_abstract')(redisStorage);
});

