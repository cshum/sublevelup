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
  var dbA = sub(db, 'a', { keyEncoding: 'binary' });
  var dbAB = sub(dbA, 'b');
  var dbABC = sub(dbAB, 'c');
  var dbB = sub(db, 'b');
  t.equal(db.location, 'root', 'root levelup');
  t.equal(dbA.location, '!a!', 'sub of root');
  t.equal(dbB.location, '!b!', 'sub of root');
  t.equal(dbAB.location, '!a#b!', 'sub of sub');
  t.equal(dbABC.location, '!a#b#c!', 'sub of sub of sub');
  t.equal(db.options.keyEncoding, 'utf8', 'option');
  t.equal(dbA.options.valueEncoding, 'json', 'inherit option');
  t.equal(dbA.options.keyEncoding, 'binary', 'extend option');
  t.end();
});

return;

test('Default', function(t){
  var sub = sublevelup(db);

  var foo = sub('foo');
  var hello = sub('hello');
  var fooBar = sub(foo, 'bar');
  var fooBarBla = sub(fooBar, 'bla');

  t.equal(foo.location, '!foo!', 'base sub');
  t.equal(hello.location, '!hello!', 'base sub');
  t.equal(fooBar.location, '!foo#bar!', 'nested sub');
  t.equal(fooBarBla.location, '!foo#bar#bla!', 'double nested sub');
});

test('Custom Prefix', function(t){
  var sub = sublevelup(db, function(prefix){
    return prefix.map(function(name){
      return '!'+name+'!';
    }).join();
  });

  var foo = sub('foo');
  var hello = sub('hello');
  var fooBar = sub(foo, 'bar');
  var fooBarBla = sub(fooBar, 'bla');

  t.equal(foo.location, '!foo!', 'base sub');
  t.equal(hello.location, '!hello!', 'base sub');
  t.equal(fooBar.location, '!foo!!bar!', 'nested sub');
  t.equal(fooBarBla.location, '!foo!!bar!!bla!', 'double nested sub');
});


test('LevelDOWN', function(t){
  var sub = sublevelup(my('db', {
    host: 'localhost',
    user: 'root'
  }), function(prefix){
    return prefix.join('_');
  });

  var foo = sub('foo');
  var hello = sub('hello');
  var fooBar = sub(foo, 'bar');
  var fooBarBla = sub(fooBar, 'bla');

  t.equal(foo.location, 'foo', 'base sub');
  t.equal(hello.location, 'hello', 'base sub');
  t.equal(fooBar.location, 'foo_bar', 'nested sub');
  t.equal(fooBarBla.location, 'foo_bar_bla', 'double nested sub');
});
