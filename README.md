# SublevelUP

Separated sections of [LevelUP](https://github.com/Level/levelup).

SublevelUP models "sublevel" as a separated table sections, provides 
idiomatic mapping to both
[key prefix](#prefix-based-sublevel) sublevels and [table based](#table-based-sublevel) backends.
 
[![Build Status](https://travis-ci.org/cshum/sublevelup.svg)](https://travis-ci.org/cshum/sublevelup)

```
npm install sublevelup
```

## Prefix-based sublevel

The "standard" way of creating sublevels.

Given the fact that LevelDB stores entries lexicographically sorted by keys,
it is possible to creating a "sandboxed" section using ranged key prefix.
Unlike separated LevelDB instances, atomic batched write works across sublevels, which is an important primitive for consistency.

SublevelUP encodes key prefix using `!` padding with `#` separator. This means *nested* sublevels are also *separated*.

```js
var level = require('level')
var sublevel = require('sublevelup')

//Prefix-based: passing LevelUP to Sublevel
var db = sublevel(level('./db')) //prefix !!

var hello = sublevel(db, 'hello') //prefix !hello!
var foo = db.sublevel('foo') //prefix !foo!
var fooBar = sublevel(foo, 'bar') //prefix !foo#bar!
var fooBarBla = fooBar.sublevel('bla') //prefix !foo#bar#bla!

```

## Table-based sublevel

The prefix approach, while a good fit for LevelDB, ill-suited for using SQL database as a LevelUP backend.
Concatenating every sublevels into one single table is not ideal for B-tree index that most SQL database uses.
There is also no reason not to utilise tables since they serve the exact same purpose. 

SublevelUP provides idiomatic mapping to tables based [LevelDOWN](https://github.com/Level/abstract-leveldown) modules where `location` argument defines the table `DOWN(table)`.
Atomic batched write works across table-based sublevels, given most SQL databases support transactions across tables. 

Table prefix are encoded using `_` separator.

[MyDOWN](https://github.com/cshum/mydown) for example, a MySQL backend suits well as a table-based sublevel.

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

## Custom Encoding

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

//prefix-based Sublevel with custom codec
var db = sublevel(level('./db'), { prefixEncoding: codec })
```

## API

Sublevel inherits methods of [LevelUP](https://github.com/Level/levelup#api) plus following:

### sub = sublevel(db, [name], [options])

`db` is a 

* LevelUP instance for [prefix-based](#prefix-based-sublevel) sublevel
* LevelDOWN constructor for [table-based](#table-based-sublevel) sublevel
* Sublevel instance for nesting sublevel under `name`

### sub = db.sublevel(name, [options])

Nesting sublevel under `name`.

## License

MIT
