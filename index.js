var prefixdown = require('prefixdown'),
    xtend      = require('xtend'),
    inherits   = require('util').inherits,
    LevelUP    = require('levelup');

var prefixCodec = {
  encode: function (arr) {
    return '!' + arr.join('#') + '!';
  },
  decode: function (str) {
    return str === '!!' ? [] : str.slice(1, -1).split('#');
  }
};

var tableCodec = {
  encode: function (arr) {
    return arr.length ? arr.join('_') : '_';
  },
  decode: function (str) {
    return str === '_' ? [] : str.split('_');
  }
};

function SublevelUP (db, name, options) {
  var defaults = {};
  var override = {};

  if(!db || typeof db === 'string') throw new Error('Missing sublevel base.');

  if (!(this instanceof SublevelUP)){
    //reuse sublevel
    if(db._sublevels && db._sublevels[name])
      return db._sublevels[name];
    return new SublevelUP(db, name, options);
  }

  if(typeof name !== 'string'){
    options = name;
    name = null;
  }

  if(db instanceof SublevelUP){
    if(name){
      override.db = db.options.db;
      override.prefixEncoding = db.options.prefixEncoding;
      db._sublevels[name] = this;
    }else{
      //Passing sublevel return sublevel
      return db;
    }
  }else if(db.toString() === 'LevelUP'){
    //root is LevelUP, prefix based
    defaults.prefixEncoding = prefixCodec;
    override.db = prefixdown(db);
  }else{
    //root is leveldown, table based
    defaults.prefixEncoding = tableCodec;
    override.db = db;
  }

  options = xtend(defaults, db.options, options, override);
  var c = options.prefixEncoding;
  var prefix = name ? c.encode(
    db instanceof SublevelUP ? c.decode(db.prefix).concat(name) : [name]
  ) : c.encode([]);

  this.prefix = prefix;
  this._sublevels = {};

  //LevelUP.call(this, options.db(prefix), options);
  LevelUP.call(this, prefix, options);
}

inherits(SublevelUP, LevelUP);

SublevelUP.prototype.sublevel = function (name, options) {
  return SublevelUP(this, name, options);
};

module.exports = SublevelUP;
