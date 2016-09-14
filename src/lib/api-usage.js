'use strict'
const os = require('os')
const UsageStats = require('usage-stats')
const testValue = require('test-value')
const fs = require('fs')
const path = require('path')

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

class TrackUsage extends UsageStats {
  /**
   * @param [options] {object}
   */
  constructor (tid, appName, options) {
    options = options || {}
    super(tid, appName, options)
    this.stats = []
    this.dimensionMap = options.dimensionMap || {}
    this.metricMap = options.metricMap || {}
    this.statsPath = path.resolve(this.dir, this.appName + '-stats.json')

    process.on('exit', code => {
      // console.error('exit', code, usageStats)
      this.save()
    })
  }
  /**
   * Track a method invocation.
   */
  hit (dimensions, metrics) {
    let stat = this.stats.find(testValue.where(dimensions))
    if (!stat) {
      stat = dimensions
      stat._metrics = {}
      for (const key of Object.keys(metrics)) {
        stat._metrics[key] = 1
      }
      this.stats.push(stat)
    } else {
      for (const key of Object.keys(metrics)) {
        if (stat._metrics[key]) {
          stat._metrics[key]++
        } else {
          stat._metrics[key] = 1
        }
      }
    }



    // /* Sync */
    // if (method.endsWith('Sync')) {
    //   let hit = usageStats._hits.find(hit => hit.get('cd') === method)
    //   if (!hit) {
    //     usageStats.screenView(method)
    //     hit = usageStats._hits[usageStats._hits.length - 1]
    //   }
    //   if (hit.has('cm1')) {
    //     hit.set('cm1', hit.get('cm1') + 1)
    //   } else {
    //     hit.set('cm1', 1)
    //   }
    //   if (metrics) {
    //     Object.keys(metrics).forEach(option => {
    //       if (metricMap[option]) {
    //         const metric = `cm${metricMap[option]}`
    //         const count = hit.get(metric)
    //         hit.set(metric, count ? count + 1 : 1)
    //       }
    //     })
    //   }
    //
    // /* Async */
    // } else {
    //   usageStats.screenView(method, { hitParams: new Map([[ 'cm1', 1 ]]) })
    //   // console.error(usageStats._hits)
    //   usageStats.end().send()
    //     .then(results => console.error(require('util').inspect(results, { depth: 3, colors: true })))
    //     .catch(err => console.error(err.stack))
    // }
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

  _convertToHits () {
    for (const stat of this.stats) {
      const hit = this.screenView(stat.name)
      for (const key of Object.keys(stat)) {
        if (![ 'name', '_metrics' ].includes(key)){
          const dId = this.dimensionMap[key]
          if (dId) {
            hit.set(`cd${dId}`, stat[key])
          }
        }
      }
      if (stat._metrics) {
        for (const metric of Object.keys(stat._metrics)) {
          const mId = this.metricMap[metric]
          if (mId) {
            hit.set(`cm${mId}`, stat._metrics[metric])
          }
        }
      }
    }
  }

  save () {
    return new Promise((resolve, reject) => {
      fs.writeFile(this.statsPath, JSON.stringify(this.stats), err => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  load () {
    return new Promise((resolve, reject) => {
      fs.readFile(this.statsPath, 'utf8', (err, data) => {
        if (err) reject(err)
        else resolve(JSON.parse(data))
      })
    })
  }
}

module.exports = TrackUsage
