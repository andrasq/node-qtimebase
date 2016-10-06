/**
 * Adaptive millisecond timestamp source, uses Date.now() or a timer thread
 * depending on the level of usage.
 *
 * Copyright (C) 2015-2016 Andras Radics
 * Licensed under the Apache License, Version 2.0
 *
 * The adaptive timebase is a source of millisecond timestamps.  When
 * lots of timestamps are required, it switches to interval timer mode
 * and relies on a timer thread to update the value.  When usage drops,
 * it quickly reverts to separate timestamps mode.
 *
 * Note that the interval timer timestamp might lag behind the current time
 * by up to 1 ms, and blocking the event loop will introduce additional delay.
 *
 * A millisecond timer thread in node v0.10.29 consumes 4% cpu,
 * which at 6m calls / sec is the equivalent of 240 Date.now() calls / ms.
 * I.e., the default interval threads are somewhat expensive.
 * Setting+clearing an interval timer is 250k/s (v0.10) or 100k/s (v5.8).
 */

module.exports = getTimestampAdaptive;

// function getTimestampBasic( ) {
//     return Date.now();
// }


var _timestamp;         // current time
var _timer;             // interval timer, when running
var _load = 0;          // num same-ms calls exponentially decaying "load avg"

function _intervalTimer( ) {
    _timestamp = Date.now();
    _load >>= 1;
    if (_load <= 50) {
        clearInterval(_timer);
        _timer = null;
    }
}

function getTimestampAdaptive( ) {
    if (_timer) {
        // the interval timer is keeping _timestamp up to date, use it
        _load += 1;
        if (_load > 2000) {
            // track the time even during blocking burst fetches
            _timestamp = Date.now();
            _load -= 2000;
        }
        return _timestamp;
    }
    else {
        // fetch a timestamp, and if fetching "many" switch to interval timer mode
        var ts = Date.now();
        if (ts === _timestamp) {
            _load += 1;
            if (_load > 400 && !_timer) _timer = setInterval(_intervalTimer, 1, 0);
        } else {
            _load >>= 1;
        }
        return _timestamp = ts;
    }
}

getTimestampAdaptive.reset = function( ) {
    _timestamp = null;
    if (_timer) { clearInterval(_timer); _timer = null; }
    _load = 0;
};

getTimestampAdaptive.isIntervalMode = function( ) {
    return _timer ? true : false;
};
