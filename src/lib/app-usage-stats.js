'use strict'
const os = require('os')
const UsageStats = require('usage-stats')
const fs = require('fs')
const path = require('path')

/**
 * @module app-usage-stats
 * @example
 * const UsageStats = require('app-usage-stats')
 * const stats = new UsageStats('UA-987654321', 'app-name')
 */

/**
 * @alias module:app-usage-stats
 * @typicalname stats
 */
class AppUsageStats extends UsageStats {
  /**
   * @param {string} - Google Analytics tracking ID
   * @param {string} - App name
   * @param [options] {object}
   * @param [options.dimensionMap] {object} - A custom dimension name to ID Map.
   * @param [options.metricMap] {object} - A custom metric name to ID Map.
   * @param [options.sendInterval] {object} - If specified, stats will be sent no more frequently than this period.
   */
  constructor (tid, appName, options) {
    if (!appName) throw new Error('an appName is required')
    options = options || {}
    options.name = appName
    super(tid, options)
    this.stats = []
    this.dimensionMap = options.dimensionMap || {}
    this.metricMap = options.metricMap || {}
    this.statsPath = path.resolve(this.dir, appName + '-stats.json')
    this._lastSentPath = path.resolve(this.dir, appName + '-lastSent.json')
    this.sendInterval = options.sendInterval
  }

  /**
   * Track a hit.
   * @param {object[]} - dimension-value maps
   * @param {object[]} - metric-value maps
   */
  hit (dimensions, metrics) {
    const testValue = require('test-value')
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

    /* call .send() automatically if a sendInterval is set  */
    if (this.sendInterval) {
      const lastSent = this._getLastSent()
      if (Date.now() - lastSent >= this.sendInterval) {
        return this.send()
      } else {
        return Promise.resolve([])
      }
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

  /**
   * Save stats
   */
  save () {
    return new Promise((resolve, reject) => {
      fs.writeFile(this.statsPath, JSON.stringify(this.stats), err => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  /**
   * Save stats sync.
   */
  saveSync () {
    fs.writeFileSync(this.statsPath, JSON.stringify(this.stats))
  }

  /**
   * Load stats
   */
  load () {
    return new Promise((resolve, reject) => {
      fs.readFile(this.statsPath, 'utf8', (err, data) => {
        if (err) {
          reject(err)
        } else {
          const stats = JSON.parse(data)
          this.stats = stats
          resolve(stats)
        }
      })
    })
  }

  /**
   * Loads stats sync.
   */
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

  /**
   * Send and reset stats.
   */
  send () {
    this._convertToHits()
    return super.send()
      .then(responses => {
        this._setLastSent(Date.now())
        this.stats = []
        return this.save().then(() => responses)
      })
  }
}

module.exports = AppUsageStats
