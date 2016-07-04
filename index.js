var prefixdown = require('prefixdown')
var xtend = require('xtend')
var inherits = require('util').inherits
var LevelUP = require('levelup')

var prefixCodec = {
  encode: function (arr) {
    return '!' + arr.join('#') + '!'
  },
  decode: function (str) {
    return str === '!!' ? [] : str.slice(1, -1).split('#')
  }
}

function SublevelUP (db, name, options) {
  if (!db || typeof db === 'string') {
    throw new Error('db must be a LevelUP or SubLevelUP instance')
  }

  if (db instanceof SublevelUP && typeof name !== 'string') {
    if (name) {
      // passing sublevel with options
      // new instance, same prefix, extended options
      return new SublevelUP(db, null, name)
    } else if (!options) {
      // Passing sublevel return sublevel
      return db
    }
  }

  if (!(this instanceof SublevelUP)) {
    // reuse sublevel
    if (db._sublevels && db._sublevels[name]) {
      return db._sublevels[name]
    }
    return new SublevelUP(db, name, options)
  }

  if (typeof name !== 'string' && !options) {
    // sublevel(db, options)
    options = name
    name = null
  }

  var defaults = {}
  var override = {}

  if (db instanceof SublevelUP) {
    this._levelup = db._levelup
    override.db = db.options.db
    override.prefixEncoding = db.options.prefixEncoding
    if (name) {
      // memorize child
      db._sublevels[name] = this
    }
  } else if (
    db.toString() === 'LevelUP' || // levelup instance
    typeof db.sublevel === 'function' // level-sublevel instance
  ) {
    this._levelup = db
    // root is LevelUP, prefix based
    defaults.prefixEncoding = prefixCodec
    override.db = prefixdown(db)
  } else {
    throw new Error('db must be a LevelUP or SubLevelUP instance')
  }

  // sublevel children
  this._sublevels = {}

  options = xtend(defaults, db.options, options, override)
  var c = options.prefixEncoding
  var location
  if (name) {
    if (db instanceof SublevelUP) {
      // concat sublevel prefix location with name
      location = c.encode(c.decode(db.location).concat(name))
    } else {
      // levelup/down with name argument
      location = c.encode([name])
    }
  } else {
    if (db instanceof SublevelUP) {
      // retain sublevel prefix location
      location = db.location
    } else {
      // levelup/down without name argument
      location = c.encode([])
    }
  }
  // LevelUP.call(this, options.db(location), options)
  LevelUP.call(this, location, options)
}

inherits(SublevelUP, LevelUP)

SublevelUP.prototype.sublevel = function (name, options) {
  return SublevelUP(this, name, options)
}

module.exports = SublevelUP
