var css = require('sheetify')
var choo = require('choo')
var persist = require('choo-persist')
var store = require('./stores/items')

css('tachyons')

var app = choo()
if (process.env.NODE_ENV !== 'production') {
  app.use(require('choo-devtools')())
} else {
  // Enable once you want service workers support. At the moment you'll
  // need to insert the file names yourself & bump the dep version by hand.
  // app.use(require('choo-service-worker')())
}

app.use(store)
app.use(persist())

app.route('/', require('./views/main'))
app.route('/*', require('./views/404'))

if (!module.parent) app.mount('div')
else module.exports = app
