/**
 * Copyright (C) 2015-2016 Andras Radics
 * Licensed under the Apache License, Version 2.0
 */

'use strict';

var qtimebase = require('./');

module.exports = {
    'should have valid package': function(t) {
        require('./package.json');
        t.done();
    },

    'should export expected functions': function(t) {
        var expected = ['getTimestamp', 'reset', 'isIntervalMode'];
        for (var i=0; i<expected.length; i++) t.equal(typeof qtimebase[expected[i]], 'function', "exports function " + expected[i]);
        t.done();
    },

    'should return current timestamps': function(t) {
        var t1 = Date.now();
        var now = qtimebase.getTimestamp();
        var t2 = Date.now();
        t.ok(t1 <= now && now <= t2);
        t.done();
    },
}
