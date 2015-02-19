'use strict';
var readline = require('readline');
var MegaHAL = require('../src/megahal');
var async = require('async');

var sherlockSeed = require('../support/sherlock.json');

var megaHal = MegaHAL();

async.each(sherlockSeed, function(line, cb) { megaHal.learn(line, cb); }, function() {

  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.setPrompt('> ');

  rl.on('line', function(input) {
    megaHal.reply(input, function(err, reply) {
      console.log(reply);
      rl.prompt();
      megaHal.learn(input);
    });
  });

  megaHal.reply('', function(err, reply) {
    console.log(reply);
    rl.prompt();
  });
});