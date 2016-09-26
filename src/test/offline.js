'use strict'
const TestRunner = require('test-runner')
const TrackUsage = require('../../')
const a = require('core-assert')
const fs = require('fs')
const rimraf = require('rimraf')
const mkdirp = require('mkdirp')

const runner = new TestRunner()
const tid = 'UA-70853320-4'

rimraf.sync('tmp/test')
mkdirp.sync('tmp/test')

function delay(time) {
  return new Promise(function (fulfill) {
    setTimeout(fulfill, time)
  })
}

function responseCount (count) {
  return function (responses) {
    a.strictEqual(responses.length, count)
    return responses
  }
}
function unsentCount (usage, count) {
  return function () {
    a.strictEqual(usage.unsent.stats.length, count)
  }
}
function sentCount (usage, count) {
  return function () {
    a.strictEqual(usage.sent.stats.length, count)
  }
}
