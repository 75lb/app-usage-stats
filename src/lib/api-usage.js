'use strict'
const version = require('../../package').version
const os = require('os')
const UsageStats = require('usage-stats')
const usageStats = new UsageStats('UA-70853320-4', {
  name: 'jsdoc2md',
  version: version
})
usageStats.defaults
  .set('cd1', process.version)
  .set('cd2', os.type())
  .set('cd3', os.release())
  .set('cd4', 'api')

const metricMap = {
  source: 2,
  configure: 3,
  html: 4,
  template: 5,
  'heading-depth': 6,
  'example-lang': 7,
  plugin: 8,
  helper: 9,
  partial: 10,
  'name-format': 11,
  'no-gfm': 12,
  separators: 13,
  'module-index-format': 14,
  'global-index-format': 15,
  'param-list-format': 16,
  'property-list-format': 17,
  'member-index-format': 18,
  private: 19,
  cache: 20
}

class ApiUsage {
  constructor (iface) {
    this.stats = []
    this.interface = iface
    // usageStats.load()
    process.on('exit', code => {
      // console.error('exit', code, usageStats)
      usageStats.save()
    })
  }
  /**
   * Track a method invocation.
   */
  hit (method, metrics, dimensions) {
    /* Sync */
    if (method.endsWith('Sync')) {
      let hit = usageStats._hits.find(hit => hit.get('cd') === method)
      if (!hit) {
        usageStats.screenView(method)
        hit = usageStats._hits[usageStats._hits.length - 1]
      }
      if (hit.has('cm1')) {
        hit.set('cm1', hit.get('cm1') + 1)
      } else {
        hit.set('cm1', 1)
      }
      if (metrics) {
        Object.keys(metrics).forEach(option => {
          if (metricMap[option]) {
            const metric = `cm${metricMap[option]}`
            const count = hit.get(metric)
            hit.set(metric, count ? count + 1 : 1)
          }
        })
      }

    /* Async */
    } else {
      usageStats.screenView(method, { hitParams: new Map([[ 'cm1', 1 ]]) })
      // console.error(usageStats._hits)
      usageStats.end().send()
        .then(results => console.error(require('util').inspect(results, { depth: 3, colors: true })))
        .catch(err => console.error(err.stack))
    }
  }
  exception (method, options, message) {
    usageStats.exception(message, 1, { hitParams: new Map([
      [ 'cd', method ],
      [ 'cm1', 1 ]
    ])})
    hit = usageStats._hits[usageStats._hits.length - 1]
    if (options) {
      Object.keys(options).forEach(option => {
        if (metricMap[option]) {
          const metric = `cm${metricMap[option]}`
          const count = hit.get(metric)
          hit.set(metric, count ? count + 1 : 1)
        }
      })
    }

    if (!method.endsWith('Sync')) {
      usageStats.end().send()
        .then(results => console.error(require('util').inspect(results, { depth: 3, colors: true })))
        .catch(err => console.error(err.stack))
    }
  }
}

module.exports = ApiUsage
