'use strict';
var Model = require('./model');
var Keywords = require('./keywords');
var tokenize = require('./tokenize').tokenize;
var async = require('async');
var _ = require('underscore');

function MegaHAL(options) {
  if( typeof options === 'undefined' ) {
    options = {};
  }
  var self = this instanceof MegaHAL ? this : Object.create(MegaHAL.prototype);
  self.forward  = new Model({name: 'forward',  strategy: require('./model_strategy/forward'), storage: options.storage});
  self.backward = new Model({name: 'backward', strategy: require('./model_strategy/backward'), storage: options.storage});
  self.originalCase  = new Model({name: 'originalCase',     strategy: require('./model_strategy/case'), storage: options.storage});
  self.punc     = new Model({name: 'punc',     strategy: require('./model_strategy/punc'), storage: options.storage});
  self.seed     = new Model({name: 'seed',     strategy: require('./model_strategy/seed'), storage: options.storage});

  //['models', 'generateReply', 'bestReply'

  return self;

}

MegaHAL.prototype.learn = function(input, cb) {
  async.each(this.models(), function(model,cb) {
    model.learn(input, cb);
  }, function() { if(cb) { cb(); } });
};
MegaHAL.prototype.clear = function(cb) {
  async.each(this.models(), function(model, cb){
    model.clear(cb);
  }, function() { if(cb) { cb(); } });
};

MegaHAL.prototype.models = function() {
  return [this.forward, this.backward, this.originalCase, this.punc, this.seed];
};

MegaHAL.prototype.reply = function(input, errorResponse, cb) {
  if( typeof errorResponse === 'function' ) {
    cb = errorResponse;
  }
  if( typeof errorResponse === 'undefined' ) {
    errorResponse = '...';
  }
  var inputTokens = tokenize(input);
  var keywords = Keywords.extract(inputTokens.normalized);

  var self = this;

  async.parallel([
    function(cb) {
      async.times(9, function(n, next) {
        self.generateReply(keywords, next);
      }, cb);
    },
    function(cb) {
      self.generateReply([], cb);
    }
  ], function(err, results) {
    if( err ) { return cb(err); }

    self.bestReply(results[0].concat([results[1]]), inputTokens.normalized, keywords, function(err, res) {
      if( err || typeof res === 'undefined') {
        cb( null, errorResponse );
      }
      else {
        cb( null, res );
      }
    });
  });
};

MegaHAL.prototype.bestReply = function(replies, normalizedInput, keywords, cb) {
  var self = this;
  async.seq(
    function(replies, cb) {
      cb( null,
        _.filter( replies, function(reply) {
          if( !reply || _.isEqual(reply,normalizedInput) ) {
            return false;
          }
          return true;
        })
      );
    },
    function(nonBoringReplies, cb) {
      async.sortBy(nonBoringReplies, function(reply, cb) {
        self.scoreUtterance(reply, keywords, function( err, res ) {
          cb( err, -1 * res );
        });
      }, cb);
    },
    function(sortedReplies, cb) {
      async.map( sortedReplies, function(reply, cb) {
        self.rewrite(reply, cb);
      }, cb);
    },
    function(rewrittenReplies, cb ) {
      var nonBlank = _.filter(rewrittenReplies, function(reply) { return !!reply; });
      if( nonBlank.length > 0 ) {
        cb( null, nonBlank[0] );
      }
      else {
        cb( null, undefined );
      }
    }
  )(replies, function( err, res ) {
    cb(err, res);
  });
};

MegaHAL.prototype.scoreUtterance = function(norms,keywords, cb) {
  var self = this;
  // TODO refactor to score against model to dedupe and to split into trigrams for mapping
  async.parallel({
    forward: function(cb) {
      async.reduce(norms, {context: ['<fence>', '<fence>'], score: 0}, function(memo, norm, cb) {
        var nextContext = [memo.context[1], norm];
        if( keywords.indexOf(norm) !== -1 ) {
          self.forward.surprise(memo.context, norm, function(err, surprise) {
            cb( null, {context: nextContext, score: memo.score + surprise});
          });
        }
        else {
          cb( null, {context: nextContext, score: memo.score});
        }
      }, cb);
    },
    backward: function(cb) {
      async.reduce(norms.slice().reverse(), {context: ['<fence>', '<fence>'], score: 0}, function(memo, norm, cb) {
        var nextContext = [memo.context[1], norm];
        if( keywords.indexOf(norm) !== -1 ) {
          self.backward.surprise(memo.context, norm, function(err, surprise) {
            cb( null, {context: nextContext, score: memo.score + surprise});
          });
        }
        else {
          cb( null, {context: nextContext, score: memo.score});
        }
      }, cb);
    }
  }, function( err, results ) {
    if( err ) { return cb(err); }
    var score = results.forward.score + results.backward.score;
    if( norms.length >= 8 ) {
      score /= Math.sqrt(norms.length);
    }
    if( norms.length > 16 ) {
      score /= norms.length;
    }

    cb( null, score );
  });
};

MegaHAL.prototype.generateReply = function(keywords, cb) {
  var interestingKeywords = keywords.filter(function(keyword) { return !Keywords.Auxiliary[keyword]; });

  if( interestingKeywords.length > 0) {
    // Choose a word to try to base the reply off of
    var seedKeyword = _.sample(interestingKeywords);

    var self = this;
    // For any contexts that fill in the blank, let's try to generate a seed
    async.parallel([
      function(cb) {
        self.seed.pick(['<blank>', seedKeyword], function(err, res) {
          if( res ) {
            cb( null, [res, seedKeyword]);
          }
          else {
            cb( null, undefined );
          }
        });
      },
      function(cb) {
        self.seed.pick([seedKeyword, '<blank>'], function(err, res) {
          if( res ) {
            cb( null, [seedKeyword, res]);
          }
          else {
            cb( null, undefined );
          }
        });
      }
    ], function( err, res ) {
      var contexts = _.filter(res, function(c) { return typeof c !== 'undefined'; });
      if( contexts.length < 1 ) {
        return cb( null, undefined );
      }
      // Choose one of the contexts at random as a seed
      var context = _.sample(contexts);

      // For the glue, filter out the <fence> so it doesn't make it into the reply
      var glue = _.filter(context, function(norm) { return norm !== '<fence>'; });

      async.parallel({
        backward: function(cb) {
          self.backward.walk(context.slice().reverse(), keywords, cb);
        },
        forward: function(cb) {
          self.forward.walk(context, keywords, cb);
        }
      }, function( err, results ) {
        if( err ) { return cb(err); }
        var combined = results.backward.slice().reverse()
          .concat(glue)
          .concat(results.forward);

        return cb( null, combined );

      });
    });
  }
  else {
    this.forward.walk(['<fence>','<fence>'], keywords, function( err, res) {
      return cb(null, res);
    });
  }

};


MegaHAL.prototype.rewrite = function(norms, cb) {
  var self = this;
  async.retry( 10, function(cb) {
    self.wordsFromNorms(norms, function(err, res) {
      if( err ) { return cb(err); }
      // TODO refactor to use custom errors to signify bailing, but not in a way that ends up swallowing errors
      if( typeof res === 'undefined' ) {
        return cb( true );
      }
      return cb(null, res);
    });
  }, function(err, res) {
    if( err ) {
      return cb(null, undefined);
    }
    self.addPunctuationToWords(res, function( err, res ) {
      if( err ) { return cb(err); }
      cb( null, res );
    });
  });
};

MegaHAL.prototype.addPunctuationToWords = function(words, cb) {
  var self = this;
  async.reduce(
    words.concat('<fence>'),
    {punctuation: [], context: ['<fence>','<fence>'] },
    function(memo, word, next) {
      var context = [memo.context[1], word];
      self.punc.pick(context, function(err,res) {
        next( null, {punctuation: memo.punctuation.concat(res), context: context});
      });
    },
    function(err, res) {
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

MegaHAL.prototype.wordsFromNorms = function(norms, cb) {
  var self = this;
  async.reduce( norms, {words: [] }, function(memo, norm, cb) {
    var context = [
      memo.words.length === 0 ? '<fence>' : memo.words[memo.words.length-1],
      norm
    ];

    self.originalCase.pick(context, function(err, cased) {
      if( err || !cased ) {
        // TODO refactor to use custom errors to signify bailing, but not in a way that ends up swallowing errors
        return cb(true, undefined);
      }
      cb(null, { words: memo.words.concat(cased) });
    });
  }, function(err, memo) {
    if( err ) {
      return cb(null, undefined);
    }

    var words = memo.words;

    self.punc.pick([words[words.length-1], '<fence>'], function( err, punc ) {
      if( err ) { return cb(err); }
      // We couldn't find a punctuation to end the phrase with
      if( typeof punc === 'undefined' ) {
        cb( null, undefined );
      }
      else {
        cb( null, words );
      }
    });
  });
};

module.exports = MegaHAL;
