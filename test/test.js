var sublevel = require('../')
var test = require('tape')
var levelup = require('levelup')
var levelSublevel = require('level-sublevel')
var memdown = require('memdown')
var bytewise = require('bytewise-core')

test('Sublevel default usage', function (t) {
  var db = levelup('db', {
    db: memdown,
    keyEncoding: 'utf8',
    valueEncoding: 'json'
  })
  var roots = [db, levelSublevel(db).sublevel('whatever')]

  roots.forEach(function (root) {
    var db = sublevel(root)

    var hello = sublevel(db, 'hello')
    var foo = db.sublevel('foo', { keyEncoding: 'binary' })
    var fooBar = foo.sublevel('bar', { keyEncoding: 'json' })
    var fooBarBla = sublevel(fooBar, 'bla')

    t.equal(db.levelup(), root, 'base levelup() ref')
    t.equal(foo.levelup(), root, 'base sub levelup() ref')
    t.equal(hello.levelup(), root, 'base sub levelup() ref')
    t.equal(fooBar.levelup(), root, 'nested levelup() ref')
    t.equal(fooBarBla.levelup(), root, 'double nested levelup() ref')

    t.equal(db.location, '!!', 'base')
    t.equal(foo.location, '!foo!', 'base sub')
    t.equal(hello.location, '!hello!', 'base sub')
    t.equal(fooBar.location, '!foo#bar!', 'nested sub')
    t.equal(fooBarBla.location, '!foo#bar#bla!', 'double nested sub')

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

    var helloPrefix = hello.location
    var hello2 = sublevel(hello, { valueEncoding: 'binary' })

    t.notOk(hello2 === hello, 'up sublevel with options return new sublevel')
    t.equal(hello.options.valueEncoding, 'json', 'orig sublevel retain options')
    t.equal(hello2.options.valueEncoding, 'binary', 'up sublevel extend options')
    t.equal(hello.location, helloPrefix, 'orig sublevel retain prefix')
    t.equal(hello2.location, helloPrefix, 'up sublevel retain prefix')
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

  t.equal(db.location, '!root!', 'base')
  t.equal(foo.location, '!root#foo!', 'base sub')
  t.equal(hello.location, '!root#hello!', 'base sub')
  t.equal(fooBar.location, '!root#foo#bar!', 'nested sub')
  t.equal(fooBarBla.location, '!root#foo#bar#bla!', 'double nested sub')

  t.end()
})
test('Custom Prefix', function (t) {
  var db = sublevel(levelup('db', { db: memdown }), { prefixEncoding: codec })
  var foo = sublevel(db, 'foo')

  t.equal(db.location, ' \x00', 'base')
  t.equal(foo.location, ' pfoo\x00\x00', 'base sub')

  t.end()
})
test('Custom Prefix 2', function (t) {
  var db = sublevel(levelup('db', { db: memdown, prefixEncoding: codec }))
  var foo = sublevel(db, 'foo')

  t.equal(db.location, ' \x00', 'base')
  t.equal(foo.location, ' pfoo\x00\x00', 'base sub')

  t.end()
})
