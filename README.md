# SublevelUP

Separated sections of [LevelUP](https://github.com/Level/levelup).

[![Build Status](https://travis-ci.org/cshum/sublevelup.svg)](https://travis-ci.org/cshum/sublevelup)

```
npm install sublevelup
```

SublevelUP is built by extending [levelup](https://github.com/Level/levelup) with [prefixdown](https://github.com/cshum/prefixdown), which means full compatibility with official LevelUP interface. 
 
SublevelUP follows the same prefix encoding as [level-sublevel](https://github.com/dominictarr/level-sublevel). Also supports `.sublevel()` and `options.prefix`, which makes a drop-in replacement.

SublevelUP works with [level-transactions](https://github.com/cshum/level-transactions), featuring in-memory locking mechanisms and isolations across sublevels.

## API

Sublevel inherits methods of [LevelUP](https://github.com/Level/levelup#api) plus following:

#### `subdb = sublevel(db, [name], [options])`

#### `nested = subdb.sublevel(name, [options])`

`db` is a LevelUP or SublevelUP instance returns nested sublevel under `name`.

#### `options.prefix`
`batch()` is an atomic operation that works across sublevels, by setting the `prefix: subdb` property.
```js
var db = sublevel(levelup('./db'))
var a = db.sublevel('a')
var b = db.sublevel('b')

// batch from a
a.batch([
  { type: 'put', key: 'foo', value: 'a' },
  { type: 'put', key: 'foo', value: 'b', prefix: b }, //put into b
], function () {
  a.get('foo', function (err, val) { }) // val === 'a'
  b.get('foo', function (err, val) { }) // val === 'b'
})
```

#### `subdb.levelup()`

Returns its base LevelUP instance.

```js
var db = levelup('./db')
var subdb = sublevel(db)
var foo = subdb.sublevel('foo')
var fooBar = foo.sublevel('bar')

subdb.levelup() === db
foo.levelup() === db
fooBar.levelup() === db
```

## Encoding

SublevelUP encodes key prefix using `!` padding with `#` separator. That means *nested* sublevels are also *separated*.

Sublevel prefix can be accessed via LevelUP's `db.location` property.

```js
var level = require('level')
var sublevel = require('sublevelup')

//Key-prefix: passing LevelUP to Sublevel
var subdb = sublevel(level('./db'))

var hello = sublevel(subdb, 'hello')
var foo = db.sublevel('foo')
var fooBar = sublevel(foo, 'bar')
var fooBarBla = fooBar.sublevel('bla')

console.log(subdb.location) // !!
console.log(hello.location) // !hello!
console.log(foo.location) // !foo!
console.log(fooBar.location) // !foo#bar!
console.log(fooBarBla.location) // !foo#bar#bla!
```

#### `options.prefixEncoding`

It is possible to create custom codec for sublevel prefix or table name by passing `options.prefixEncoding` for encode/decode function,
such as [bytewise](https://github.com/deanlandolt/bytewise-core):

```js
var level = require('level')
var sublevel = require('sublevelup')

var bytewise = require('bytewise-core')
var codec = {
  encode: function (arr) {
    return bytewise.encode(arr).toString('binary')
  },
  decode: function (str) {
    return bytewise.decode(new Buffer(str, 'binary'))
  }
}

//Key-prefix Sublevel with custom codec
var db = sublevel(level('./db'), { prefixEncoding: codec })
```

## License

MIT
