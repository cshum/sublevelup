var sub = require('../');
var test = require('tape');
var levelup = require('levelup');
var memdown = require('memdown');

test('location', function(t){
  var db = levelup('root', { 
    db:memdown, 
    keyEncoding: 'utf8',
    valueEncoding: 'json' 
  });
  var dbA = sub(db, 'a', {keyEncoding: 'binary'});
  var dbAB = sub(dbA, 'b');
  var dbABC = sub(dbAB, 'c');
  t.equal(db.location, 'root', 'root levelup');
  t.equal(dbA.location, '!a!', 'sub of root');
  t.equal(dbAB.location, '!a#b!', 'sub of sub');
  t.equal(dbABC.location, '!a#b#c!', 'sub of sub of sub');
  t.equal(db.options.keyEncoding, 'utf8', 'option');
  t.equal(dbA.options.valueEncoding, 'json', 'inherit option');
  t.equal(dbA.options.keyEncoding, 'binary', 'extend option');
  t.end();
});
