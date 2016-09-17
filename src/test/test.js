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

runner.test('.hit(dimensions, metrics)', function () {
  const usage = new TrackUsage(tid, 'testsuite')
  usage.hit({ name: 'method1', interface: 'cli' }, { option1: true, option2: 'whatever' })
  usage.hit({ name: 'method1', interface: 'api' }, { option1: true, option3: 'whatever' })
  usage.hit({ name: 'method1', interface: 'api' }, { option1: true })
  usage.hit({ name: 'method2', interface: 'api' }, { option1: true, option2: 'whatever' })

  a.deepStrictEqual(usage.stats, [
    {
      name: 'method1',
      interface: 'cli',
      _metrics: {
        option1: 1, option2: 1
      }
    },
    {
      name: 'method1',
      interface: 'api',
      _metrics: {
        option1: 2, option3: 1
      }
    },
    {
      name: 'method2',
      interface: 'api',
      _metrics: {
        option1: 1, option2: 1
      }
    },
  ])
})

runner.test('._convertToHits()', function () {
  const usage = new TrackUsage(tid, 'testsuite', {
    dimensionMap: {
      name: 'screenview',
      interface: 1
    },
    metricMap: {
      option1: 1,
      option2: 2,
      option3: 3
    }
  })
  usage.hit({ name: 'method1', interface: 'cli' }, { option1: true, option2: 'whatever' })
  usage.hit({ name: 'method1', interface: 'cli' }, { option1: true, option2: 'whatever' })
  usage.hit({ name: 'method1', interface: 'api' }, { option1: true, option3: 'whatever' })
  usage.hit({ name: 'method2', interface: 'api' }, { option1: true, option2: 'whatever' })
  usage._convertToHits()

  a.strictEqual(usage._hits[0].get('t'), 'screenview')
  a.strictEqual(usage._hits[0].get('cd'), 'method1')
  a.strictEqual(usage._hits[0].get('cd1'), 'cli')
  a.strictEqual(usage._hits[0].get('cm1'), 2)
  a.strictEqual(usage._hits[0].get('cm2'), 2)

  a.strictEqual(usage._hits[1].get('t'), 'screenview')
  a.strictEqual(usage._hits[1].get('cd'), 'method1')
  a.strictEqual(usage._hits[1].get('cd1'), 'api')
  a.strictEqual(usage._hits[1].get('cm1'), 1)
  a.strictEqual(usage._hits[1].get('cm3'), 1)

  a.strictEqual(usage._hits[2].get('t'), 'screenview')
  a.strictEqual(usage._hits[2].get('cd'), 'method2')
  a.strictEqual(usage._hits[2].get('cd1'), 'api')
  a.strictEqual(usage._hits[2].get('cm1'), 1)
  a.strictEqual(usage._hits[2].get('cm2'), 1)
})

runner.test('.save() and .load()', function () {
  const usage = new TrackUsage(tid, 'testsuite', { dir: 'tmp/test' })
  usage.hit({ name: 'one' }, { metric: 1 })
  usage.hit({ name: 'one' }, { metric: 1 })
  return usage.save()
    .then(() => {
      fs.readFileSync('tmp/test/testsuite-stats.json')
    })
    .then(() => usage.load())
    .then(stats => {
      a.deepStrictEqual(stats, [
        { name: 'one', _metrics: { metric: 2 }}
      ])
    })
})

runner.test('.hit(): auto-send', function () {
  const usage = new TrackUsage(tid, 'testsuite', { sendInterval: 200, dir: 'tmp/test' })
  return Promise.all([
    usage
      .hit({ name: 'one' }, { metric: 1 })
      .then(responses => a.strictEqual(responses.length, 0)),
    usage
      .hit({ name: 'one' }, { metric: 1 })
      .then(responses => a.strictEqual(responses.length, 0)),
    new Promise((resolve, reject) => {
      setTimeout(() => {
        usage
          .hit({ name: 'one' }, { metric: 1 })
          .then(responses => {
            // console.error(require('util').inspect(responses, { depth: 3, colors: true }))
            a.strictEqual(responses.length, 1)
          })
          .then(resolve)
          .catch(reject)
      }, 210)
    })
  ])
})
