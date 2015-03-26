(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;

/* Package-scope variables */
var Tracker, Deps;

(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/tracker/tracker.js                                                                                    //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
/////////////////////////////////////////////////////                                                             // 1
// Package docs at http://docs.meteor.com/#tracker //                                                             // 2
/////////////////////////////////////////////////////                                                             // 3
                                                                                                                  // 4
/**                                                                                                               // 5
 * @namespace Tracker                                                                                             // 6
 * @summary The namespace for Tracker-related methods.                                                            // 7
 */                                                                                                               // 8
Tracker = {};                                                                                                     // 9
                                                                                                                  // 10
// http://docs.meteor.com/#tracker_active                                                                         // 11
                                                                                                                  // 12
/**                                                                                                               // 13
 * @summary True if there is a current computation, meaning that dependencies on reactive data sources will be tracked and potentially cause the current computation to be rerun.
 * @locus Client                                                                                                  // 15
 * @type {Boolean}                                                                                                // 16
 */                                                                                                               // 17
Tracker.active = false;                                                                                           // 18
                                                                                                                  // 19
// http://docs.meteor.com/#tracker_currentcomputation                                                             // 20
                                                                                                                  // 21
/**                                                                                                               // 22
 * @summary The current computation, or `null` if there isn't one.  The current computation is the [`Tracker.Computation`](#tracker_computation) object created by the innermost active call to `Tracker.autorun`, and it's the computation that gains dependencies when reactive data sources are accessed.
 * @locus Client                                                                                                  // 24
 * @type {Tracker.Computation}                                                                                    // 25
 */                                                                                                               // 26
Tracker.currentComputation = null;                                                                                // 27
                                                                                                                  // 28
// References to all computations created within the Tracker by id.                                               // 29
// Keeping these references on an underscore property gives more control to                                       // 30
// tooling and packages extending Tracker without increasing the API surface.                                     // 31
// These can used to monkey-patch computations, their functions, use                                              // 32
// computation ids for tracking, etc.                                                                             // 33
Tracker._computations = {};                                                                                       // 34
                                                                                                                  // 35
var setCurrentComputation = function (c) {                                                                        // 36
  Tracker.currentComputation = c;                                                                                 // 37
  Tracker.active = !! c;                                                                                          // 38
};                                                                                                                // 39
                                                                                                                  // 40
var _debugFunc = function () {                                                                                    // 41
  // We want this code to work without Meteor, and also without                                                   // 42
  // "console" (which is technically non-standard and may be missing                                              // 43
  // on some browser we come across, like it was on IE 7).                                                        // 44
  //                                                                                                              // 45
  // Lazy evaluation because `Meteor` does not exist right away.(??)                                              // 46
  return (typeof Meteor !== "undefined" ? Meteor._debug :                                                         // 47
          ((typeof console !== "undefined") && console.log ?                                                      // 48
           function () { console.log.apply(console, arguments); } :                                               // 49
           function () {}));                                                                                      // 50
};                                                                                                                // 51
                                                                                                                  // 52
var _throwOrLog = function (from, e) {                                                                            // 53
  if (throwFirstError) {                                                                                          // 54
    throw e;                                                                                                      // 55
  } else {                                                                                                        // 56
    var messageAndStack;                                                                                          // 57
    if (e.stack && e.message) {                                                                                   // 58
      var idx = e.stack.indexOf(e.message);                                                                       // 59
      if (idx >= 0 && idx <= 10) // allow for "Error: " (at least 7)                                              // 60
        messageAndStack = e.stack; // message is part of e.stack, as in Chrome                                    // 61
      else                                                                                                        // 62
        messageAndStack = e.message +                                                                             // 63
        (e.stack.charAt(0) === '\n' ? '' : '\n') + e.stack; // e.g. Safari                                        // 64
    } else {                                                                                                      // 65
      messageAndStack = e.stack || e.message;                                                                     // 66
    }                                                                                                             // 67
    _debugFunc()("Exception from Tracker " + from + " function:",                                                 // 68
                 messageAndStack);                                                                                // 69
  }                                                                                                               // 70
};                                                                                                                // 71
                                                                                                                  // 72
// Takes a function `f`, and wraps it in a `Meteor._noYieldsAllowed`                                              // 73
// block if we are running on the server. On the client, returns the                                              // 74
// original function (since `Meteor._noYieldsAllowed` is a                                                        // 75
// no-op). This has the benefit of not adding an unnecessary stack                                                // 76
// frame on the client.                                                                                           // 77
var withNoYieldsAllowed = function (f) {                                                                          // 78
  if ((typeof Meteor === 'undefined') || Meteor.isClient) {                                                       // 79
    return f;                                                                                                     // 80
  } else {                                                                                                        // 81
    return function () {                                                                                          // 82
      var args = arguments;                                                                                       // 83
      Meteor._noYieldsAllowed(function () {                                                                       // 84
        f.apply(null, args);                                                                                      // 85
      });                                                                                                         // 86
    };                                                                                                            // 87
  }                                                                                                               // 88
};                                                                                                                // 89
                                                                                                                  // 90
var nextId = 1;                                                                                                   // 91
// computations whose callbacks we should call at flush time                                                      // 92
var pendingComputations = [];                                                                                     // 93
// `true` if a Tracker.flush is scheduled, or if we are in Tracker.flush now                                      // 94
var willFlush = false;                                                                                            // 95
// `true` if we are in Tracker.flush now                                                                          // 96
var inFlush = false;                                                                                              // 97
// `true` if we are computing a computation now, either first time                                                // 98
// or recompute.  This matches Tracker.active unless we are inside                                                // 99
// Tracker.nonreactive, which nullfies currentComputation even though                                             // 100
// an enclosing computation may still be running.                                                                 // 101
var inCompute = false;                                                                                            // 102
// `true` if the `_throwFirstError` option was passed in to the call                                              // 103
// to Tracker.flush that we are in. When set, throw rather than log the                                           // 104
// first error encountered while flushing. Before throwing the error,                                             // 105
// finish flushing (from a finally block), logging any subsequent                                                 // 106
// errors.                                                                                                        // 107
var throwFirstError = false;                                                                                      // 108
                                                                                                                  // 109
var afterFlushCallbacks = [];                                                                                     // 110
                                                                                                                  // 111
var requireFlush = function () {                                                                                  // 112
  if (! willFlush) {                                                                                              // 113
    // We want this code to work without Meteor, see debugFunc above                                              // 114
    if (typeof Meteor !== "undefined")                                                                            // 115
      Meteor._setImmediate(Tracker._runFlush);                                                                    // 116
    else                                                                                                          // 117
      setTimeout(Tracker._runFlush, 0);                                                                           // 118
    willFlush = true;                                                                                             // 119
  }                                                                                                               // 120
};                                                                                                                // 121
                                                                                                                  // 122
// Tracker.Computation constructor is visible but private                                                         // 123
// (throws an error if you try to call it)                                                                        // 124
var constructingComputation = false;                                                                              // 125
                                                                                                                  // 126
//                                                                                                                // 127
// http://docs.meteor.com/#tracker_computation                                                                    // 128
                                                                                                                  // 129
/**                                                                                                               // 130
 * @summary A Computation object represents code that is repeatedly rerun                                         // 131
 * in response to                                                                                                 // 132
 * reactive data changes. Computations don't have return values; they just                                        // 133
 * perform actions, such as rerendering a template on the screen. Computations                                    // 134
 * are created using Tracker.autorun. Use stop to prevent further rerunning of a                                  // 135
 * computation.                                                                                                   // 136
 * @instancename computation                                                                                      // 137
 */                                                                                                               // 138
Tracker.Computation = function (f, parent) {                                                                      // 139
  if (! constructingComputation)                                                                                  // 140
    throw new Error(                                                                                              // 141
      "Tracker.Computation constructor is private; use Tracker.autorun");                                         // 142
  constructingComputation = false;                                                                                // 143
                                                                                                                  // 144
  var self = this;                                                                                                // 145
                                                                                                                  // 146
  // http://docs.meteor.com/#computation_stopped                                                                  // 147
                                                                                                                  // 148
  /**                                                                                                             // 149
   * @summary True if this computation has been stopped.                                                          // 150
   * @locus Client                                                                                                // 151
   * @memberOf Tracker.Computation                                                                                // 152
   * @instance                                                                                                    // 153
   * @name  stopped                                                                                               // 154
   */                                                                                                             // 155
  self.stopped = false;                                                                                           // 156
                                                                                                                  // 157
  // http://docs.meteor.com/#computation_invalidated                                                              // 158
                                                                                                                  // 159
  /**                                                                                                             // 160
   * @summary True if this computation has been invalidated (and not yet rerun), or if it has been stopped.       // 161
   * @locus Client                                                                                                // 162
   * @memberOf Tracker.Computation                                                                                // 163
   * @instance                                                                                                    // 164
   * @name  invalidated                                                                                           // 165
   * @type {Boolean}                                                                                              // 166
   */                                                                                                             // 167
  self.invalidated = false;                                                                                       // 168
                                                                                                                  // 169
  // http://docs.meteor.com/#computation_firstrun                                                                 // 170
                                                                                                                  // 171
  /**                                                                                                             // 172
   * @summary True during the initial run of the computation at the time `Tracker.autorun` is called, and false on subsequent reruns and at other times.
   * @locus Client                                                                                                // 174
   * @memberOf Tracker.Computation                                                                                // 175
   * @instance                                                                                                    // 176
   * @name  firstRun                                                                                              // 177
   * @type {Boolean}                                                                                              // 178
   */                                                                                                             // 179
  self.firstRun = true;                                                                                           // 180
                                                                                                                  // 181
  self._id = nextId++;                                                                                            // 182
  self._onInvalidateCallbacks = [];                                                                               // 183
  // the plan is at some point to use the parent relation                                                         // 184
  // to constrain the order that computations are processed                                                       // 185
  self._parent = parent;                                                                                          // 186
  self._func = f;                                                                                                 // 187
  self._recomputing = false;                                                                                      // 188
                                                                                                                  // 189
  // Register the computation within the global Tracker.                                                          // 190
  Tracker._computations[self._id] = self;                                                                         // 191
                                                                                                                  // 192
  var errored = true;                                                                                             // 193
  try {                                                                                                           // 194
    self._compute();                                                                                              // 195
    errored = false;                                                                                              // 196
  } finally {                                                                                                     // 197
    self.firstRun = false;                                                                                        // 198
    if (errored)                                                                                                  // 199
      self.stop();                                                                                                // 200
  }                                                                                                               // 201
};                                                                                                                // 202
                                                                                                                  // 203
// http://docs.meteor.com/#computation_oninvalidate                                                               // 204
                                                                                                                  // 205
/**                                                                                                               // 206
 * @summary Registers `callback` to run when this computation is next invalidated, or runs it immediately if the computation is already invalidated.  The callback is run exactly once and not upon future invalidations unless `onInvalidate` is called again after the computation becomes valid again.
 * @locus Client                                                                                                  // 208
 * @param {Function} callback Function to be called on invalidation. Receives one argument, the computation that was invalidated.
 */                                                                                                               // 210
Tracker.Computation.prototype.onInvalidate = function (f) {                                                       // 211
  var self = this;                                                                                                // 212
                                                                                                                  // 213
  if (typeof f !== 'function')                                                                                    // 214
    throw new Error("onInvalidate requires a function");                                                          // 215
                                                                                                                  // 216
  if (self.invalidated) {                                                                                         // 217
    Tracker.nonreactive(function () {                                                                             // 218
      withNoYieldsAllowed(f)(self);                                                                               // 219
    });                                                                                                           // 220
  } else {                                                                                                        // 221
    self._onInvalidateCallbacks.push(f);                                                                          // 222
  }                                                                                                               // 223
};                                                                                                                // 224
                                                                                                                  // 225
// http://docs.meteor.com/#computation_invalidate                                                                 // 226
                                                                                                                  // 227
/**                                                                                                               // 228
 * @summary Invalidates this computation so that it will be rerun.                                                // 229
 * @locus Client                                                                                                  // 230
 */                                                                                                               // 231
Tracker.Computation.prototype.invalidate = function () {                                                          // 232
  var self = this;                                                                                                // 233
  if (! self.invalidated) {                                                                                       // 234
    // if we're currently in _recompute(), don't enqueue                                                          // 235
    // ourselves, since we'll rerun immediately anyway.                                                           // 236
    if (! self._recomputing && ! self.stopped) {                                                                  // 237
      requireFlush();                                                                                             // 238
      pendingComputations.push(this);                                                                             // 239
    }                                                                                                             // 240
                                                                                                                  // 241
    self.invalidated = true;                                                                                      // 242
                                                                                                                  // 243
    // callbacks can't add callbacks, because                                                                     // 244
    // self.invalidated === true.                                                                                 // 245
    for(var i = 0, f; f = self._onInvalidateCallbacks[i]; i++) {                                                  // 246
      Tracker.nonreactive(function () {                                                                           // 247
        withNoYieldsAllowed(f)(self);                                                                             // 248
      });                                                                                                         // 249
    }                                                                                                             // 250
    self._onInvalidateCallbacks = [];                                                                             // 251
  }                                                                                                               // 252
};                                                                                                                // 253
                                                                                                                  // 254
// http://docs.meteor.com/#computation_stop                                                                       // 255
                                                                                                                  // 256
/**                                                                                                               // 257
 * @summary Prevents this computation from rerunning.                                                             // 258
 * @locus Client                                                                                                  // 259
 */                                                                                                               // 260
Tracker.Computation.prototype.stop = function () {                                                                // 261
  if (! this.stopped) {                                                                                           // 262
    this.stopped = true;                                                                                          // 263
    this.invalidate();                                                                                            // 264
    // Unregister from global Tracker.                                                                            // 265
    delete Tracker._computations[this._id];                                                                       // 266
  }                                                                                                               // 267
};                                                                                                                // 268
                                                                                                                  // 269
Tracker.Computation.prototype._compute = function () {                                                            // 270
  var self = this;                                                                                                // 271
  self.invalidated = false;                                                                                       // 272
                                                                                                                  // 273
  var previous = Tracker.currentComputation;                                                                      // 274
  setCurrentComputation(self);                                                                                    // 275
  var previousInCompute = inCompute;                                                                              // 276
  inCompute = true;                                                                                               // 277
  try {                                                                                                           // 278
    withNoYieldsAllowed(self._func)(self);                                                                        // 279
  } finally {                                                                                                     // 280
    setCurrentComputation(previous);                                                                              // 281
    inCompute = previousInCompute;                                                                                // 282
  }                                                                                                               // 283
};                                                                                                                // 284
                                                                                                                  // 285
Tracker.Computation.prototype._needsRecompute = function () {                                                     // 286
  var self = this;                                                                                                // 287
  return self.invalidated && ! self.stopped;                                                                      // 288
};                                                                                                                // 289
                                                                                                                  // 290
Tracker.Computation.prototype._recompute = function () {                                                          // 291
  var self = this;                                                                                                // 292
                                                                                                                  // 293
  self._recomputing = true;                                                                                       // 294
  try {                                                                                                           // 295
    if (self._needsRecompute()) {                                                                                 // 296
      try {                                                                                                       // 297
        self._compute();                                                                                          // 298
      } catch (e) {                                                                                               // 299
        _throwOrLog("recompute", e);                                                                              // 300
      }                                                                                                           // 301
    }                                                                                                             // 302
  } finally {                                                                                                     // 303
    self._recomputing = false;                                                                                    // 304
  }                                                                                                               // 305
};                                                                                                                // 306
                                                                                                                  // 307
//                                                                                                                // 308
// http://docs.meteor.com/#tracker_dependency                                                                     // 309
                                                                                                                  // 310
/**                                                                                                               // 311
 * @summary A Dependency represents an atomic unit of reactive data that a                                        // 312
 * computation might depend on. Reactive data sources such as Session or                                          // 313
 * Minimongo internally create different Dependency objects for different                                         // 314
 * pieces of data, each of which may be depended on by multiple computations.                                     // 315
 * When the data changes, the computations are invalidated.                                                       // 316
 * @class                                                                                                         // 317
 * @instanceName dependency                                                                                       // 318
 */                                                                                                               // 319
Tracker.Dependency = function () {                                                                                // 320
  this._dependentsById = {};                                                                                      // 321
};                                                                                                                // 322
                                                                                                                  // 323
// http://docs.meteor.com/#dependency_depend                                                                      // 324
//                                                                                                                // 325
// Adds `computation` to this set if it is not already                                                            // 326
// present.  Returns true if `computation` is a new member of the set.                                            // 327
// If no argument, defaults to currentComputation, or does nothing                                                // 328
// if there is no currentComputation.                                                                             // 329
                                                                                                                  // 330
/**                                                                                                               // 331
 * @summary Declares that the current computation (or `fromComputation` if given) depends on `dependency`.  The computation will be invalidated the next time `dependency` changes.
                                                                                                                  // 333
If there is no current computation and `depend()` is called with no arguments, it does nothing and returns false. // 334
                                                                                                                  // 335
Returns true if the computation is a new dependent of `dependency` rather than an existing one.                   // 336
 * @locus Client                                                                                                  // 337
 * @param {Tracker.Computation} [fromComputation] An optional computation declared to depend on `dependency` instead of the current computation.
 * @returns {Boolean}                                                                                             // 339
 */                                                                                                               // 340
Tracker.Dependency.prototype.depend = function (computation) {                                                    // 341
  if (! computation) {                                                                                            // 342
    if (! Tracker.active)                                                                                         // 343
      return false;                                                                                               // 344
                                                                                                                  // 345
    computation = Tracker.currentComputation;                                                                     // 346
  }                                                                                                               // 347
  var self = this;                                                                                                // 348
  var id = computation._id;                                                                                       // 349
  if (! (id in self._dependentsById)) {                                                                           // 350
    self._dependentsById[id] = computation;                                                                       // 351
    computation.onInvalidate(function () {                                                                        // 352
      delete self._dependentsById[id];                                                                            // 353
    });                                                                                                           // 354
    return true;                                                                                                  // 355
  }                                                                                                               // 356
  return false;                                                                                                   // 357
};                                                                                                                // 358
                                                                                                                  // 359
// http://docs.meteor.com/#dependency_changed                                                                     // 360
                                                                                                                  // 361
/**                                                                                                               // 362
 * @summary Invalidate all dependent computations immediately and remove them as dependents.                      // 363
 * @locus Client                                                                                                  // 364
 */                                                                                                               // 365
Tracker.Dependency.prototype.changed = function () {                                                              // 366
  var self = this;                                                                                                // 367
  for (var id in self._dependentsById)                                                                            // 368
    self._dependentsById[id].invalidate();                                                                        // 369
};                                                                                                                // 370
                                                                                                                  // 371
// http://docs.meteor.com/#dependency_hasdependents                                                               // 372
                                                                                                                  // 373
/**                                                                                                               // 374
 * @summary True if this Dependency has one or more dependent Computations, which would be invalidated if this Dependency were to change.
 * @locus Client                                                                                                  // 376
 * @returns {Boolean}                                                                                             // 377
 */                                                                                                               // 378
Tracker.Dependency.prototype.hasDependents = function () {                                                        // 379
  var self = this;                                                                                                // 380
  for(var id in self._dependentsById)                                                                             // 381
    return true;                                                                                                  // 382
  return false;                                                                                                   // 383
};                                                                                                                // 384
                                                                                                                  // 385
// http://docs.meteor.com/#tracker_flush                                                                          // 386
                                                                                                                  // 387
/**                                                                                                               // 388
 * @summary Process all reactive updates immediately and ensure that all invalidated computations are rerun.      // 389
 * @locus Client                                                                                                  // 390
 */                                                                                                               // 391
Tracker.flush = function (options) {                                                                              // 392
  Tracker._runFlush({ finishSynchronously: true,                                                                  // 393
                      throwFirstError: options && options._throwFirstError });                                    // 394
};                                                                                                                // 395
                                                                                                                  // 396
// Run all pending computations and afterFlush callbacks.  If we were not called                                  // 397
// directly via Tracker.flush, this may return before they're all done to allow                                   // 398
// the event loop to run a little before continuing.                                                              // 399
Tracker._runFlush = function (options) {                                                                          // 400
  // XXX What part of the comment below is still true? (We no longer                                              // 401
  // have Spark)                                                                                                  // 402
  //                                                                                                              // 403
  // Nested flush could plausibly happen if, say, a flush causes                                                  // 404
  // DOM mutation, which causes a "blur" event, which runs an                                                     // 405
  // app event handler that calls Tracker.flush.  At the moment                                                   // 406
  // Spark blocks event handlers during DOM mutation anyway,                                                      // 407
  // because the LiveRange tree isn't valid.  And we don't have                                                   // 408
  // any useful notion of a nested flush.                                                                         // 409
  //                                                                                                              // 410
  // https://app.asana.com/0/159908330244/385138233856                                                            // 411
  if (inFlush)                                                                                                    // 412
    throw new Error("Can't call Tracker.flush while flushing");                                                   // 413
                                                                                                                  // 414
  if (inCompute)                                                                                                  // 415
    throw new Error("Can't flush inside Tracker.autorun");                                                        // 416
                                                                                                                  // 417
  options = options || {};                                                                                        // 418
                                                                                                                  // 419
  inFlush = true;                                                                                                 // 420
  willFlush = true;                                                                                               // 421
  throwFirstError = !! options.throwFirstError;                                                                   // 422
                                                                                                                  // 423
  var recomputedCount = 0;                                                                                        // 424
  var finishedTry = false;                                                                                        // 425
  try {                                                                                                           // 426
    while (pendingComputations.length ||                                                                          // 427
           afterFlushCallbacks.length) {                                                                          // 428
                                                                                                                  // 429
      // recompute all pending computations                                                                       // 430
      while (pendingComputations.length) {                                                                        // 431
        var comp = pendingComputations.shift();                                                                   // 432
        comp._recompute();                                                                                        // 433
        if (comp._needsRecompute()) {                                                                             // 434
          pendingComputations.unshift(comp);                                                                      // 435
        }                                                                                                         // 436
                                                                                                                  // 437
        if (! options.finishSynchronously && ++recomputedCount > 1000) {                                          // 438
          finishedTry = true;                                                                                     // 439
          return;                                                                                                 // 440
        }                                                                                                         // 441
      }                                                                                                           // 442
                                                                                                                  // 443
      if (afterFlushCallbacks.length) {                                                                           // 444
        // call one afterFlush callback, which may                                                                // 445
        // invalidate more computations                                                                           // 446
        var func = afterFlushCallbacks.shift();                                                                   // 447
        try {                                                                                                     // 448
          func();                                                                                                 // 449
        } catch (e) {                                                                                             // 450
          _throwOrLog("afterFlush", e);                                                                           // 451
        }                                                                                                         // 452
      }                                                                                                           // 453
    }                                                                                                             // 454
    finishedTry = true;                                                                                           // 455
  } finally {                                                                                                     // 456
    if (! finishedTry) {                                                                                          // 457
      // we're erroring due to throwFirstError being true.                                                        // 458
      inFlush = false; // needed before calling `Tracker.flush()` again                                           // 459
      // finish flushing                                                                                          // 460
      Tracker._runFlush({                                                                                         // 461
        finishSynchronously: options.finishSynchronously,                                                         // 462
        throwFirstError: false                                                                                    // 463
      });                                                                                                         // 464
    }                                                                                                             // 465
    willFlush = false;                                                                                            // 466
    inFlush = false;                                                                                              // 467
    if (pendingComputations.length || afterFlushCallbacks.length) {                                               // 468
      // We're yielding because we ran a bunch of computations and we aren't                                      // 469
      // required to finish synchronously, so we'd like to give the event loop a                                  // 470
      // chance. We should flush again soon.                                                                      // 471
      if (options.finishSynchronously) {                                                                          // 472
        throw new Error("still have more to do?");  // shouldn't happen                                           // 473
      }                                                                                                           // 474
      setTimeout(requireFlush, 10);                                                                               // 475
    }                                                                                                             // 476
  }                                                                                                               // 477
};                                                                                                                // 478
                                                                                                                  // 479
// http://docs.meteor.com/#tracker_autorun                                                                        // 480
//                                                                                                                // 481
// Run f(). Record its dependencies. Rerun it whenever the                                                        // 482
// dependencies change.                                                                                           // 483
//                                                                                                                // 484
// Returns a new Computation, which is also passed to f.                                                          // 485
//                                                                                                                // 486
// Links the computation to the current computation                                                               // 487
// so that it is stopped if the current computation is invalidated.                                               // 488
                                                                                                                  // 489
/**                                                                                                               // 490
 * @summary Run a function now and rerun it later whenever its dependencies change. Returns a Computation object that can be used to stop or observe the rerunning.
 * @locus Client                                                                                                  // 492
 * @param {Function} runFunc The function to run. It receives one argument: the Computation object that will be returned.
 * @returns {Tracker.Computation}                                                                                 // 494
 */                                                                                                               // 495
Tracker.autorun = function (f) {                                                                                  // 496
  if (typeof f !== 'function')                                                                                    // 497
    throw new Error('Tracker.autorun requires a function argument');                                              // 498
                                                                                                                  // 499
  constructingComputation = true;                                                                                 // 500
  var c = new Tracker.Computation(f, Tracker.currentComputation);                                                 // 501
                                                                                                                  // 502
  if (Tracker.active)                                                                                             // 503
    Tracker.onInvalidate(function () {                                                                            // 504
      c.stop();                                                                                                   // 505
    });                                                                                                           // 506
                                                                                                                  // 507
  return c;                                                                                                       // 508
};                                                                                                                // 509
                                                                                                                  // 510
// http://docs.meteor.com/#tracker_nonreactive                                                                    // 511
//                                                                                                                // 512
// Run `f` with no current computation, returning the return value                                                // 513
// of `f`.  Used to turn off reactivity for the duration of `f`,                                                  // 514
// so that reactive data sources accessed by `f` will not result in any                                           // 515
// computations being invalidated.                                                                                // 516
                                                                                                                  // 517
/**                                                                                                               // 518
 * @summary Run a function without tracking dependencies.                                                         // 519
 * @locus Client                                                                                                  // 520
 * @param {Function} func A function to call immediately.                                                         // 521
 */                                                                                                               // 522
Tracker.nonreactive = function (f) {                                                                              // 523
  var previous = Tracker.currentComputation;                                                                      // 524
  setCurrentComputation(null);                                                                                    // 525
  try {                                                                                                           // 526
    return f();                                                                                                   // 527
  } finally {                                                                                                     // 528
    setCurrentComputation(previous);                                                                              // 529
  }                                                                                                               // 530
};                                                                                                                // 531
                                                                                                                  // 532
// http://docs.meteor.com/#tracker_oninvalidate                                                                   // 533
                                                                                                                  // 534
/**                                                                                                               // 535
 * @summary Registers a new [`onInvalidate`](#computation_oninvalidate) callback on the current computation (which must exist), to be called immediately when the current computation is invalidated or stopped.
 * @locus Client                                                                                                  // 537
 * @param {Function} callback A callback function that will be invoked as `func(c)`, where `c` is the computation on which the callback is registered.
 */                                                                                                               // 539
Tracker.onInvalidate = function (f) {                                                                             // 540
  if (! Tracker.active)                                                                                           // 541
    throw new Error("Tracker.onInvalidate requires a currentComputation");                                        // 542
                                                                                                                  // 543
  Tracker.currentComputation.onInvalidate(f);                                                                     // 544
};                                                                                                                // 545
                                                                                                                  // 546
// http://docs.meteor.com/#tracker_afterflush                                                                     // 547
                                                                                                                  // 548
/**                                                                                                               // 549
 * @summary Schedules a function to be called during the next flush, or later in the current flush if one is in progress, after all invalidated computations have been rerun.  The function will be run once and not on subsequent flushes unless `afterFlush` is called again.
 * @locus Client                                                                                                  // 551
 * @param {Function} callback A function to call at flush time.                                                   // 552
 */                                                                                                               // 553
Tracker.afterFlush = function (f) {                                                                               // 554
  afterFlushCallbacks.push(f);                                                                                    // 555
  requireFlush();                                                                                                 // 556
};                                                                                                                // 557
                                                                                                                  // 558
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/tracker/deprecated.js                                                                                 //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
// Deprecated functions.                                                                                          // 1
                                                                                                                  // 2
// These functions used to be on the Meteor object (and worked slightly                                           // 3
// differently).                                                                                                  // 4
// XXX COMPAT WITH 0.5.7                                                                                          // 5
Meteor.flush = Tracker.flush;                                                                                     // 6
Meteor.autorun = Tracker.autorun;                                                                                 // 7
                                                                                                                  // 8
// We used to require a special "autosubscribe" call to reactively subscribe to                                   // 9
// things. Now, it works with autorun.                                                                            // 10
// XXX COMPAT WITH 0.5.4                                                                                          // 11
Meteor.autosubscribe = Tracker.autorun;                                                                           // 12
                                                                                                                  // 13
// This Tracker API briefly existed in 0.5.8 and 0.5.9                                                            // 14
// XXX COMPAT WITH 0.5.9                                                                                          // 15
Tracker.depend = function (d) {                                                                                   // 16
  return d.depend();                                                                                              // 17
};                                                                                                                // 18
                                                                                                                  // 19
Deps = Tracker;                                                                                                   // 20
                                                                                                                  // 21
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package.tracker = {
  Tracker: Tracker,
  Deps: Deps
};

})();

//# sourceMappingURL=tracker.js.map
