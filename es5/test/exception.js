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

runner.test('.hit(dimensions, metrics)', function () {
  var usage = new TrackUsage(tid, 'testsuite');
  usage.hit({ name: 'method1', interface: 'cli' }, { option1: 1, option2: 1 });
  usage.hit({ name: 'method1', interface: 'api' }, { option1: 1, option3: 1 });
  usage.hit({ name: 'method1', interface: 'api' }, { option1: 1 });
  usage.hit({ name: 'method2', interface: 'api' }, { option1: 1, option2: 1 });

  a.deepStrictEqual(usage.unsent.stats, [{
    dimension: {
      name: 'method1',
      interface: 'cli'
    },
    metric: {
      option1: 1,
      option2: 1
    }
  }, {
    dimension: {
      name: 'method1',
      interface: 'api'
    },
    metric: {
      option1: 2,
      option3: 1
    }
  }, {
    dimension: {
      name: 'method2',
      interface: 'api'
    },
    metric: {
      option1: 1,
      option2: 1
    }
  }]);
});