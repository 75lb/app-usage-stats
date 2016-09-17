[![view on npm](http://img.shields.io/npm/v/app-usage-stats.svg)](https://www.npmjs.org/package/app-usage-stats)
[![npm module downloads](http://img.shields.io/npm/dt/app-usage-stats.svg)](https://www.npmjs.org/package/app-usage-stats)
[![Build Status](https://travis-ci.org/75lb/app-usage-stats.svg?branch=master)](https://travis-ci.org/75lb/app-usage-stats)
[![Dependency Status](https://david-dm.org/75lb/app-usage-stats.svg)](https://david-dm.org/75lb/app-usage-stats)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](https://github.com/feross/standard)

<a name="module_app-usage-stats"></a>

## app-usage-stats
**Example**  
```js
const UsageStats = require('app-usage-stats')
const stats = new UsageStats('UA-987654321', 'app-name')
```

* [app-usage-stats](#module_app-usage-stats)
    * [AppUsageStats](#exp_module_app-usage-stats--AppUsageStats) ⏏
        * [new AppUsageStats(tid, appName, [options])](#new_module_app-usage-stats--AppUsageStats_new)
        * [.hit(dimensions, metrics)](#module_app-usage-stats--AppUsageStats+hit)
        * [.save()](#module_app-usage-stats--AppUsageStats+save)
        * [.saveSync()](#module_app-usage-stats--AppUsageStats+saveSync)
        * [.load()](#module_app-usage-stats--AppUsageStats+load)
        * [.loadSync()](#module_app-usage-stats--AppUsageStats+loadSync)
        * [.send()](#module_app-usage-stats--AppUsageStats+send)

<a name="exp_module_app-usage-stats--AppUsageStats"></a>

### AppUsageStats ⏏
**Kind**: Exported class  
<a name="new_module_app-usage-stats--AppUsageStats_new"></a>

#### new AppUsageStats(tid, appName, [options])

| Param | Type | Description |
| --- | --- | --- |
| tid | <code>string</code> | Google Analytics tracking ID |
| appName | <code>string</code> | App name |
| [options] | <code>object</code> |  |
| [options.dimensionMap] | <code>object</code> | A custom dimension name to ID Map. |
| [options.metricMap] | <code>object</code> | A custom metric name to ID Map. |
| [options.sendInterval] | <code>object</code> | If specified, stats will be sent no more frequently than this period. |

<a name="module_app-usage-stats--AppUsageStats+hit"></a>

#### stats.hit(dimensions, metrics)
Track a hit.

**Kind**: instance method of <code>[AppUsageStats](#exp_module_app-usage-stats--AppUsageStats)</code>  

| Param | Type | Description |
| --- | --- | --- |
| dimensions | <code>Array.&lt;object&gt;</code> | dimension-value maps |
| metrics | <code>Array.&lt;object&gt;</code> | metric-value maps |

<a name="module_app-usage-stats--AppUsageStats+save"></a>

#### stats.save()
Save stats

**Kind**: instance method of <code>[AppUsageStats](#exp_module_app-usage-stats--AppUsageStats)</code>  
<a name="module_app-usage-stats--AppUsageStats+saveSync"></a>

#### stats.saveSync()
Save stats sync.

**Kind**: instance method of <code>[AppUsageStats](#exp_module_app-usage-stats--AppUsageStats)</code>  
<a name="module_app-usage-stats--AppUsageStats+load"></a>

#### stats.load()
Load stats

**Kind**: instance method of <code>[AppUsageStats](#exp_module_app-usage-stats--AppUsageStats)</code>  
<a name="module_app-usage-stats--AppUsageStats+loadSync"></a>

#### stats.loadSync()
Loads stats sync.

**Kind**: instance method of <code>[AppUsageStats](#exp_module_app-usage-stats--AppUsageStats)</code>  
<a name="module_app-usage-stats--AppUsageStats+send"></a>

#### stats.send()
Send and reset stats.

**Kind**: instance method of <code>[AppUsageStats](#exp_module_app-usage-stats--AppUsageStats)</code>  

* * *

&copy; 2016 Lloyd Brookes \<75pound@gmail.com\>. Documented by [jsdoc-to-markdown](https://github.com/jsdoc2md/jsdoc-to-markdown).
