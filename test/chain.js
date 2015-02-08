/* global describe, it */
'use strict';
var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var Chain = require('../src/chain');
chai.use(sinonChai);



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
  it('proxies storage calls', function() {
    var chain = Chain({name: 'foo'});
    chain.learn('foo','bar');
    expect(chain.count('foo')).to.equal(1);
    expect(chain.pick('foo')).to.equal('bar');
    expect(chain.surprise('foo', 'bar')).to.equal(0);
    expect(chain.uncertainty('foo')).to.equal(0);
    expect(chain.pickMulti('foo',2)).to.deep.equal(['bar','bar']);
    chain.clear();
    expect(chain.count('foo')).to.equal(0);
  });
  it('has pluggable storage', function() {
    var storage = {
      learn: sinon.spy(),
      pick: function(){},
      pickMulti: function(){},
      count: function(){},
      clear: function(){},
      surprise: function(){},
      uncertainty: function(){}
    };
    var chain = Chain({storage: storage, name: 'foo'});
    chain.learn('llama');
    expect(storage.learn).to.have.been.calledWith('foo', 'llama');
  });
});

