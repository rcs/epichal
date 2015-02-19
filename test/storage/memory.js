/* global describe */
'use strict';
var chai = require('chai');
var sinonChai = require('sinon-chai');
chai.use(sinonChai);
var MemoryStorage = require('../../src/storage/memory');

describe('storage/memory', function() {
  require('./_abstract')(new MemoryStorage());
});

