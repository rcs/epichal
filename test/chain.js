/* global describe, it */
'use strict';
var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
chai.use(sinonChai);
var async = require('async');
var Chain = require('../src/chain');



describe('Chain', function() {
  it('throws without a name', function() {
    expect(function(){new Chain();}).to.throw(Error);
  });
  it('creates a thing', function() {
    var chain = new Chain({name: 'foo'});
    expect(chain).to.be.an.instanceof(Chain);
  });
  it('creates a thing without new', function() {
    var chain = Chain({name: 'foo'});
    expect(chain).to.be.an.instanceof(Chain);
  });
  it('proxies storage calls', function(done) {
    var chain = Chain({name: 'foo'});
    chain.learn('foo','bar', function() {
      async.series([
        function(next){ chain.count('foo', function(err,res) {
          expect(res).to.equal(1);
          next();
        }); },
        function(next){ chain.pick('foo', function(err,res) {
          expect(res).to.equal('bar');
          next();
        }); },
        function(next){ chain.surprise('foo', 'bar', function(err,res) {
          expect(res).to.equal(0);
          next();
        }); },
        function(next){ chain.pickMulti('foo',2, function(err,res) {
          expect(res).to.deep.equal(['bar','bar']);
          next();
        }); }
      ], function(/*err,results*/) {
        chain.clear(function() {
          chain.count('foo', function(err,res) {
            expect(res).to.equal(0);
            done();
          });
        });

      });
    });
  });
  it('has pluggable storage', function() {
    var storage = {
      learn: sinon.spy(),
      pick: function(){},
      pickMulti: function(){},
      count: function(){},
      clear: function(){},
      surprise: function(){},
    };
    var chain = Chain({storage: storage, name: 'foo'});
    chain.learn('llama');
    expect(storage.learn).to.have.been.calledWith('foo', 'llama');
  });
});

