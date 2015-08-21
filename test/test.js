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
  var sub = sublevelup(db);

  var hello = sub('hello');
  var foo = sub('foo', { keyEncoding: 'binary' });
  var fooBar = sub(foo, 'bar', { keyEncoding: 'json' });
  var fooBarBla = sub(fooBar, 'bla');

  t.equal(foo.location, '!foo!', 'base sub');
  t.equal(hello.location, '!hello!', 'base sub');
  t.equal(fooBar.location, '!foo#bar!', 'nested sub');
  t.equal(fooBarBla.location, '!foo#bar#bla!', 'double nested sub');

  t.equal(foo.toString(), 'LevelUP', 'LevelUP');
  t.equal(fooBar.toString(), 'LevelUP', 'LevelUP');

  t.equal(hello.options.valueEncoding, 'json', 'inherit options');
  t.equal(foo.options.valueEncoding, 'json', 'inherit options');
  t.equal(foo.options.keyEncoding, 'binary', 'extend options');
  t.equal(fooBar.options.keyEncoding, 'json', 'extend options');

  t.throws(
    function(){ sub(db, 'name'); }, 
    { name: 'Error', message: 'LeveUP instance must be a Sublevel.' },
    'sub(db, name) non-sublevel db throws'
  );
  t.throws(
    function(){ sub(foo); }, 
    { name: 'Error', message: 'Sublevel must provide a name.' },
    'sub() without name throws'
  );

  t.end();
});

test('Custom Prefix', function(t){
  var sub = sublevelup(db, {
    encode: function(prefix){
      return '!' + prefix.join('!!') + '!';
    },
    decode: function(location){
      return location.slice(1,-1).split('!!');
    }
  });

  var foo = sub('foo');
  var hello = sub('hello');
  var fooBar = sub(foo, 'bar');
  var fooBarBla = sub(fooBar, 'bla');

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
    var sub = sublevelup(my);

    var foo = sub('foo');
    var hello = sub('hello');
    var fooBar = sub(foo, 'bar');
    var fooBarBla = sub(fooBar, 'bla');

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
