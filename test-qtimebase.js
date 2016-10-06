/**
 * Copyright (C) 2015-2016 Andras Radics
 * Licensed under the Apache License, Version 2.0
 *
 * originally part of qcache
 */

'use strict';

var qtimebase = require('./');
var getTimestamp = qtimebase.getTimestamp;

// ts sometimes lags actual time by 2+ ms
// node must run immediate tasks after a gc, without first catching up
// on all the overdue timeout tasks.  This breaks an interval timer timestamp.
var _maxGcDelay = 2;

module.exports = {
    setUp: function(done) {
        // FIXME: nodeunit 0.9.0 bug: if same file is run more than once,
        // the setUp method is called only on the first run!! not 2nd and later
        if (getTimestamp.reset) getTimestamp.reset();
        done();
    },

    'should have valid package': function(t) {
        require('./package.json');
        t.done();
    },

    'should export expected functions': function(t) {
        var expected = ['getTimestamp', 'reset', 'isIntervalMode'];
        for (var i=0; i<expected.length; i++) t.equal(typeof qtimebase[expected[i]], 'function', "exports function " + expected[i]);
        t.done();
    },

    'should return current timestamp': function(t) {
        if (getTimestamp.reset) getTimestamp.reset();
        var t1 = Date.now();
        var ts = getTimestamp();
        var t2 = Date.now();
        t.ok(t1 <= ts+1+_maxGcDelay, "ts too old, " + ts + " vs " + t1);
        t.ok(ts <= t2);
        t.done();
    },

    'making lots of calls should switch to interval timer mode': function(t) {
        if (!getTimestamp.isIntervalMode) return t.done();
        getTimestamp.reset();
        t.ok(!getTimestamp.isIntervalMode(), "how is it already in interval mode ?!");
        for (var i=0; i<4000; i++) getTimestamp();
        t.ok(getTimestamp.isIntervalMode());
        t.done();
    },
    
    'not making calls should revert to one-at-a-time mode': function(t) {
        if (!getTimestamp.isIntervalMode) return t.done();
        getTimestamp.reset();
        t.expect(2);
        for (var i=0; i<4000; i++) getTimestamp();
        t.ok(getTimestamp.isIntervalMode());
        setTimeout(function(){
            // note: node-v0.10.29 can run this 6ms after the loop (vs 10),
            // which is not enough to expire interval mode.  Pad to 20.
            t.ok(!getTimestamp.isIntervalMode());
            t.done();
        }, 20);
    },

    'should return current timestamp in interval timer mode': function(t) {
        if (!getTimestamp.isIntervalMode) return t.done();
        getTimestamp.reset();
        for (var i=0; i<4000;  i++) getTimestamp();
        setTimeout(function() {
            var t1 = Date.now();
            var ts = getTimestamp();
            var t2 = Date.now();
            // interval getTimestamp() will lag current time by up to 1 ms
            t.ok(t1 <= ts+1+_maxGcDelay, t1 + "ts too old, " + ts + " vs " + t1);
            t.ok(ts <= t2);
            t.done();
        }, 3);
    },

    'should return current timestamp after interval timer mode': function(t) {
        if (!getTimestamp.isIntervalMode) return t.done();
        getTimestamp.reset();
        for (var i=0; i<4000;  i++) getTimestamp();
        setTimeout(function() {
            if (getTimestamp.isIntervalMode) t.ok(getTimestamp.isIntervalMode);
            var t1 = Date.now();
            var ts = getTimestamp();
            var t2 = Date.now();
            t.ok(t1 <= ts+1+_maxGcDelay, "ts too old, " + ts + " vs " + t1);
            t.ok(ts <= t2);
            t.done();
        }, 20);
    },

    'should track time during blocking burst fetches': function(t) {
        var t1 = getTimestamp(), t2;
        for (var i=0; i<5000000; i++) t2 = getTimestamp();
        // console.log("AR: 5m timestamps in %d ms", t2 - t1);
        t.ok(t2 > t1);
        t.done();
    },
};
