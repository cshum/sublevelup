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
  if(!down) 
    throw new Error('Missing sublevel base.');
  //passing Sublevel return Sublevel
  if(down.name === 'Sublevel' || typeof down.sublevel === 'function')
    return down;

  if(down.toString() === 'LevelUP') {
    //prefix based
    if(!codec) codec = prefixCodec;
    defaults = down.options;
    down = prefix(down);
  }else{
    //table based
    if(!codec) codec = tableCodec;
  }

  var sublevels = {};

  function Sublevel (db, name, options) {
    var location;
    if(typeof db === 'string'){
      options = name;
      name = db;
      db = null;
    }

    if(typeof name !== 'string')
      throw new Error('Sublevel must provide a name.');

    if (!(this instanceof Sublevel)){
      if(db && db._sublevels && db._sublevels[name])
        return db._sublevels[name];
      if(!db && sublevels[name])
        return sublevels[name];
      return new Sublevel(db, name, options);
    }

    if(db){
      if(db.options.db !== down)
        throw new Error('LeveUP instance must be a Sublevel.');

      location = codec.encode(codec.decode(db.location).concat(name));
      options = xtend(db.options, options, {db: down});
      db._sublevels[name] = this;
    }else{
      location = codec.encode([name]);
      options = xtend(defaults, options, {db: down});
      sublevels[name] = this;
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
