'use strict';
var Model = require('./model');
var Keywords = require('./keywords');
var async = require('async');
var _ = require('underscore');
var tokenize = require('./tokenize').tokenize;

/*
 * Glossary --
 *
 * Model -- a set of behaviors wrapped around a markov chain. Things like how
 *          to deal with input text to extract the trigrams it cares about
 *
 * Phrase -- an array of normalized (all caps!) words
 *
 * Seed -- a bigram consisting of two normalized words, used as the 'seed' or
 *         'anchor' from which we generate a phrase. Two words so we can use it
 *         as the context for any model querying
 *
 * Trigram -- A set of three things. Generally used here to interact with the
 *            models, which always think in terms of (bigram -> seen) mappings.
 *
 *
 *
 *


/**
 * EpicHAL - 
 * @constructor
 */
function EpicHAL(options) {
  if( typeof options === 'undefined' ) {
    options = {};
  }
  var self = this instanceof EpicHAL ? this : Object.create(EpicHAL.prototype);

  self.forward  = new Model({
    name: 'forward',
    strategy: require('./model_strategy/forward'),
    storage: options.storage
  });
  self.backward = new Model({
    name: 'backward',
    strategy: require('./model_strategy/backward'),
    storage: options.storage
  });
  self.originalCase = new Model({
    name: 'originalCase',
    strategy: require('./model_strategy/case'),
    storage: options.storage
  });
  self.punc = new Model({
    name: 'punc',
    strategy: require('./model_strategy/punc'),
    storage: options.storage
  });
  self.seed = new Model({
    name: 'seed',
    strategy: require('./model_strategy/seed'),
    storage: options.storage
  });

  return self;

}

/**
 * Learn a string of input across all models
 *
 * input - String to learn
 *
 * Optionally calls back with nothing when finished
 */
EpicHAL.prototype.learn = function(input, cb) {
  async.each(this.models(), function(model,cb) {
    model.learn(input, cb);
  }, function(err) {
    /* istanbul ignore else */
    if(cb) { cb(err); }
  });
};

/**
 * Clear all models
 *
 * Optionally calls back with nothing when finished
 */
EpicHAL.prototype.clear = function(cb) {
  async.each(this.models(), function(model, cb){
    model.clear(cb);
  }, function(err) {
    /* istanbul ignore else */
    if(cb) { cb(err); }
  });
};

/**
 * Array of all models involved in EpicHAL
 */
EpicHAL.prototype.models = function() {
  return [this.forward, this.backward, this.originalCase, this.punc, this.seed];
};

/**
 * Generate a reply for a given input
 *
 * input       - the string to reply to or a falsy value
 *
 * Calls back with a string reply or `undefined` if one couldn't be generated
 */
EpicHAL.prototype.reply = function(input, cb) {
  var interestingWords = Keywords.interestingWords(input || '');
  var inputNorms = tokenize(input || '').normalized;

  // Keywords -> Seeds -> Norms -> (scored) -> Cased (denormalized)  -> (Phrase) Punctuated
  // We try to generate 10 different phrases. We start the generation off each
  // phrase off with a selection of keywords from the input, and an empty set.
  //
  // For each of those, we generate a 'seed', putting a keyword somewhere in
  // the phrase
  //
  // For each of those seeds, we generate a list of normalized (all capped)
  // words by generating words forwards and backwards from the seed.
  //
  // We score each of those lists based on how 'surprising' the sequence is vs
  // the models we've seen.
  //
  // For each of the normalized word lists, we then try to rewrite them to be
  // properly cased words, with the correct punctuation, spaces, etc, between
  // them.
  //
  // We rank these all based on the score, and reply with the highest scored
  // one.
  //
  //
  // Seed with an empty so we can always generate something
  var keywordMap = [[]];
  for( var i = 0; i < 9; i++ ) {
    keywordMap.push(interestingWords);
  }

  var self = this;

  async.map(keywordMap, async.seq(
    self.seedFromKeywords.bind(self),
    self.phraseFromSeed.bind(self, interestingWords),
    function( phrase, cb ) {
      self.rewrite(phrase, function(err,res) {
        /* istanbul ignore if */ if( err ) { return cb(err); }
        cb(null, {norms: phrase, rewritten: res});
      });
    }
  ), function(err, res) {
    /* istanbul ignore if */ if( err ) { return cb(err); }

    // We filter out anything that looks the same as the input
    res = _.filter( res, function(phrase) {
      return _.difference(phrase.norms, inputNorms).length !== 0;
    });


    async.sortBy(res, function(phrase, cb) {
      self.scoreUtterance(interestingWords, phrase.norms, function(err, res) {
        cb( err, -1 * res );
      });
    }, function( err, res ) {

      /* istanbul ignore if */
      if( err ) {
        console.error(err);
        return cb(null, undefined);
      }


      /* istanbul ignore if */ if( err ) { return cb(err); }
      return cb( null, _.compact(_.pluck(res, 'rewritten'))[0] );
    });

  });

};

/**
 * Get all slices of a given size possible from an array
 *
 * arr        - the array to decompose
 * windowSize - the size of the slices
 *
 * Examples
 *
 *  _slidingWindow([1,2,3,4,5],3)
 *  // [[1,2,3],[2,3,4], [3,4,5]]
 *
 * Returns an array of the slices
 */
function _slidingWindow(arr, windowSize) {
  var lastEntry = arr.length - windowSize;
  /* istanbul ignore if */
  if( lastEntry < 0 ) {
    throw new Error('windowSize bigger than array');
  }

  return _.range(0,lastEntry + 1).map(function(idx) {
    return arr.slice(idx,idx+windowSize);
  });
}

/**
 * Score surprise for a series of trigrams for a model (ex. forwards or
 * backwards), only taking in to account the overlap with `interestingWords`
 *
 * model            - the model to score against
 * trigrams         - the trigrams to score
 * interestingWords - the interestingWords we're interested in
 *
 * Calls back with a numeric score
 *
 */
function _scoreTrigramsForModel(model, trigrams, interestingWords, cb ) {
  var interestingTrigrams = _.filter(trigrams, function(trigram) {
    return interestingWords.indexOf(trigram[2]) !== -1;
  });

  // If we have zero overlap, we rank this below any overlap at all
  if( interestingTrigrams.length < 1 ) {
    return cb(null, -1);
  }

  async.map( interestingTrigrams, function(trigram, cb) {
    model.surprise([trigram[0], trigram[1]], trigram[2], cb);
  }, function(err, res) {
    /* istanbul ignore if */ if( err ) { return cb(err); }

    var score = _.reduce(_.compact(res), function(acc, keyScore) {
      return acc + keyScore;
    }, 0);
    cb( null, score );
  });
}

/**
 * Scores a phrase based on how surprising the overlap with
 * `interestingWords` is. We break the phrase apart and score it against
 * forwards and backwards models.
 *
 * interestingWords - the words we're checking for overlap of
 * norms            - the phrase to score
 *
 * Calls back with a numeric score
 */
EpicHAL.prototype.scoreUtterance = function(interestingWords, norms, cb) {
  var self = this;

  if( typeof norms === 'undefined' || norms.length === 0 ) {
    return cb( null, 0 );
  }

  // For a phrase ['one', 'two', 'three', 'four'], we look at:
  // ['<fence>', '<fence>', 'one'], ['<fence>', 'one', 'two'], ... for the
  // forwards model and
  // ['<fence>', '<fence>', 'four'], ['<fence>', 'four', 'three'], ... for the
  // backwards
  async.map([
    {
      model: self.forward,
      trigrams: _slidingWindow( ['<fence>', '<fence>'].concat(norms), 3)
    },
    {
      model: self.backward,
      trigrams: _slidingWindow( ['<fence>', '<fence>'].concat(norms
                                                              .slice()
                                                              .reverse()
                                                             ), 3)
    }
  ], function(spec, cb) {
    _scoreTrigramsForModel(spec.model, spec.trigrams, interestingWords,  cb);
  }, function(err, res) {
    /* istanbul ignore if */ if( err ) { return cb(err); }

    var score = _.reduce(res, function(acc, keyScore) {
      return acc + keyScore;
    }, 0);

    if( norms.length >= 8 ) {
      score /= Math.sqrt(norms.length);
    }
    if( norms.length > 16 ) {
      score /= norms.length;
    }

    cb( null, score );
  });
};


/**
 * Generate a resolvable 'seed' from a set of keywords, or undefined.
 * '<blank>' we'll later be filling.
 *
 * keywords - the set of keywords to sample from to generate the non-blank
 *            portion of the bigram.
 *
 * Calls back with a bigram (array) that includes a '<blank>', or undefined if
 * we didn't find a valid seed based on the randomly chosen keyword
 */
EpicHAL.prototype.seedFromKeywords = function(keywords, cb) {
  if( keywords.length === 0 ) {
    return cb(null, undefined);
  }

  var seedKeyword = _.sample(keywords);
  var self = this;

  // For any contexts that fill in the blank, let's try to generate a seed by
  // picking a template including the seedKeyword from our previous
  // observations
  async.parallel([
    function(cb) {
      self.seed.pick(['<blank>', seedKeyword], function(err, res) {
        return res ? cb( null, [res, seedKeyword]) : cb(null, undefined);
      });
    },
    function(cb) {
      self.seed.pick([seedKeyword, '<blank>'], function(err, res) {
        return res ? cb( null, [seedKeyword, res]) : cb(null, undefined);
      });
    }
  ], function( err, res ) {
    /* istanbul ignore if */ if( err ) { return cb(err); }

    // If we managed to find more than one, choose one randomly and return it.
    cb( null, _.chain(res).compact().sample().value() );
  });
};

/**
 * Generate a phrase from a seed, trying to make it interesting vs `keywords`.
 * We take the seed and walk both ways (using forward and backward models)
 * until we hit a '<fence>', and bring them together. If the seed is undefined,
 * we generate whatever we can.
 *
 * keywords - the keywords we're trying to be interesting in regards to
 * seed     - the seed of the phrase
 *
 * Calls back with a phrase (array of normalized words)
 *
 */
EpicHAL.prototype.phraseFromSeed = function(keywords, seed, cb) {
  var glue = _.filter(seed, function(norm) { return norm !== '<fence>'; });
  var self = this;

  if( typeof seed === 'undefined' ) {
    return self.forward.walk(['<fence>','<fence>'], keywords, cb);
  }

  async.parallel({
    backward: function(cb) {
      self.backward.walk(seed.slice().reverse(), keywords, cb);
    },
    forward: function(cb) {
      self.forward.walk(seed, keywords, cb);
    }
  }, function( err, results ) {
    /* istanbul ignore if */ if( err ) { return cb(err); }

    var combined = (results.backward || []).slice().reverse()
      .concat(glue)
      .concat(results.forward || []);

    return cb( null, combined );

  });
};

/**
 * Take an array of normalized words, and use our casing and punctuation models
 * to make it pretty.
 *
 * norms - the array of normalized words to make pretty
 *
 * Calls back with a string that is the pretty phrase, or undefined if it
 * couldn't be generated
 */
EpicHAL.prototype.rewrite = function(norms, cb) {
  var self = this;
  // Try to do this 10 times, since it may fail due to path dependency.
  // ex. We saw 'one two three' and 'ONE Two four', we can't generate the next
  // cased word given norms of 'ONE TWO THREE' and the cased rewrite of 'ONE
  // Two'. This can happen at any point in the chain, so we just do our best a
  // few times.
  async.retry( 10, function(cb) {
    self.wordsFromNorms(norms, function(err, res) {
      /* istanbul ignore if */ if( err ) { return cb(err); }
      /* istanbul ignore if: testing probablistic functions is hard */
      if( typeof res === 'undefined' ) {
        var e = new Error('Couldn\'t generate cased sequence');
        e.name = 'GenerationError';
        return cb(e);
      }
      return cb(null, res);
    });
  }, function(err, res) {
    /* istanbul ignore next: testing probablistic functions is hard */
    if( err && err.name === 'GenerationError' ) { return cb(null, undefined); }
    /* istanbul ignore if */ if( err ) { return cb(err); }

    self.addPunctuationToWords(res, function( err, res ) {
      /* istanbul ignore if */ if( err ) { return cb(err); }
      cb( null, res );
    });
  });
};

/**
 * Take an array of cased words, and add punctuation (spaces, periods, question
 * marks, etc) to turn it into a plausible string
 *
 * words - an array of cased words to add punctuation to
 *
 * Calls back with a string punctuated like we previously observed
 */
EpicHAL.prototype.addPunctuationToWords = function(words, cb) {
  var self = this;
  if( words.length === 0 ) {
    return cb(null, undefined);
  }
  async.reduce(
    words.concat('<fence>'),
    {punctuation: [], context: ['<fence>','<fence>'] },
    function(memo, word, next) {
      var context = [memo.context[1], word];
      self.punc.pick(context, function(err,res) {
        next( null, {
          punctuation: memo.punctuation.concat(res),
          context: context
        });
      });
    },
    function(err, res) {
      /* istanbul ignore if */ if( err ) { return cb(err); }
      var combined = _.zip(res.punctuation, words).reduce(function(string, mapping) {
        var punc = mapping[0];
        var word = mapping[1];

        if( typeof word === 'undefined') {
          return string + punc;
        }
        return string + punc + word;
      }, '');

      cb(null, combined);
    }
  );
};


/**
 * Turns a sequence of normalized words into a sequence of words with plausible
 * casing.
 *
 * norms - an array of normalized words
 *
 * Calls back with an array of cased words
 */
EpicHAL.prototype.wordsFromNorms = function(norms, cb) {
  var self = this;
  if( typeof norms === 'undefined' || norms.length === 0 ) {
    return cb( null, [] );
  }
  async.reduce( norms, {words: [] }, function(memo, norm, cb) {
    var context = [
      memo.words.length === 0 ? '<fence>' : memo.words[memo.words.length-1],
      norm
    ];

    self.originalCase.pick(context, function(err, cased) {
      /* istanbul ignore if */ if( err ) { return cb(err); }

      // We might not have been able to find a next word for a given sequence
      /* istanbul ignore if: testing probablistic functions is hard */
      if( !cased ) {
        var e = new Error('Couldn\'t generate cased sequence');
        e.name = 'GenerationError';
        return cb(e);
      }
      cb(null, { words: memo.words.concat(cased) });
    });
  }, function(err, memo) {
    /* istanbul ignore next: testing probablistic functions is hard */
    if( err && err.name === 'GenerationError' ) { return cb(null, undefined); }
    /* istanbul ignore if */ if( err ) { return cb(err); }

    var words = memo.words;

    self.punc.pick([words[words.length-1], '<fence>'], function( err, punc ) {
      /* istanbul ignore if */ if( err ) { return cb(err); }
      // We couldn't find a punctuation to end the phrase with
      /* istanbul ignore next: testing probablistic functions is hard */
      if( typeof punc === 'undefined' ) {
        cb( null, undefined );
      }
      else {
        cb( null, words );
      }
    });
  });
};

module.exports = EpicHAL;
