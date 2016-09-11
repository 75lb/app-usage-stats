'use strict'
const TestRunner = require('test-runner')
const ApiUsage = require('../../')
const a = require('core-assert')

const runner = new TestRunner()

runner.test('.hit(dimensions, metrics)', function () {
  const usage = new ApiUsage()

  usage.hit({ name: 'method1', interface: 'cli' }, { option1: true, option2: 'whatever' })
  usage.hit({ name: 'method1', interface: 'api' }, { option1: true, option3: 'whatever' })
  usage.hit({ name: 'method2', interface: 'api' }, { option1: true, option2: 'whatever' })

  a.deepEqual(usage.stats, [
    {
      name: 'method1',
      interface: 'cli',
      metrics: {
        option1: 1, option2: 1
      }
    },
    {
      name: 'method1',
      interface: 'api',
      metrics: {
        option1: 1, option3: 1
      }
    },
    {
      name: 'method2',
      interface: 'api',
      metrics: {
        option1: 1, option2: 1
      }
    },
  ])
})

runner.test('._convertToHits()', function () {

})

runner.test('.save()', function () {

})
