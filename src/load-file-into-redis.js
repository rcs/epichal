'use strict';
var fs = require('fs');
var readline = require('readline');
var stream = require('stream');
var MegaHAL = require('./megahal');

console.log(process.argv);
var instream = fs.createReadStream(process.argv[2]);
var outstream = new stream();

var rl = readline.createInterface(instream, outstream);

var mh = MegaHAL({
  storage: require('./storage/redis')({
    client: require('redis').createClient()
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



