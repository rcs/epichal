/* global describe, it */
'use strict';
var chai = require('chai');
var expect = chai.expect;
var RedisStorage = require('../../src/storage/redis');


var redisStorage = RedisStorage({
  client: require('fakeredis').createClient('host','port', {fast: true})
});

describe('storage/redis', function() {
  it('throws without a client, or host/port pair', function() {
    expect( function(){ new RedisStorage(); } ).to.throw(Error);
    expect( function(){ new RedisStorage({client: {}}); } ).to.not.throw(Error);
  });

  require('./_abstract')(redisStorage);
});

