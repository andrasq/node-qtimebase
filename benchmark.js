/**
 * Copyright (C) 2015-2016 Andras Radics
 * Licensed under the Apache License, Version 2.0
 */

'use strict';

var qtimebase = require('./');
var qtimeit = require('qtimeit');

var x;

qtimeit.bench.timeGoal = 2;
qtimeit.bench({
    'Date.now': function() { x = Date.now() },
    'getTimestamp': function() { x = qtimebase.getTimestamp() },
});
