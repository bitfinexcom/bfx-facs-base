# bfx-facs-base

## bootstrap hooks

Some facilities need special setup before other facilites are started. By default,
the bfx-facs-grc, which announces the service to the Grape network is started
later than the other facs.

To run special setup or cleanup tasks before other facs start, use the `start`
option:

```js
const opts = {
  start: (inst, cb) => {
    console.log(inst.db) // do async stuff here
    cb(null)
  }
}
this.setInitFacs([
  ['fac', 'bfx-facs-db-mongo', 'm0', 'm0', opts]
])
```

Example:

On service start, this will print:

```
bfx-facs-first start hook
bfx-facs-second start hook
start0 executed
```

```js
class WrkUtilNetApi extends WrkApi {
  init () {
    super.init()

    this.setInitFacs([
      ['fac', 'bfx-facs-first', 'm0', 'm0', {
        start: (inst, cb) => {
          console.log('bfx-facs-first start hook')
          cb(null)
        }
      }, 0], // prio: 0 (default)
      ['fac', 'bfx-facs-second', 'm0', 'm0', {
        start: (inst, cb) => {
          console.log('bfx-facs-second start hook')
          cb(null)
        }
      }, 1], // prio 1
    ])
  }

  _start0 (cb) {
    console.log('start0 executed')
    cb(null)
  }
}
```
