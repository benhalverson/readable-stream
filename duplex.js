// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.

module.exports = Duplex;
var util = require('util');
var Readable = require('./readable.js');
var Writable = require('./writable.js');

util.inherits(Duplex, Readable);

Object.keys(Writable.prototype).forEach(function(method) {
  if (!Duplex.prototype[method])
    Duplex.prototype[method] = Writable.prototype[method];
});

function Duplex(options) {
  Readable.call(this, options);
  Writable.call(this, options);

  this.allowHalfOpen = true;
  if (options && options.allowHalfOpen === false)
    this.allowHalfOpen = false;

  this.once('finish', onfinish);
  this.once('end', onend);
}

// the no-half-open enforcers.
function onfinish() {
  // if we allow half-open state, or if the readable side ended,
  // then we're ok.
  if (this.allowHalfOpen || this._readableState.ended)
    return;

  // mark that we're done.
  this._readableState.ended = true;

  // tell the user
  if (this._readableState.length === 0)
    this.emit('end');
  else
    this.emit('readable');
}

function onend() {
  // if we allow half-open state, or if the writable side ended,
  // then we're ok.
  if (this.allowHalfOpen || this._writableState.ended)
    return;

  // just in case the user is about to call write() again.
  this.write = function() {
    return false;
  };

  // no more data can be written.
  this.end();
}
