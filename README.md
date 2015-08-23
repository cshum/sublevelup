# SublevelUP

Separated sections of LevelUP.

Inspired by the 
[many](https://github.com/dominictarr/level-sublevel) [sublevel](https://github.com/mafintosh/subleveldown) [modules](https://github.com/stagas/sublevel), 
SublevelUP aims to provide a unified [LevelUP](https://github.com/Level/levelup) sublevel interface for both 
[prefix-based](#prefix-based-sublevel) and 
[table-based](#table-based-sublevel) 
backends with [custom encoding](#custom-encoding) support.

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
var sublevel = require('sublevelup');

//prefix-based: passing LevelUP to Sublevel
var db = sublevel(level('./db')); //prefix !!

var hello = sublevel(db, 'hello'); //prefix !hello!
var foo = db.sublevel('foo'); //prefix !foo!
var fooBar = sublevel(foo, 'bar'); //prefix !foo#bar!
var fooBarBla = fooBar.sublevel('bla'); //prefix !foo#bar#bla!

```

## Table-based sublevel

The prefix approach, while a good fit for LevelDB, ill-suited for using SQL database as a LevelUP backend.
Concatenating every sublevels into one single table is not ideal for B-tree index that most SQL database uses.
There is also no reason not to utilise tables since they serve the exact same purpose. Hence the table-based sublevel.

Atomic batched write works across table-based sublevels, given most SQL databases support transactions across tables. 

[MyDOWN](https://github.com/cshum/mydown) for example, a MySQL backend that exposes a LevelDOWN compatible factory, where `levelup()` specifies table as location argument:

```js
var sublevel = require('sublevelup');
var mydown = require('mydown')('db', {
  host: 'localhost',
  user: 'root',
  password: 'secret'
});

//table-based: passing LevelDOWN to Sublevel
var db = sublevel(mydown); //table _

var hello = sublevel(db, 'hello'); //table hello
var foo = db.sublevel('foo'); //table foo
var fooBar = sublevel(foo, 'bar'); //table foo_bar
var fooBarBla = fooBar.sublevel('bla'); //table foo_bar_bla

```

## Custom Encoding

It is possible to create custom codec for sublevel prefix or table name by passing `options.prefixEncoding` for encode/decode function:

```js
var level = require('level');
var sublevel = require('sublevelup');

var codec = {
  encode: function (arr) {
    return '!' + arr.join('!!') + '!';
  },
  decode: function (str) {
    return str === '!!' ? [] : str.slice(1, -1).split('!!');
  }
};

//prefix-based Sublevel with custom codec
var db = sublevel(level('./db'), { prefixEncoding: codec }); //prefix !!

var hello = sublevel(db, 'hello'); //prefix !hello!
var foo = db.sublevel('foo'); //prefix !foo!
var fooBar = sublevel(foo, 'bar'); //prefix !foo!!bar!
var fooBarBla = fooBar.sublevel('bla'); //prefix !foo!!bar!!bla!

```

## API

### sub = sublevel(db, [name], [options])

`db` is a 

* LevelUP instance for [prefix-based](#prefix-based-sublevel) Sublevel
* LevelDOWN instance for [table-based](#table-based-sublevel) Sublevel
* Sublevel instance for nesting Sublevel under `name`

### sub = db.sublevel(name, [options])

Nesting Sublevel under `name`.

## License

MIT
