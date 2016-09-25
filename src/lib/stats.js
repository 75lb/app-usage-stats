'use strict'
const testValue = require('test-value')
const arrayify = require('array-back')

class Stats {
  constructor () {
    this.stats = []
  }
  add (stats) {
    for (const toAdd of arrayify(stats)) {
      let stat = this.stats.find(testValue.where({ dimension: toAdd.dimension }))
      if (!stat) {
        stat = {
          dimension: toAdd.dimension,
          metric: {}
        }
        for (const key of Object.keys(toAdd.metric)) {
          stat.metric[key] = toAdd.metric[key]
        }
        this.stats.push(stat)
      } else {
        for (const key of Object.keys(toAdd.metric)) {
          if (stat.metric[key]) {
            stat.metric[key] += toAdd.metric[key]
          } else {
            stat.metric[key] = toAdd.metric[key]
          }
        }
      }
    }
  }
  remove (stats) {
    for (const toRemove of arrayify(stats)) {
      let stat = this.stats.find(testValue.where({ dimension: toRemove.dimension }))
      if (stat) {
        for (const metricName of Object.keys(toRemove.metric)) {
          if (stat.metric[metricName]) {
            stat.metric[metricName] -= toRemove.metric[metricName]
          }
        }

        const metricTotal = Object.keys(stat.metric).reduce((prev, curr) => {
          return stat.metric[curr] + prev
        }, 0)
        if (metricTotal === 0) {
          this.stats.splice(this.stats.indexOf(stat), 1)
        }
      }
    }
  }
  *[Symbol.iterator]() {
    yield* this.stats
  }
}

module.exports = Stats
