var prefix  = require('prefixdown'),
    xtend   = require('xtend'),
    levelup = require('levelup');

module.exports = function(db, name, options){
  if(typeof name !== 'string'){
    options = name;
    name = '';
  }
  //db is levelup instance
  if(db.options.db.name === 'PrefixDOWN'){
    //PrefixDOWN backed
    return levelup(
      db.location.slice(0,-1) + '#'+name+'!',
      xtend(db.options, options)
    );
  }else{
    //root levelup
    return levelup(
      '!'+name+'!', 
      xtend(db.options, options, { db: prefix(db) })
    );
  }
};
