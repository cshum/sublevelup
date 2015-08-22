# SublevelUP

Separated sections of LevelUP.

Inspired by the 
[many](https://github.com/dominictarr/level-sublevel) [sublevel](https://github.com/mafintosh/subleveldown) [modules](https://github.com/stagas/sublevel), 
SublevelUP aims to provide a unified [LevelUP](https://github.com/Level/levelup) sublevel interface for both 
[prefix-based](#prefix-based-sublevel) and 
[table-based](#table-based-sublevel) 
backends with [custom codec](#custom-codec) support.

[![Build Status](https://travis-ci.org/cshum/sublevelup.svg)](https://travis-ci.org/cshum/sublevelup)


```
npm install sublevelup
```

## Prefix-based sublevel

The "standard" way of creating sublevels.

Given the fact that LevelDB stores entries lexicographically sorted by keys,
it is possible to creating a "sandboxed" section using ranged key prefix.
Unlike separated LevelDB instances, atomic batched write works across sublevels, which is an important primitive for consistency.

SublevelUP uses [PrefixDOWN](https://github.com/cshum/prefixdown/) by default, which returns a prefixed backend by taking the base LevelUP instance. 

```js
var level = require('level');
var sublevel = require('sublevelup')(level('./db'));

var hello     = sublevel('hello'); //prefix !hello!
var foo       = sublevel('foo'); //prefix !foo!
var fooBar    = sublevel(foo, 'bar'); //prefix !foo#bar!
var fooBarBla = fooBar.sublevel('bla'); //prefix !foo#bar#bla!

```

## Table-based sublevel

The prefix approach, while a good fit for LevelDB, ill-suited for using SQL database as a LevelUP backend.
Concatenating every sublevels into one single table is not ideal for B-tree index that most SQL database uses.
There is also no reason not to utilise tables since they serve the exact same purpose. Hence the table-based sublevel.

Atomic batched write works across table-based sublevels, given most SQL databases support transactions across tables. 

[MyDOWN](https://github.com/cshum/mydown) for example, a MySQL backend that exposes a LevelDOWN compatible factory, where `levelup()` specifies table as location argument:

```js
var mydown = require('mydown');
var sublevel = require('sublevelup')(mydown('db', {
  host:     'localhost',
  user:     'root',
  password: 'secret'
}));

var hello     = sublevel('hello'); //table hello
var foo       = sublevel('foo'); //table foo
var fooBar    = sublevel(foo, 'bar'); //table foo_bar
var fooBarBla = fooBar.sublevel('bla'); //table foo_bar_bla

```

## Custom Codec

It is possible to create custom codec for sublevel prefix or table name. Simply pass the encode/decode function as follows:

```js
var level = require('level');
var sublevel = require('sublevelup')(level('./db'), {
  encode: function (prefix) {
    return '!' + prefix.join('!!') + '!';
  },
  decode: function (location) {
    return location.slice(1, -1).split('!!');
  }
});

var hello     = sublevel('hello'); //prefix !hello!
var foo       = sublevel('foo'); //prefix !foo!
var fooBar    = sublevel(foo, 'bar'); //prefix !foo!!bar!
var fooBarBla = fooBar.sublevel('bla'); //prefix !foo!!bar!!bla!

```

## API

### sublevel = require('sublevelup')(base, [codec])

Sublevel factory. `base` is a LevelUP instance for 
[prefix-based](#prefix-based-sublevel), LevelDOWN instance for 
[table-based](#table-based-sublevel).
Accepts [custom codec](#custom-codec).

### sub = sublevel([db], name, [options])

Returns a [LevelUP](https://github.com/Level/levelup) instance under sublevel `name`. Optional `db` for nesting sublevel.

### sub = db.sublevel(name, [options])

Nested sublevel under `name`.

## License

MIT
