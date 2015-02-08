/* global describe, it */
'use strict';
var chai = require('chai');
var expect = chai.expect;
var extract = require('../src/keywords').extract;

describe('keywords', function() {
  it('can extract and reverse keywords', function() {
    expect(
      extract(['ONE', 'TWO'])
    ).to.deep.equal(['ONE', 'TWO']);
  });
  it('reverses the nature of things', function() {
    expect(
      extract(['LOVE', 'TWO'])
    ).to.deep.equal(['HATE', 'TWO']);
  });
  it('ignores number starting things', function() {
    expect(
      extract(['1FOREVER', 'TWO'])
    ).to.deep.equal(['TWO']);
  });
  it('returns some greetings if nothing else is given', function() {
    expect(
      extract()
    ).to.include('HI');
  });
});

