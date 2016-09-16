'use strict'
const os = require('os')
const UsageStats = require('usage-stats')
const testValue = require('test-value')
const fs = require('fs')
const path = require('path')

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
    this._lastSentPath = path.resolve(this.dir, this.appName + '-lastSent.json')
    this.sendInterval = options.sendInterval
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

    if (this.sendInterval) {
      const lastSent = this._getLastSent()
      if (Date.now() - lastSent >= this.sendInterval) {
        this._setLastSent(Date.now())
        this._convertToHits()
        return this.send()
      } else {
        return Promise.resolve([])
      }
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

    /* send async exceptions immediately */
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

  saveSync () {
    fs.writeFileSync(this.statsPath, JSON.stringify(this.stats))
  }

  load () {
    return new Promise((resolve, reject) => {
      fs.readFile(this.statsPath, 'utf8', (err, data) => {
        if (err) reject(err)
        else resolve(JSON.parse(data))
      })
    })
  }

  loadSync () {
    try {
      this.stats = JSON.parse(fs.readFileSync(this.statsPath, 'utf8'))
    } catch (err) {
      if (err.code === 'ENOENT') {
        return []
      } else {
        throw err
      }
    }
  }

  _getLastSent () {
    let lastSent
    try {
      lastSent = JSON.parse(fs.readFileSync(this._lastSentPath, 'utf8'))
    } catch (err) {
      if (err.code !== 'ENOENT') throw err
      lastSent = Date.now()
      this._setLastSent(lastSent)
    }
    return lastSent
  }

  _setLastSent (lastSent) {
    fs.writeFileSync(this._lastSentPath, JSON.stringify(lastSent))
  }
}

module.exports = TrackUsage
