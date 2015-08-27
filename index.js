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
    // Passing sublevel return sublevel
    if (name) {
      return new SublevelUP(db, null, name)
    } else if (!options) {
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
    options = name
    name = null
  }

  var defaults = {}
  var override = {}

  if (db instanceof SublevelUP) {
    override.db = db.options.db
    override.prefixEncoding = db.options.prefixEncoding
    if (name) db._sublevels[name] = this
  } else if (db.toString() === 'LevelUP') {
    // root is LevelUP, prefix based
    defaults.prefixEncoding = prefixCodec
    override.db = prefixdown(db)
  } else {
    // root is leveldown, table based
    defaults.prefixEncoding = tableCodec
    override.db = db
  }

  options = xtend(defaults, db.options, options, override)
  var c = options.prefixEncoding
  if (name) {
    if (db instanceof SublevelUP) {
      this.prefix = c.encode(c.decode(db.prefix).concat(name))
    } else {
      this.prefix = c.encode([name])
    }
  } else {
    if (db instanceof SublevelUP) {
      this.prefix = db.prefix
    } else {
      this.prefix = c.encode([])
    }
  }

  this._sublevels = {}

  // LevelUP.call(this, options.db(prefix), options)
  LevelUP.call(this, this.prefix, options)
}

inherits(SublevelUP, LevelUP)

SublevelUP.prototype.sublevel = function (name, options) {
  return SublevelUP(this, name, options)
}

module.exports = SublevelUP
