var prefix   = require('prefixdown'),
    xtend    = require('xtend'),
    inherits = require('util').inherits,
    LevelUP  = require('levelup');

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

function Sublevel (db, name, options) {
  var defaults = {};
  var override = {};

  if(!db || typeof db === 'string') throw new Error('Missing sublevel base.');

  if (!(this instanceof Sublevel)){
    //reuse sublevel
    if(db._sublevels && db._sublevels[name])
      return db._sublevels[name];
    return new Sublevel(db, name, options);
  }

  if(typeof name !== 'string'){
    options = name;
    name = null;
  }

  if(db instanceof Sublevel){
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
    override.db = prefix(db);
  }else{
    //root is leveldown, table based
    defaults.prefixEncoding = tableCodec;
    override.db = db;
  }

  options = xtend(defaults, db.options, options, override);
  var c = options.prefixEncoding;
  var location = name ? c.encode(
    db instanceof Sublevel ? c.decode(db.location).concat(name) : [name]
  ) : c.encode([]);

  this._sublevels = {};

  LevelUP.call(this, location, options);
}

inherits(Sublevel, LevelUP);

Sublevel.prototype.sublevel = function (name, options) {
  return Sublevel(this, name, options);
};

module.exports = Sublevel;
