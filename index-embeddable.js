var css = require('sheetify')
var choo = require('choo-detached')
var store = require('./stores/items')

css('tachyons')

module.exports = () => {
  var app = choo()
  // app.use(require('choo-devtools')()) // https://github.com/graforlock/choo-detached/issues/1

  app.use(store)
  app.component(require('./views/main'))
  return app
}
