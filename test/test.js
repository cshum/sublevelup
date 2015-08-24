var sublevel = require('../');
var test = require('tape');
var levelup = require('levelup');
var memdown = require('memdown');
var mydown = require('mydown');
var mysql  = require('mysql');

test('Default', function(t){
  var db = sublevel(levelup('db', {
    db: memdown,
    keyEncoding: 'utf8',
    valueEncoding: 'json' 
  }));

  var hello = sublevel(db, 'hello');
  var foo = db.sublevel('foo', { keyEncoding: 'binary' });
  var fooBar = foo.sublevel('bar', { keyEncoding: 'json' });
  var fooBarBla = sublevel(fooBar, 'bla');

  t.equal(sublevel(db), db, 'up sublevel return sublevel');
  t.equal(sublevel(hello), hello, 'up sublevel return sublevel');

  t.equal(db.prefix, '!!', 'base');
  t.equal(foo.prefix, '!foo!', 'base sub');
  t.equal(hello.prefix, '!hello!', 'base sub');
  t.equal(fooBar.prefix, '!foo#bar!', 'nested sub');
  t.equal(fooBarBla.prefix, '!foo#bar#bla!', 'double nested sub');

  t.equal(hello, sublevel(db, 'hello'), 'reuse sublevel object');
  t.equal(fooBarBla, sublevel(fooBar, 'bla'), 'reuse sublevel object');
  t.equal(fooBarBla, fooBar.sublevel('bla'), 'reuse sublevel object');

  t.equal(foo.toString(), 'LevelUP', 'LevelUP');
  t.equal(fooBar.toString(), 'LevelUP', 'LevelUP');
  t.ok(foo instanceof levelup, 'LevelUP');
  t.ok(fooBar instanceof levelup, 'LevelUP');

  t.equal(hello.options.valueEncoding, 'json', 'inherit options');
  t.equal(foo.options.valueEncoding, 'json', 'inherit options');
  t.equal(foo.options.keyEncoding, 'binary', 'extend options');
  t.equal(fooBar.options.keyEncoding, 'json', 'extend options');

  t.throws(function(){ sublevel(); }, {
    name: 'Error', message: 'Missing sublevel base.' 
  }, 'sublevel() no base throws');

  t.end();
});

function batchPrefix(t, db){
  t.plan(4);
  var a = db.sublevel('a');
  var ab = a.sublevel('b');
  var abc = ab.sublevel('c');

  a.batch([
    { type: 'put', key: 'foo', value: '_', prefix: db },
    { type: 'put', key: 'foo', value: 'a' },
    { type: 'put', key: 'foo', value: 'ab', prefix: ab },
    { type: 'put', key: 'foo', value: 'abc', prefix: abc }
  ], function(){
    db.get('foo', function(err, val){
      t.equal(val, '_', 'base');
      db.close();
    });
    a.get('foo', function(err, val){
      t.equal(val, 'a', 'sublevel prefix');
      a.close();
    });
    ab.get('foo', function(err, val){
      t.equal(val, 'ab', 'sublevel prefix');
      ab.close();
    });
    abc.get('foo', function(err, val){
      t.equal(val, 'abc', 'sublevel prefix');
      abc.close();
    });
  });
}

test('batch prefix', function(t){
  batchPrefix(t, sublevel(levelup('db', { db:memdown })));
});

var codec = {
  encode: function (arr) {
    return '!' + arr.join('!!') + '!';
  },
  decode: function (str) {
    return str === '!!' ? [] : str.slice(1, -1).split('!!');
  }
};

test('Sublevel base with name', function(t){
  var db = sublevel(levelup('this-is-not-sublevel', { db: memdown }), 'root');
  var foo = sublevel(db, 'foo');
  var hello = sublevel(db, 'hello');
  var fooBar = sublevel(foo, 'bar');
  var fooBarBla = fooBar.sublevel('bla');

  t.equal(db.prefix, '!root!', 'base');
  t.equal(foo.prefix, '!root#foo!', 'base sub');
  t.equal(hello.prefix, '!root#hello!', 'base sub');
  t.equal(fooBar.prefix, '!root#foo#bar!', 'nested sub');
  t.equal(fooBarBla.prefix, '!root#foo#bar#bla!', 'double nested sub');

  t.end();
});
test('Custom Prefix', function(t){
  var db = sublevel(levelup('db', { db: memdown }), { prefixEncoding: codec });
  var foo = sublevel(db, 'foo');
  var hello = sublevel(db, 'hello');
  var fooBar = sublevel(foo, 'bar');
  var fooBarBla = fooBar.sublevel('bla');

  t.equal(db.prefix, '!!', 'base');
  t.equal(foo.prefix, '!foo!', 'base sub');
  t.equal(hello.prefix, '!hello!', 'base sub');
  t.equal(fooBar.prefix, '!foo!!bar!', 'nested sub');
  t.equal(fooBarBla.prefix, '!foo!!bar!!bla!', 'double nested sub');

  t.end();
});
test('Custom Prefix 2', function(t){
  var db = sublevel(levelup('db', { db: memdown, prefixEncoding: codec }));
  var foo = sublevel(db, 'foo');
  var hello = sublevel(db, 'hello');
  var fooBar = sublevel(foo, 'bar');
  var fooBarBla = fooBar.sublevel('bla');

  t.equal(db.prefix, '!!', 'base');
  t.equal(foo.prefix, '!foo!', 'base sub');
  t.equal(hello.prefix, '!hello!', 'base sub');
  t.equal(fooBar.prefix, '!foo!!bar!', 'nested sub');
  t.equal(fooBarBla.prefix, '!foo!!bar!!bla!', 'double nested sub');

  t.end();
});

function query(sql, cb){
  var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    multipleStatements: true
  });
  connection.connect();
  connection.query(sql, cb);
  connection.end();
}
query('CREATE DATABASE IF NOT EXISTS mydown', function(){
  var my = mydown('mydown', {
    host: 'localhost',
    user: 'root'
  });
  test('Table based Sublevel', function(t){
    var db = sublevel(my);
    var foo = sublevel(db, 'foo');
    var hello = sublevel(db, 'hello');
    var fooBar = sublevel(foo, 'bar');
    var fooBarBla = fooBar.sublevel('bla');

    t.equal(db.prefix, '_', 'base');
    t.equal(foo.prefix, 'foo', 'base sub');
    t.equal(hello.prefix, 'hello', 'base sub');
    t.equal(fooBar.prefix, 'foo_bar', 'nested sub');
    t.equal(fooBarBla.prefix, 'foo_bar_bla', 'double nested sub');

    t.equal(db.options.db, my, 'Correct DOWN');
    t.equal(foo.options.db, my, 'Correct DOWN');
    t.equal(hello.options.db, my, 'Correct DOWN');
    t.equal(fooBar.options.db, my, 'Correct DOWN');
    t.equal(fooBarBla.options.db, my, 'Correct DOWN');

    db.close();
    foo.close();
    hello.close();
    fooBar.close();
    fooBarBla.close();
    t.end();
  });
  test('table batch prefix', function(t){
    batchPrefix(t, sublevel(my));
  });
});
