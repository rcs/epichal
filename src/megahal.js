'use strict';
var Model = require('./model');
var Keywords = require('./keywords');
var tokenize = require('./tokenize').tokenize;
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

  return self;

}

MegaHAL.prototype.learn = function(input) {
  this.models().forEach(function(model){
    model.learn(input);
  });
};
MegaHAL.prototype.clear = function() {
  this.models().forEach(function(model){
    model.clear();
  });
};

MegaHAL.prototype.models = function() {
  return [this.forward, this.backward, this.originalCase, this.punc, this.seed];
};

MegaHAL.prototype.reply = function(input, errorResponse) {
  if( typeof errorResponse === 'undefined' ) {
    errorResponse = '...';
  }
  var inputTokens = tokenize(input);
  var keywords = Keywords.extract(inputTokens.normalized);

  var replies = [];
  for( var i = 0; i < 9; i++ ) {
    replies.push(this.generateReply(keywords));
  }
  replies.push(this.generateReply([]));


  // Filter out any failed replies
  var reply = _.chain(replies)
    .filter(function(reply) {
      if( !reply || _.isEqual(reply,inputTokens.normalized) ) {
        return false;
      }
      return true;
    })
    .sortBy(function(utterance) {
      return -1 * this.scoreUtterance(utterance, keywords);
    }.bind(this))
    .map(function(utterance) {
      return this.rewrite(utterance);
    }.bind(this))
    .filter(function(reply) {
      return !!reply;
    })
    .first()
    .value();

  return reply || errorResponse;

};

MegaHAL.prototype.scoreUtterance = function(norms,keywords) {
  var score = 0;
  var context = ['<fence>','<fence>'];

  norms.forEach(function(norm) {
    if( keywords.indexOf(norm) !== -1 ) {
      var surprise = this.forward.surprise(context,norm);
      score += surprise;
    }
    context = [context[1],norm];
  }.bind(this));

  context = ['<fence>','<fence>'];
  norms.slice().reverse().forEach(function(norm) {
    if( keywords.indexOf(norm) !== -1 ) {
      var surprise = this.backward.surprise(context,norm);
      score += surprise;
    }
    context = [context[1],norm];
  }.bind(this));

  if( norms.length >= 8 ) {
    score /= Math.sqrt(norms.length);
  }
  if( norms.length > 16 ) {
    score /= norms.length;
  }

  return score;
};

MegaHAL.prototype.generateReply = function(keywords) {
  var interestingKeywords = keywords.filter(function(keyword) { return !Keywords.Auxiliary[keyword]; });
  var replyNorms;

  if( interestingKeywords.length ) {
    // Choose a word to try to base the reply off of
    var seedKeyword = _.sample(interestingKeywords);
    var contexts = [];

    // For any contexts that fill in the blank, let's try to generate a seed
    var fillIn = this.seed.pick(['<blank>', seedKeyword]);
    if( typeof fillIn !== 'undefined' ) {
      contexts.push([fillIn, seedKeyword]);
    }
    fillIn = this.seed.pick(['<blank>', seedKeyword]);
    if( typeof fillIn !== 'undefined' ) {
      contexts.push([seedKeyword, fillIn]);
    }

    if( contexts.length < 1 ) {
      return;
    }

    var context = _.sample(contexts);
    // For the glue, filter out the <fence> so it doesn't make it into the reply
    var glue = _.filter(context, function(norm) { return norm !== '<fence>'; });

    // Combine the back walk, the glue, and the forward walk
    replyNorms = (
      this.backward.walk(context.slice().reverse(), keywords) || []
    ).reverse()
      .concat(glue)
      .concat(this.forward.walk(context,keywords));
  }
  else {
    replyNorms = this.forward.walk(['<fence>','<fence>'], keywords);
  }
  if( !replyNorms ) {
    return;
  }

  return replyNorms;
};


MegaHAL.prototype.rewrite = function(norms) {
  var words;

  for( var i = 0; i < 10; i++ ) {
    words = this.wordsFromNorms(norms);
    if(words) {
      break;
    }
  }

  // Couldn't make a string after 10 tries
  if( !words ) {
    return;
  }

  return this.addPunctuationToWords(words);
};

MegaHAL.prototype.addPunctuationToWords = function(words) {
  var context = ['<fence>', '<fence>'];
  var puncs = [];

  words.concat('<fence>').forEach(function(word) {
    context = [context[1],word];
    puncs.push(this.punc.pick(context));
  }.bind(this));

  return _.zip(puncs, words).reduce(function(string, mapping) {
    var punc = mapping[0];
    var word = mapping[1];

    if( typeof word === 'undefined') {
      return string + punc;
    }
    return string + punc + word;
  },'');
};

MegaHAL.prototype.wordsFromNorms = function(norms) {
  var context = ['<fence>', norms[0]];
  var words = [];
  var cased;

  for( var i = 0; i < norms.length; i++ ) {
    context = [
      i === 0 ? '<fence>' : words[i-1],
      norms[i]
    ];
    cased = this.originalCase.pick(context);

    // We can't figure out how to case this word, bail.
    if( !cased ) {
      return;
    }
    words.push(cased);
  }

  // We generated a final word we've never seen at the end before. Bail.
  if( typeof this.punc.pick([words[words.length -1], '<fence>']) === 'undefined') {
    return;
  }

  return words;
};

module.exports = MegaHAL;
