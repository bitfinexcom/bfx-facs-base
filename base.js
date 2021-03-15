'use strict'

const EventEmitter = require('events')
const fs = require('fs')
const path = require('path')
const _ = require('lodash')
const async = require('async')

class Facility extends EventEmitter {
  constructor (caller, opts, ctx) {
    super()

    this.name = 'facility'
    this.caller = caller
    this.opts = _.extend({ ns: this.name }, opts)
    this.ctx = ctx
  }

  init () {
    if (this._hasConf) {
      const cal = this.caller

      const fprefix = this.ctx.env === 'test' ? 'test' : ''
      const dirname = path.join(cal.ctx.root, 'config', 'facs')

      let confpath = path.join(dirname, `${this.name}.config.json`)
      const testpath = path.join(dirname, `${fprefix}.${this.name}.config.json`)
      if (fprefix && fs.existsSync(testpath)) {
        confpath = testpath
      }

      const conf = JSON.parse(fs.readFileSync(confpath, 'utf8'))
      this.conf = conf[this.opts.ns]
    }
  }

  set (k, v) {
    this[k] = v
  }

  start (cb) {
    async.series([
      next => {
        this._start0(next)
      },
      next => {
        this.active = 1
        next()
      },
      next => {
        this._start(next)
      },
      next => {
        const start = this.opts.start
        if (!start) return next()
        if (typeof start !== 'function') {
          return next(new Error('opts.start must be of type function'))
        }

        start(this, next)
      }
    ], cb)
  }

  _start0 (cb) { cb() }
  _start (cb) { cb() }

  stop (cb) {
    async.series([
      next => {
        this._stop(next)
      },
      next => {
        this.active = 0
        if (!this.working) return next()

        const itv = setInterval(() => {
          if (this.working) return
          clearInterval(itv)
          next()
        }, 1000)
      },
      next => {
        this._stop9(next)
      }
    ], cb)
  }

  _stop (cb) { cb() }
  _stop9 (cb) { cb() }
}

module.exports = Facility
