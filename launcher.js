'use strict'

const path = require('path')
const debug = require('debug')('smart-restart:launcher')

const natives = process.binding('natives')

process.on('message', options => {
  debug('message received')
  const main = path.resolve(options.main)
  const module = require('module')
  const _load_orig = module._load
  module._load = function(name, parent, isMain) {
    const file = module._resolveFilename(name, parent)
    if (
      (options.includeModules || file.indexOf('node_modules') < 0) &&
      !natives[file] &&
      file !== main
    ) {
      debug('sending message: ', { file, parent: parent.id })
      process.send({ file, parent: parent.id })
    } else {
      debug('ignoring module: ', name)
    }
    return _load_orig(name, parent, isMain)
  }
  require(main)
})

debug('sending message: ', { status: 'ready' })
process.send({ status: 'ready' })

function handleError(err) {
  const message = { err: (err != null ? err.stack : void 0) || err }
  debug('sending message: ', message)
  process.send(message)
  process.exit()
}

process.on('uncaughtException', handleError)
process.on('unhandledRejection', handleError)
