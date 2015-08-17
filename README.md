# SublevelUP

Sublevels implemented using [LevelUP](https://github.com/Level/levelup) and [PrefixDOWN](https://github.com/cshum/prefixdown/)

[![Build Status](https://travis-ci.org/cshum/sublevelup.svg)](https://travis-ci.org/cshum/sublevelup)

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

### options.prefix

Supports options.prefix property. A batch operation can be applied into multiple sections under the same database.

```js
var a = sub(db, 'a');
var b = sub(db, 'b');

a.batch([
  {key: 'key', value: 'a', type: 'put'}, //put under a
  {key: 'key', value: 'b', type: 'put', prefix: b}, //put under b
], ...);
```

## License

MIT
