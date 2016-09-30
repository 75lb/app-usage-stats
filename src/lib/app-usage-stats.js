'use strict'
const os = require('os')
const UsageStats = require('usage-stats')
const fs = require('fs')
const path = require('path')
const testValue = require('test-value')
const arrayify = require('array-back')
const Stats = require('./stats')

/**
 * A convention for tracking javascript application usage.
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
   * @param [options] {object}
   * @param [options.dimensionMap] {object} - A custom dimension name to ID Map.
   * @param [options.metricMap] {object} - A custom metric name to ID Map.
   * @param [options.sendInterval] {object} - If specified, stats will be sent no more frequently than this period.
   */
  constructor (tid, options) {
    options = options || {}
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
     * Queued stats path
     * @type {string}
     */
    this.queuePath = path.resolve(this.dir, tid + '-unsent.json')

    this.dimensionMap = options.dimensionMap || {}
    this.metricMap = options.metricMap || {}
    this._lastSent = Date.now()
    this._lastSentPath = path.resolve(this.dir, tid + '-lastSent.json')
    this.sendInterval = options.sendInterval
  }

  /**
   * Track a hit. The magic dimension `name` will be mapped to a GA screenView.
   * @param {object[]} - dimension-value maps
   * @param {object[]} - metric-value maps
   * @param [options] {object}
   * @param [options.timeout] {number} - A maxium wait period in ms, after which any pending requests will be aborted.
   */
  hit (dimension, metric, options) {
    if (this._disabled) return Promise.resolve([])
    this.unsent.add({ dimension, metric })

    /* call .send() automatically if a sendInterval is set  */
    if (this.sendInterval) {
      if (Date.now() - this._lastSent >= this.sendInterval) {
        return this.send(options)
      } else {
        return Promise.resolve([])
      }
    }
  }

  _convertToHits () {
    for (const stat of this.unsent.stats) {
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
      fs.writeFile(this.queuePath, JSON.stringify(toSave), err => {
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
    fs.writeFileSync(this.queuePath, JSON.stringify(this.unsent.stats))
    this.unsent = new Stats()
    this._saveLastSent()
  }

  /**
   * Load stats
   */
  load () {
    return new Promise((resolve, reject) => {
      fs.readFile(this.queuePath, 'utf8', (err, data) => {
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
      const stats = JSON.parse(fs.readFileSync(this.queuePath, 'utf8'))
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
   * @param [options] {object}
   * @param [options.timeout] {number} - A maxium wait period in ms, after which any pending requests will be aborted.
  */
  send (options) {
    if (this._disabled) return Promise.resolve([])
    this._convertToHits()
    const toSend = clone(this.unsent.stats)
    this.unsent = new Stats()
    this._lastSent = Date.now()
    return super.send(options)
      .then(responses => {
        this.sent.add(toSend)
        return responses
      })
      .catch(err => {
        this.unsent.add(toSend)
        throw err
      })
  }
}

function clone (object) {
  return JSON.parse(JSON.stringify(object))
}

module.exports = AppUsageStats
