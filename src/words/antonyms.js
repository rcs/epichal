var pairs = [
  ["DISLIKE", "LIKE"],
  ["HATE", "LOVE"],
  ["I", "YOU"],
  ["I'D", "YOU'D"],
  ["I'LL", "YOU'LL"],
  ["I'M", "YOU'RE"],
  ["I'VE", "YOU'VE"],
  ["LIKE", "DISLIKE"],
  ["LOVE", "HATE"],
  ["ME", "YOU"],
  ["MINE", "YOURS"],
  ["MY", "YOUR"],
  ["MYSELF", "YOURSELF"],
  ["NO", "YES"],
  ["WHY", "BECAUSE"],
  ["YES", "NO"],
  ["YOU", "I"],
  ["YOU", "ME"],
  ["YOU'D", "I'D"],
  ["YOU'LL", "I'LL"],
  ["YOU'RE", "I'M"],
  ["YOU'VE", "I'VE"],
  ["YOUR", "MY"],
  ["YOURS", "MINE"],
  ["YOURSELF", "MYSELF"],
  ["HOLMES", "WATSON"],
  ["FRIEND", "ENEMY"],
  ["ALIVE", "DEAD"],
  ["LIFE", "DEATH"],
  ["QUESTION", "ANSWER"],
  ["BLACK", "WHITE"],
  ["COLD", "HOT"],
  ["HAPPY", "SAD"],
  ["FALSE", "TRUE"],
  ["HEAVEN", "HELL"],
  ["GOD", "DEVIL"],
  ["NOISY", "QUIET"],
  ["WAR", "PEACE"],
  ["SORRY", "APOLOGY"]
];

var swap = {};

pairs.forEach(function(pair) {
  var a = pair[0];
  var b = pair[1];

  swap[a] = b;
  swap[b] = a;
});

module.exports = swap;
