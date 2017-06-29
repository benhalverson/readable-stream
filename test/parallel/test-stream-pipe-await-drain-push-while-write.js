/*<replacement>*/
var bufferShim = require('safe-buffer').Buffer;
/*</replacement>*/
var common = require('../common');
var stream = require('../../');
var assert = require('assert/');

var awaitDrainStates = [1, // after first chunk before callback
1, // after second chunk before callback
0 // resolving chunk pushed after first chunk, awaitDrain is decreased
];

// A writable stream which pushes data onto the stream which pipes into it,
// but only the first time it's written to. Since it's not paused at this time,
// a second write will occur. If the pipe increases awaitDrain twice, we'll
// never get subsequent chunks because 'drain' is only emitted once.
var writable = new stream.Writable({
  write: common.mustCall(function (chunk, encoding, cb) {
    if (chunk.length === 32 * 1024) {
      // first chunk
      var beforePush = readable._readableState.awaitDrain;
      readable.push(bufferShim.alloc(34 * 1024)); // above hwm
      // We should check if awaitDrain counter is increased.
      var afterPush = readable._readableState.awaitDrain;
      assert.strictEqual(afterPush - beforePush, 1, 'Counter is not increased for awaitDrain');
    }

    assert.strictEqual(awaitDrainStates.shift(), readable._readableState.awaitDrain, 'State variable awaitDrain is not correct.');
    cb();
  }, 3)
});

// A readable stream which produces two buffers.
var bufs = [bufferShim.alloc(32 * 1024), bufferShim.alloc(33 * 1024)]; // above hwm
var readable = new stream.Readable({
  read: function () {
    while (bufs.length > 0) {
      this.push(bufs.shift());
    }
  }
});

readable.pipe(writable);