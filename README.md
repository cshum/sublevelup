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
it is possible to creating a “sandboxed” section using ranged key prefix for accessing database.
This enables a modular, hierarchical structure for creating sections in LevelDB. 
Unlike separated LevelDB instances, atomic batched write works across sublevels, which is an important primitive for consistency.

SublevelUP uses [PrefixDOWN](https://github.com/cshum/prefixdown/) by default, which returns a prefixed backend by taking the base LevelUP instance. 

```js
var level = require('level');
var sublevelup = require('sublevelup');

var sub = sublevelup(level('./db'));

var hello     = sub('hello'); //prefix !hello!
var foo       = sub('foo'); //prefix !foo!
var fooBar    = sub(foo, 'bar'); //prefix !foo#bar!
var fooBarBla = sub(fooBar, 'bla'); //prefix !foo#bar#bla!

```

## Table-based sublevel

The prefix approach, while its a good fit for LevelDB, ill-suited for using SQL database as a LevelUP backend.
Concatenating every sublevels into one single index is not ideal for B-tree index that most SQL database uses.
It is also silly given SQL database has already got tables for such purpose, hence the table-based sublevel.

Atomic batched write works across table-based sublevels, given most SQL databases support transactions across tables. 

[MyDOWN](https://github.com/cshum/mydown) for example, a MySQL backend that exposes a LevelDOWN compatible factory, where levelup() specifies table as location argument:

```js
var mydown = require('mydown');

var sub = sublevelup(mydown('db', {
  host:     'localhost',
  user:     'root',
  password: 'secret'
}));

var hello     = sub('hello'); //table hello
var foo       = sub('foo'); //table foo
var fooBar    = sub(foo, 'bar'); //table foo_bar
var fooBarBla = sub(fooBar, 'bla'); //table foo_bar_bla

```

## Custom Codec

It is possible to create custom codec for sublevel prefix or table name. Simply pass the encode/decode function as follows:

```js
var level = require('level');
var sublevelup = require('sublevelup');

var sub = sublevelup(level('./db'), {
  encode: function(prefix){
    return '!' + prefix.join('!!') + '!';
  },
  decode: function(location){
    return location.slice(1,-1).split('!!');
  }
});

var hello     = sub('hello'); //prefix !hello!
var foo       = sub('foo'); //prefix !foo!
var fooBar    = sub(foo, 'bar'); //prefix !foo!!bar!
var fooBarBla = sub(fooBar, 'bla'); //prefix !foo!!bar!!bla!

```

## API

### sub = require('sublevelup')(base, [codec])

Sublevel factory. `base` is a LevelUP instance for 
[prefix-based](#prefix-based-sublevel), LevelDOWN instance for 
[table-based](#table-based-sublevel).
Accepts [custom codec](#custom-codec).

### db = sub([db], name, [options])

Returns a [LevelUP](https://github.com/Level/levelup) instance under sublevel `name`. Optional `db` for nesting sublevels.

## License

MIT
