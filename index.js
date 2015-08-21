var prefix  = require('prefixdown'),
    xtend   = require('xtend'),
    levelup = require('levelup');

var prefixCodec = {
  encode: function(prefix){
    return '!' + prefix.join('#') + '!';
  },
  decode: function(location){
    return location.slice(1,-1).split('#');
  }
};

var tableCodec = {
  encode: function(prefix){
    return prefix.join('_');
  },
  decode: function(location){
    return location.split('_');
  }
};

module.exports = function(down, codec){
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
  return function sublevel(db, name, options){
    if(typeof db === 'string'){
      options = name;
      name = db;
      db = null;
    }
    if(db){
      if(db.options.db !== down)
        throw new Error('LeveUP instance must be a Sublevel.');
      return levelup(
        codec.encode( codec.decode( db.location ).concat(name) ),
        xtend( db.options, options, { db: down } )
      );
    }else{
      return levelup(
        codec.encode( [name] ),
        xtend( defaults, options, { db: down } )
      );
    }
  };
};
