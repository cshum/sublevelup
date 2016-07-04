# SublevelUP

Separated sections of [LevelUP](https://github.com/Level/levelup).

SublevelUP is a "subclass" of LevelUP, which means full compatibility with official LevelUP interface. 
 
[![Build Status](https://travis-ci.org/cshum/sublevelup.svg)](https://travis-ci.org/cshum/sublevelup)

```
npm install sublevelup
```

## API

Sublevel inherits methods of [LevelUP](https://github.com/Level/levelup#api) plus following:

#### `sub = sublevel(db, [name], [options])`

`db` is a LevelUP or SublevelUP instance returns nested sublevel under `name`.

#### `sub = db.sublevel(name, [options])`

Nesting sublevel under `name`.

#### `options.prefix`
`batch()` is a transactional operation that works across sublevels, by setting the `prefix: sub` property.
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

#### `sub.levelup()`

Returns its base LevelUP instance.

```js
var base = levelup('./db')
var sub = sublevel(base)
var foo = sub.sublevel('foo')
var fooBar = foo.sublevel('bar')

sub.levelup() === base
foo.levelup() === base
fooBar.levelup() === base
```

## Encoding

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
