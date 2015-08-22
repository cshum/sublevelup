var sublevelup = require('../');
var test = require('tape');
var levelup = require('levelup');
var memdown = require('memdown');
var mydown = require('mydown');
var mysql  = require('mysql');

var db = levelup('db', {
  db: memdown,
  keyEncoding: 'utf8',
  valueEncoding: 'json' 
});

test('Default', function(t){
  var sublevel = sublevelup(db);

  t.equal(sublevelup(sublevel), sublevel, 'Passing sublevel return sublevel');

  var hello = sublevel('hello');
  var foo = sublevel(null, 'foo', { keyEncoding: 'binary' });
  var fooBar = foo.sublevel('bar', { keyEncoding: 'json' });
  var fooBarBla = sublevel(fooBar, 'bla');

  t.equal(foo.location, '!foo!', 'base sub');
  t.equal(hello.location, '!hello!', 'base sub');
  t.equal(fooBar.location, '!foo#bar!', 'nested sub');
  t.equal(fooBarBla.location, '!foo#bar#bla!', 'double nested sub');

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

  t.throws(
    function(){ sublevelup(); }, 
    { name: 'Error', message: 'Missing sublevel base.' },
    'sublevelup() no base throws'
  );
  t.throws(
    function(){ sublevel(db, 'name'); }, 
    { name: 'Error', message: 'LeveUP instance must be a Sublevel.' },
    'sublevel(db, name) non-sublevel db throws'
  );
  t.throws(
    function(){ sublevel(foo); }, 
    { name: 'Error', message: 'Sublevel must provide a name.' },
    'sublevel() without name throws'
  );

  t.end();
});

test('batch prefix', function(t){
  t.plan(3);
  var sublevel = sublevelup(levelup({ db:memdown }));

  var a = sublevel('a');
  var b = sublevel('b');
  var c = sublevel('c');

  a.batch([
    { type: 'put', key: 'foo', value: 'a' },
    { type: 'put', key: 'foo', value: 'b', prefix: b },
    { type: 'put', key: 'foo', value: 'c', prefix: '!c!' }
  ], function(){
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

test('Custom Prefix', function(t){
  var sublevel = sublevelup(db, {
    encode: function(prefix){
      return '!' + prefix.join('!!') + '!';
    },
    decode: function(location){
      return location.slice(1,-1).split('!!');
    }
  });

  var foo = sublevel('foo');
  var hello = sublevel(null, 'hello');
  var fooBar = sublevel(foo, 'bar');
  var fooBarBla = sublevel(fooBar, 'bla');

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
var my = mydown('mydown', {
  host: 'localhost',
  user: 'root'
});

test('Table based Sublevel', function(t){
  query('CREATE DATABASE IF NOT EXISTS mydown', function(){
    var sublevel = sublevelup(my);

    var foo = sublevel(null, 'foo');
    var hello = sublevel('hello');
    var fooBar = sublevel(foo, 'bar');
    var fooBarBla = fooBar.sublevel('bla');

    t.equal(foo.location, 'foo', 'base sub');
    t.equal(hello.location, 'hello', 'base sub');
    t.equal(fooBar.location, 'foo_bar', 'nested sub');
    t.equal(fooBarBla.location, 'foo_bar_bla', 'double nested sub');

    t.equal(foo.options.db, my, 'Correct DOWN');
    t.equal(hello.options.db, my, 'Correct DOWN');
    t.equal(fooBar.options.db, my, 'Correct DOWN');
    t.equal(fooBarBla.options.db, my, 'Correct DOWN');

    foo.close();
    hello.close();
    fooBar.close();
    fooBarBla.close();
    t.end();
  });
});
