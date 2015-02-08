/* global describe, it */
'use strict';
var expect = require('chai').expect;
var Model = require('../src/model');

describe('Model', function() {
  it('creates', function() {
    var model = Model({name: 'foo'});
    expect(model).to.be.an.instanceof(Model);
  });
  it('creates with new', function() {
    var model = new Model({name: 'foo'});
    expect(model).to.be.an.instanceof(Model);
  });

  it('throws on no name', function() {
    expect(function() { Model(); }).to.throw(Error);
  });

  it('can use basic strategies', function() {
    var model = Model({name: 'foo'});

    model.learn('one two three');
    expect(model.walk(['<fence>','<fence>'])).to.deep.equal(['ONE', 'TWO', 'THREE']);
  });

  it('can pick', function() {
    var model = Model({name: 'bar'});
    model.learn('one two three');
    expect(model.pick(['ONE', 'TWO'])).to.equal('THREE');
  });

  it('prioritizes things matching keywords', function() {
    var model = Model({name: 'foo'});

    expect(model.bestNext(['one','two','three'], ['two'])).to.equal('two');
  });
  it('still returns things when no keywords match', function() {
    var model = Model({name: 'foo'});

    expect(model.bestNext(['one','two','three'], ['notinit'])).to.equal('one');
  });
  it('handles statistic measures', function() {
    var model = Model({name: 'foo'});
    model.learn('one two three');
    expect(model.uncertainty(['ONE','TWO'])).to.equal(0);
    expect(model.surprise(['ONE','TWO'],'THREE')).to.equal(0);
  });

});
