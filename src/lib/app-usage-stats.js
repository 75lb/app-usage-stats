'use strict'
const os = require('os')
const UsageStats = require('usage-stats')
const fs = require('fs')
const path = require('path')
const testValue = require('test-value')
const arrayify = require('array-back')
const Stats = require('./stats')

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

    /**
     * Current totals not yet sent
     * @type {object[]}
     */
    this.unsent = new Stats()

    /**
     * Current totals not yet sent
     * @type {object[]}
     */
    this.sent = new Stats()

    /**
     * Persisted stats path
     * @type {string}
     */
    this.statsPath = path.resolve(this.dir, appName + '-stats.json')

    this.dimensionMap = options.dimensionMap || {}
    this.metricMap = options.metricMap || {}
    this._lastSent = Date.now()
    this._lastSentPath = path.resolve(this.dir, appName + '-lastSent.json')
    this.sendInterval = options.sendInterval
  }

  /**
   * Track a hit. The magic dimension `name` will be mapped to a GA screenView.
   * @param {object[]} - dimension-value maps
   * @param {object[]} - metric-value maps
   */
  hit (dimension, metric) {
    this.unsent.add({ dimension, metric })

    /* call .send() automatically if a sendInterval is set  */
    if (this.sendInterval) {
      if (Date.now() - this._lastSent >= this.sendInterval) {
        return this.send()
      } else {
        return Promise.resolve([])
      }
    }
  }

  _convertToHits () {
    for (const stat of this.unsent) {
      const hit = this.screenView(stat.dimension.name)
      for (const key of Object.keys(stat.dimension)) {
        if (![ 'name' ].includes(key)){
          const dId = this.dimensionMap[key]
          if (dId) {
            hit.set(`cd${dId}`, stat.dimension[key])
          }
        }
      }
      if (stat.metric) {
        for (const metric of Object.keys(stat.metric)) {
          const mId = this.metricMap[metric]
          if (mId) {
            hit.set(`cm${mId}`, stat.metric[metric])
          }
        }
      }
    }
  }

  /**
   * Save stats
   */
  save () {
    const toSave = this.unsent.stats.slice()
    return new Promise((resolve, reject) => {
      fs.writeFile(this.statsPath, JSON.stringify(toSave), err => {
        if (err) {
          reject(err)
        } else {
          this.unsent.remove(toSave)
          this._saveLastSent()
          resolve()
        }
      })
    })
  }

  /**
   * Save stats sync.
   */
  saveSync () {
    fs.writeFileSync(this.statsPath, JSON.stringify(this.unsent.stats))
    this.unsent = new Stats()
    this._saveLastSent()
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
          this.unsent.add(stats)
          this._loadLastSent()
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
      const stats = JSON.parse(fs.readFileSync(this.statsPath, 'utf8'))
      this.unsent.add(stats)
    } catch (err) {
      if (err.code !== 'ENOENT') {
        throw err
      }
    }
    this._loadLastSent()
  }

  _loadLastSent () {
    let lastSent
    try {
      lastSent = JSON.parse(fs.readFileSync(this._lastSentPath, 'utf8'))
    } catch (err) {
      if (err.code !== 'ENOENT') throw err
      lastSent = Date.now()
    }
    this._lastSent = lastSent
  }

  _saveLastSent () {
    fs.writeFileSync(this._lastSentPath, JSON.stringify(this._lastSent))
  }

  /**
   * Send and reset stats.
   */
  send () {
    this._convertToHits()
    const toSend = clone(this.unsent.stats)
    this._lastSent = Date.now()
    return super.send()
      .then(responses => {
        this.unsent.remove(toSend)
        this.sent.add(toSend)
        return responses
      })
  }
}

function clone (object) {
  return JSON.parse(JSON.stringify(object))
}

module.exports = AppUsageStats
