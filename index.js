var prefix   = require('prefixdown'),
    xtend    = require('xtend'),
    inherits = require('util').inherits,
    LevelUP  = require('levelup');

var prefixCodec = {
  encode: function (prefix) {
    return '!' + prefix.join('#') + '!';
  },
  decode: function (location) {
    return location.slice(1, -1).split('#');
  }
};

var tableCodec = {
  encode: function (prefix) {
    return prefix.join('_');
  },
  decode: function (location) {
    return location.split('_');
  }
};

module.exports = function (down, codec) {
  var defaults;
  if(down.toString() === 'LevelUP') {
    //prefix based
    if(!codec) codec = prefixCodec;
    defaults = down.options;
    down = prefix(down);
  }else{
    //table based
    if(!codec) codec = tableCodec;
  }

  function Sublevel (db, name, options) {
    if (!(this instanceof Sublevel)){
      return db && db._sublevels && db._sublevels[name] ? 
        db._sublevels[name] : new Sublevel(db, name, options);
    }

    var location;

    if(typeof db === 'string'){
      options = name;
      name = db;
      db = null;
    }

    if(typeof name !== 'string')
      throw new Error('Sublevel must provide a name.');

    if(db){
      if(db.options.db !== down)
        throw new Error('LeveUP instance must be a Sublevel.');

      db._sublevels[name] = this;

      location = codec.encode(codec.decode(db.location).concat(name));
      options = xtend(db.options, options, {db: down});
    }else{
      location = codec.encode([name]);
      options = xtend(defaults, options, {db: down});
    }

    this._sublevels = {};

    LevelUP.call(this, location, options);
  }

  inherits(Sublevel, LevelUP);

  Sublevel.prototype.sublevel = function (name, options) {
    this._sublevels[name] = this._sublevels[name] || 
      Sublevel(this, name, options);
    return this._sublevels[name];
  };

  return Sublevel;
};
