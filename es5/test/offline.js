'use strict';

var TestRunner = require('test-runner');
var TrackUsage = require('../../');
var a = require('core-assert');
var fs = require('fs');
var rimraf = require('rimraf');
var mkdirp = require('mkdirp');

var runner = new TestRunner();
var tid = 'UA-70853320-4';

rimraf.sync('tmp/test');
mkdirp.sync('tmp/test');

function delay(time) {
  return new Promise(function (fulfill) {
    setTimeout(fulfill, time);
  });
}

function responseCount(count) {
  return function (responses) {
    a.strictEqual(responses.length, count);
    return responses;
  };
}
function unsentCount(usage, count) {
  return function () {
    a.strictEqual(usage.unsent.stats.length, count);
  };
}
function sentCount(usage, count) {
  return function () {
    a.strictEqual(usage.sent.stats.length, count);
  };
}