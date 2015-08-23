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

  t.equal(db.location, '!!', 'base');
  t.equal(foo.location, '!foo!', 'base sub');
  t.equal(hello.location, '!hello!', 'base sub');
  t.equal(fooBar.location, '!foo#bar!', 'nested sub');
  t.equal(fooBarBla.location, '!foo#bar#bla!', 'double nested sub');

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

test('batch prefix', function(t){
  t.plan(4);
  var db = sublevel(levelup('db', { db:memdown }));
  var a = sublevel(db, 'a');
  var b = sublevel(db, 'b');
  var c = sublevel(db, 'c');

  a.batch([
    { type: 'put', key: 'foo', value: '_', prefix: db },
    { type: 'put', key: 'foo', value: 'a' },
    { type: 'put', key: 'foo', value: 'b', prefix: b },
    { type: 'put', key: 'foo', value: 'c', prefix: '!c!' }
  ], function(){
    db.get('foo', function(err, val){
      t.equal(val, '_', 'base');
    });
    a.get('foo', function(err, val){
      t.equal(val, 'a', 'default prefix');
    });
    b.get('foo', function(err, val){
      t.equal(val, 'b', 'levelup prefixdown prefix');
    });
    c.get('foo', function(err, val){
      t.equal(val, 'c', 'string prefix');
    });
  });

});

var codec = {
  encode: function (arr) {
    return '!' + arr.join('!!') + '!';
  },
  decode: function (str) {
    return str === '!!' ? [] : str.slice(1, -1).split('!!');
  }
};

test('Custom Prefix', function(t){
  var db = sublevel(levelup('db', { db: memdown }), { prefixEncoding: codec });
  var foo = sublevel(db, 'foo');
  var hello = sublevel(db, 'hello');
  var fooBar = sublevel(foo, 'bar');
  var fooBarBla = fooBar.sublevel('bla');

  t.equal(db.location, '!!', 'base');
  t.equal(foo.location, '!foo!', 'base sub');
  t.equal(hello.location, '!hello!', 'base sub');
  t.equal(fooBar.location, '!foo!!bar!', 'nested sub');
  t.equal(fooBarBla.location, '!foo!!bar!!bla!', 'double nested sub');

  t.end();
});
test('Custom Prefix 2', function(t){
  var db = sublevel(levelup('db', { db: memdown, prefixEncoding: codec }));
  var foo = sublevel(db, 'foo');
  var hello = sublevel(db, 'hello');
  var fooBar = sublevel(foo, 'bar');
  var fooBarBla = fooBar.sublevel('bla');

  t.equal(db.location, '!!', 'base');
  t.equal(foo.location, '!foo!', 'base sub');
  t.equal(hello.location, '!hello!', 'base sub');
  t.equal(fooBar.location, '!foo!!bar!', 'nested sub');
  t.equal(fooBarBla.location, '!foo!!bar!!bla!', 'double nested sub');

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
test('Table based Sublevel', function(t){
  query('CREATE DATABASE IF NOT EXISTS mydown', function(){
    var my = mydown('mydown', {
      host: 'localhost',
      user: 'root'
    });
    var db = sublevel(my);
    var foo = sublevel(db, 'foo');
    var hello = sublevel(db, 'hello');
    var fooBar = sublevel(foo, 'bar');
    var fooBarBla = fooBar.sublevel('bla');

    t.equal(db.location, '_', 'base');
    t.equal(foo.location, 'foo', 'base sub');
    t.equal(hello.location, 'hello', 'base sub');
    t.equal(fooBar.location, 'foo_bar', 'nested sub');
    t.equal(fooBarBla.location, 'foo_bar_bla', 'double nested sub');

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
});
