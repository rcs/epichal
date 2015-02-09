/* global describe, it, beforeEach */
'use strict';
var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
chai.use(sinonChai);
var memoryStorage = require('../../src/storage/memory');
var async = require('async');

require('./_abstract')(memoryStorage);

