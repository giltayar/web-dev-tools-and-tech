'use strict'
const path = require('path')
const {describe, it, before, after} = require('mocha')
const {expect} = require('chai')
const fetch = require('node-fetch')
const {dockerComposeTool, getAddressForService} = require('docker-compose-mocha')

const app = require('../..')

describe('currency-backend it', function() {
  this.retries(global.v8debug || /--inspect/.test(process.execArgv.join(' ')) ? 0 : 3)
  const composePath = path.join(__dirname, 'docker-compose.yml')

  const envName = dockerComposeTool(before, after, composePath, {
    shouldPullImages: !!process.env.NODE_ENV && process.env.NODE_ENV !== 'development',
    brutallyKill: true,
  })

  const {baseUrl} = setupApp(app, envName, composePath)

  it.only('should wait and let me play with stuff', async () => {
    console.log(`Start testing at ${baseUrl()}`)
    await require('util').promisify(setTimeout)(20000000)
  })

  it('should return OK on /', async () => {
    const response = await fetch(`${baseUrl()}/`)

    expect(response.status).to.equal(200)
    expect(await response.text()).to.equal('OK')
  })

  it('should return a correct list of currencies', async () => {
    const response = await fetch(`${baseUrl()}/currencies`)

    expect(response.status).to.equal(200)
    expect(await response.json()).to.eql([
      'AUD',
      'BGN',
      'BRL',
      'CAD',
      'CHF',
      'CNY',
      'CZK',
      'DKK',
      'GBP',
      'HKD',
      'HRK',
      'HUF',
      'IDR',
      'ILS',
      'INR',
      'JPY',
      'KRW',
      'MXN',
      'MYR',
      'NOK',
      'NZD',
      'PHP',
      'PLN',
      'RON',
      'RUB',
      'SEK',
      'SGD',
      'THB',
      'TRY',
      'USD',
      'ZAR',
    ])
  })

  it('should return a correct list of rates', async () => {
    const response = await fetch(`${address()}/rates?base=ILS&date=2010-10-10&symbols=EUR,USD`)

    expect(response.status).to.equal(200)
    expect(await response.json()).to.eql({
      EUR: 0.24176,
      USD: 0.28583,
    })
  })
})

function setupApp(app, envName, composePath) {
  let server

  before(async () => {
    const configuration = {
      redisAddress: await getAddressForService(envName, composePath, 'redis', 6379),
      sessionSecret: 'hush-hush',
      userServiceAddress: await getAddressForService(envName, composePath, 'user-service', 80),
      frontendAddress: await getAddressForService(envName, composePath, 'currency-frontend', 80),
    }

    await new Promise((resolve, reject) => {
      server = app(configuration).listen(err => (err ? reject(err) : resolve()))
    })
  })
  after(done => server.close(done))

  return {
    baseUrl: () => `http://localhost:${server.address().port}`,
    address: () => `localhost:${server.address().port}`,
  }
}
