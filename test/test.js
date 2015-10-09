var sublevel = require('../')
var test = require('tape')
var levelup = require('levelup')
var levelSublevel = require('level-sublevel')
var memdown = require('memdown')
var mydown = require('mydown')
var mysql = require('mysql')
var bytewise = require('bytewise-core')

test('Sublevel default usage', function (t) {
  var roots = [
    levelup('db', {
      db: memdown,
      keyEncoding: 'utf8',
      valueEncoding: 'json'
    }),
    levelSublevel(
      levelup('db', {
        db: memdown,
        keyEncoding: 'utf8',
        valueEncoding: 'json'
      })
    ).sublevel('whatever')
  ]
  roots.forEach(function (root) {
    var db = sublevel(root)

    var hello = sublevel(db, 'hello')
    var foo = db.sublevel('foo', { keyEncoding: 'binary' })
    var fooBar = foo.sublevel('bar', { keyEncoding: 'json' })
    var fooBarBla = sublevel(fooBar, 'bla')

    t.equal(db.prefix, '!!', 'base')
    t.equal(foo.prefix, '!foo!', 'base sub')
    t.equal(hello.prefix, '!hello!', 'base sub')
    t.equal(fooBar.prefix, '!foo#bar!', 'nested sub')
    t.equal(fooBarBla.prefix, '!foo#bar#bla!', 'double nested sub')

    t.equal(hello, sublevel(db, 'hello'), 'reuse sublevel object')
    t.equal(fooBarBla, sublevel(fooBar, 'bla'), 'reuse sublevel object')
    t.equal(fooBarBla, fooBar.sublevel('bla'), 'reuse sublevel object')

    t.equal(foo.toString(), 'LevelUP', 'LevelUP')
    t.equal(fooBar.toString(), 'LevelUP', 'LevelUP')
    t.ok(foo instanceof levelup, 'LevelUP')
    t.ok(fooBar instanceof levelup, 'LevelUP')

    t.equal(hello.options.valueEncoding, 'json', 'inherit options')
    t.equal(foo.options.valueEncoding, 'json', 'inherit options')
    t.equal(foo.options.keyEncoding, 'binary', 'extend options')
    t.equal(fooBar.options.keyEncoding, 'json', 'extend options')

    t.equal(sublevel(db), db, 'up sublevel return sublevel')
    t.equal(sublevel(hello), hello, 'up sublevel return sublevel')

    var helloPrefix = hello.prefix
    var hello2 = sublevel(hello, { valueEncoding: 'binary' })

    t.notOk(hello2 === hello, 'up sublevel with options return new sublevel')
    t.equal(hello.options.valueEncoding, 'json', 'orig sublevel retain options')
    t.equal(hello2.options.valueEncoding, 'binary', 'up sublevel extend options')
    t.equal(hello.prefix, helloPrefix, 'orig sublevel retain prefix')
    t.equal(hello2.prefix, helloPrefix, 'up sublevel retain prefix')
  })

  t.throws(function () { sublevel() }, {
    name: 'Error', message: 'Missing sublevel base.'
  }, 'sublevel() no base throws')

  t.end()
})

function batchPrefix (t, db) {
  t.plan(8)
  var a = db.sublevel('a')
  var ab = a.sublevel('b')
  var abc = ab.sublevel('c')

  a.batch([
    { type: 'put', key: 'foo', value: '_', prefix: db },
    { type: 'put', key: 'foo', value: 'a' },
    { type: 'put', key: 'foo', value: 'ab', prefix: ab },
    { type: 'put', key: 'foo', value: 'abc', prefix: abc }
  ], function () {
    db.get('foo', function (err, val) {
      t.notOk(err)
      t.equal(val, '_', 'base')
      db.close()
    })
    a.get('foo', function (err, val) {
      t.notOk(err)
      t.equal(val, 'a', 'sublevel prefix')
      a.close()
    })
    ab.get('foo', function (err, val) {
      t.notOk(err)
      t.equal(val, 'ab', 'sublevel prefix')
      ab.close()
    })
    abc.get('foo', function (err, val) {
      t.notOk(err)
      t.equal(val, 'abc', 'sublevel prefix')
      abc.close()
    })
  })
}

test('batch prefix', function (t) {
  batchPrefix(t, sublevel(levelup('db', { db: memdown })))
})

test('level-sublevel batch prefix', function (t) {
  batchPrefix(t, sublevel(
    levelSublevel(levelup('db', { db: memdown })).sublevel('whatever')
  ))
})

var codec = {
  encode: function (arr) {
    return bytewise.encode(arr).toString('binary')
  },
  decode: function (str) {
    return bytewise.decode(new Buffer(str, 'binary'))
  }
}

test('Sublevel base with name', function (t) {
  var db = sublevel(levelup('this-is-not-sublevel', { db: memdown }), 'root')
  var foo = sublevel(db, 'foo')
  var hello = sublevel(db, 'hello')
  var fooBar = sublevel(foo, 'bar')
  var fooBarBla = fooBar.sublevel('bla')

  t.equal(db.prefix, '!root!', 'base')
  t.equal(foo.prefix, '!root#foo!', 'base sub')
  t.equal(hello.prefix, '!root#hello!', 'base sub')
  t.equal(fooBar.prefix, '!root#foo#bar!', 'nested sub')
  t.equal(fooBarBla.prefix, '!root#foo#bar#bla!', 'double nested sub')

  t.end()
})
test('Custom Prefix', function (t) {
  var db = sublevel(levelup('db', { db: memdown }), { prefixEncoding: codec })
  var foo = sublevel(db, 'foo')

  t.equal(db.prefix, ' \x00', 'base')
  t.equal(foo.prefix, ' pfoo\x00\x00', 'base sub')

  t.end()
})
test('Custom Prefix 2', function (t) {
  var db = sublevel(levelup('db', { db: memdown, prefixEncoding: codec }))
  var foo = sublevel(db, 'foo')

  t.equal(db.prefix, ' \x00', 'base')
  t.equal(foo.prefix, ' pfoo\x00\x00', 'base sub')

  t.end()
})

function query (sql, cb) {
  var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    multipleStatements: true
  })
  connection.connect()
  connection.query(sql, cb)
  connection.end()
}

var my

test('Table based Sublevel', function (t) {
  query('CREATE DATABASE IF NOT EXISTS mydown', function () {
    my = mydown('mydown', {
      host: 'localhost',
      user: 'root'
    })
    var db = sublevel(my)
    var foo = sublevel(db, 'foo')
    var hello = sublevel(db, 'hello')
    var fooBar = sublevel(foo, 'bar')
    var fooBarBla = fooBar.sublevel('bla')

    t.equal(db.prefix, '_', 'base')
    t.equal(foo.prefix, 'foo', 'base sub')
    t.equal(hello.prefix, 'hello', 'base sub')
    t.equal(fooBar.prefix, 'foo_bar', 'nested sub')
    t.equal(fooBarBla.prefix, 'foo_bar_bla', 'double nested sub')

    t.equal(db.options.db, my, 'Correct DOWN')
    t.equal(foo.options.db, my, 'Correct DOWN')
    t.equal(hello.options.db, my, 'Correct DOWN')
    t.equal(fooBar.options.db, my, 'Correct DOWN')
    t.equal(fooBarBla.options.db, my, 'Correct DOWN')

    db.close()
    foo.close()
    hello.close()
    fooBar.close()
    fooBarBla.close()
    t.end()
  })
})

test('Table sublevel base with name', function (t) {
  var db = sublevel(my, 'root')

  var foo = db.sublevel('foo')
  var hello = db.sublevel('hello')
  var fooBar = foo.sublevel('bar')
  var fooBarBla = fooBar.sublevel('bla')

  t.equal(db.prefix, 'root', 'base')
  t.equal(foo.prefix, 'root_foo', 'base sub')
  t.equal(hello.prefix, 'root_hello', 'base sub')
  t.equal(fooBar.prefix, 'root_foo_bar', 'nested sub')
  t.equal(fooBarBla.prefix, 'root_foo_bar_bla', 'double nested sub')

  db.close()
  foo.close()
  hello.close()
  fooBar.close()
  fooBarBla.close()
  t.end()
})

test('table batch prefix', function (t) {
  batchPrefix(t, sublevel(my))
})
