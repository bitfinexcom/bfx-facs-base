'use strict'

const { test } = require('brittle')
const tmp = require('test-tmp')
const path = require('path')
const fs = require('fs')

const Facility = require('../base')

function createFacility (dir, env) {
  const caller = { ctx: { root: dir } }
  const fac = new Facility(caller, {}, { env })
  fac._hasConf = true
  return fac
}

async function setupDir (t) {
  const dir = await tmp(t)
  fs.mkdirSync(path.join(dir, 'config', 'facs'), { recursive: true })
  return dir
}

function writeConfig (dir, filename, content) {
  const filePath = path.join(dir, 'config', 'facs', filename)
  const data = filename.endsWith('.js') ? content : JSON.stringify(content)
  fs.writeFileSync(filePath, data)
}

test('JSON config resolution', async (t) => {
  await t.test('loads base JSON config if env is not provided', async (t) => {
    const dir = await setupDir(t)
    writeConfig(dir, 'facility.config.json', { facility: { key: 'value' } })
    writeConfig(dir, 'production.facility.config.json', { facility: { key: 'env-specific' } })

    const fac = createFacility(dir)
    fac.init()
    t.alike(fac.conf, { key: 'value' })
  })

  await t.test('loads env-specific JSON config over base others', async (t) => {
    const dir = await setupDir(t)
    writeConfig(dir, 'facility.config.json', { facility: { key: 'base' } })
    writeConfig(dir, 'production.facility.config.json', { facility: { key: 'prod-env-specific' } })
    writeConfig(dir, 'development.facility.config.json', { facility: { key: 'dev-env-specific' } })

    const fac = createFacility(dir, 'production')
    fac.init()
    t.is(fac.conf.key, 'prod-env-specific')
  })

  await t.test('falls back to base JSON if env-specific JSON is missing', async (t) => {
    const dir = await setupDir(t)
    writeConfig(dir, 'facility.config.json', { facility: { key: 'base' } })

    const fac = createFacility(dir, 'production')
    fac.init()
    t.is(fac.conf.key, 'base')
  })
})

test('JS config resolution', async (t) => {
  await t.test('loads base JS config when no JSON exists', async (t) => {
    const dir = await setupDir(t)
    writeConfig(dir, 'facility.config.js', "module.exports = { facility: { key: 'from-js' } }")

    const fac = createFacility(dir)
    fac.init()
    t.is(fac.conf.key, 'from-js')
  })

  await t.test('loads env-specific JS config when no JSON exists and env is provided', async (t) => {
    const dir = await setupDir(t)
    writeConfig(dir, 'development.facility.config.js', "module.exports = { facility: { key: 'dev-env-js' } }")
    writeConfig(dir, 'production.facility.config.js', "module.exports = { facility: { key: 'prod-js' } }")

    const fac = createFacility(dir, 'development')
    fac.init()
    t.is(fac.conf.key, 'dev-env-js')
  })

  await t.test('falls back to base JS if env-specific JS is missing and no JSON exists', async (t) => {
    const dir = await setupDir(t)
    writeConfig(dir, 'facility.config.js', "module.exports = { facility: { key: 'base-js' } }")

    const fac = createFacility(dir, 'production')
    fac.init()
    t.is(fac.conf.key, 'base-js')
  })
})

test('config priority order', async (t) => {
  await t.test('JSON config takes priority over JS config', async (t) => {
    const dir = await setupDir(t)
    writeConfig(dir, 'facility.config.json', { facility: { source: 'json' } })
    writeConfig(dir, 'facility.config.js', "module.exports = { facility: { source: 'js' } }")

    const fac = createFacility(dir)
    fac.init()
    t.is(fac.conf.source, 'json')
  })

  await t.test('env-specific JSON has highest priority', async (t) => {
    const dir = await setupDir(t)
    writeConfig(dir, 'production.facility.config.json', { facility: { source: 'env-json' } })
    writeConfig(dir, 'facility.config.json', { facility: { source: 'base-json' } })
    writeConfig(dir, 'production.facility.config.js', "module.exports = { facility: { source: 'env-js' } }")
    writeConfig(dir, 'facility.config.js', "module.exports = { facility: { source: 'base-js' } }")

    const fac = createFacility(dir, 'production')
    fac.init()
    t.is(fac.conf.source, 'env-json')
  })
})
