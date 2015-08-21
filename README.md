# SublevelUP

Sublevel interface for both [prefix-based](#prefix-based-sublevel) and [table-based](#table-based-sublevel) sublevels with custom codec support.

[![Build Status](https://travis-ci.org/cshum/sublevelup.svg)](https://travis-ci.org/cshum/sublevelup)

## API

### sublevel = require('sublevelup')(base, [codec])
### db = sublevel([db], name, [options])
### Custom codec

## Prefix based sublevel

Sublevels implemented using [LevelUP](https://github.com/Level/levelup) and [PrefixDOWN](https://github.com/cshum/prefixdown/)
### sub(db, [name], [options])
```js
var sub = require('sublevelup');
var level = require('level');

var db = level('db');

var a = sub(db, 'a');
var ab = sub(a, 'b'); //nested
var c = sub(db, 'c');

a.put('test', 'a', function(){
  ab.put('test', 'ab', function(){
    c.put('test', 'c', function(){
      db.createReadStream().on('data', function(data){
        //Results from root db
        {key: '!a!test', value: 'a'}, 
        {key: '!a#b!test', value: 'ab'},
        {key: '!c!test', value: 'c'}
      });
    });
  });
});
```

## Table based sublevel

## License

MIT
