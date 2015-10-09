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

var tableCodec = {
  encode: function (arr) {
    return arr.length ? arr.join('_') : '_'
  },
  decode: function (str) {
    return str === '_' ? [] : str.split('_')
  }
}

function SublevelUP (db, name, options) {
  if (!db || typeof db === 'string') {
    throw new Error('Missing sublevel base.')
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
    // root is LevelUP, prefix based
    defaults.prefixEncoding = prefixCodec
    override.db = prefixdown(db)
  } else {
    // root is leveldown, table based
    defaults.prefixEncoding = tableCodec
    override.db = db
  }

  // sublevel children
  this._sublevels = {}

  options = xtend(defaults, db.options, options, override)
  var c = options.prefixEncoding
  if (name) {
    if (db instanceof SublevelUP) {
      // concat sublevel prefix with name
      this.prefix = c.encode(c.decode(db.prefix).concat(name))
    } else {
      // levelup/down with name argument
      this.prefix = c.encode([name])
    }
  } else {
    if (db instanceof SublevelUP) {
      // retain sublevel prefix
      this.prefix = db.prefix
    } else {
      // levelup/down without name argument
      this.prefix = c.encode([])
    }
  }

  // LevelUP.call(this, options.db(prefix), options)
  LevelUP.call(this, this.prefix, options)
}

inherits(SublevelUP, LevelUP)

SublevelUP.prototype.sublevel = function (name, options) {
  return SublevelUP(this, name, options)
}

module.exports = SublevelUP
