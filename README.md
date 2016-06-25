# SublevelUP

Separated sections of [LevelUP](https://github.com/Level/levelup).

SublevelUP models "sublevel" as separated table sections, providing
idiomatic mapping to both
[key prefix](#key-prefix-sublevel) sublevels and [table based](#table-based-sublevel) backends.

SublevelUP is a "subclass" of LevelUP, which means full compatibility with latest LevelUP interface. 
 
[![Build Status](https://travis-ci.org/cshum/sublevelup.svg)](https://travis-ci.org/cshum/sublevelup)

```
npm install sublevelup
```

## API

Sublevel inherits methods of [LevelUP](https://github.com/Level/levelup#api) plus following:

### `sub = sublevel(db, [name], [options])`

`db` is a 

* LevelUP instance for [key-prefix](#key-prefix-sublevel) sublevel
* LevelDOWN constructor for [table-based](#table-based-sublevel) sublevel
* Sublevel instance for nesting sublevel under `name`

### `sub = db.sublevel(name, [options])`

Nesting sublevel under `name`.

### Batch prefix
`batch()` is a transactional operation that works across sublevels, by setting the `prefix: sub` property.
```js
var db = sublevel(mydown)
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

## Encoding

### Key-prefix sublevel

Given the fact that LevelDB stores entries lexicographically sorted by keys,
it is possible to creating a "sandboxed" section using ranged key prefix.
Unlike separated LevelDB instances, atomic batched write works across sublevels, which is an important primitive for consistency.

SublevelUP encodes key prefix using `!` padding with `#` separator. That means *nested* sublevels are also *separated*.

```js
var level = require('level')
var sublevel = require('sublevelup')

//Key-prefix: passing LevelUP to Sublevel
var db = sublevel(level('./db')) //prefix !!

var hello = sublevel(db, 'hello') //prefix !hello!
var foo = db.sublevel('foo') //prefix !foo!
var fooBar = sublevel(foo, 'bar') //prefix !foo#bar!
var fooBarBla = fooBar.sublevel('bla') //prefix !foo#bar#bla!

```

### Table-based sublevel

SublevelUP also provides idiomatic mapping to tables based [LevelDOWN](https://github.com/Level/abstract-leveldown) modules where `location` argument defines the table `DOWN(table)`.
Atomic batched write works across table-based sublevels, given most SQL databases support transactions across tables. 

By default, table prefix are encoded using `_` separator.

```js
var sublevel = require('sublevelup')
var mydown = require('mydown')('db', {
  host: 'localhost',
  user: 'root',
  password: 'secret'
})

//Table-based: passing LevelDOWN to Sublevel
var db = sublevel(mydown) //table _

var hello = sublevel(db, 'hello') //table hello
var foo = db.sublevel('foo') //table foo
var fooBar = sublevel(foo, 'bar') //table foo_bar
var fooBarBla = fooBar.sublevel('bla') //table foo_bar_bla

```

### Custom encoding

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
### Custom encoding

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
