/* global describe, it */
'use strict';
var expect = require('chai').expect;
var async = require('async');
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

  it('can use basic strategies', function(done) {
    var model = Model({name: 'foo'});

    model.learn('one two three', function() {
      model.walk(['<fence>','<fence>'], function(err,res) {
        expect(res).to.deep.equal(['ONE', 'TWO', 'THREE']);
        done();
      });
    });
  });

  it('can pick', function(done) {
    var model = Model({name: 'bar'});
    model.learn('one two three', function() {
      model.pick(['ONE', 'TWO'], function(err,res) {
        expect(res).to.equal('THREE');
        done();
      });
    });
  });

  it('returns undefined for things it hasn\'t seen', function(done) {
    var model = Model({name: 'emptyPick'});
    model.learn('one two three', function() {
      model.pick(['NOT', 'IN'], function(err,res) {
        expect(res).to.equal(undefined);
        done();
      });
    });

  });

  it('prioritizes things matching keywords', function() {
    var model = Model({name: 'foo'});
    expect(model.bestNext(['one','two','three'], ['two'])).to.equal('two');
  });
  it('still returns things when no keywords match', function() {
    var model = Model({name: 'foo'});

    expect(model.bestNext(['one','two','three'], ['notinit'])).to.equal('one');
  });
  it('returns things when keywords are empty', function() {
    var model = Model({name: 'foo'});

    expect(model.bestNext(['one','two','three'] )).to.equal('one');
  });

  it('handles statistic measures', function(done) {
    var model = Model({name: 'foo'});
    model.learn('one two three', function() {
      model.surprise(['ONE','TWO'],'THREE', function(err,res) {
        expect(res).to.equal(0);
        done();
      });
    });
  });
});
