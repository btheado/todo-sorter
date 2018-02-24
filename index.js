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

app.use(persist({
  // These are the only fields which need to be saved, the rest are either
  // for temporary data or recomputed/derived from these fields
  filter: (state) => {
    return {
      item_list: state.item_list,
      deleted_list: state.deleted_list,
      max_tree_size: state.max_tree_size
    }
  }}))
app.use(store)

app.route('/', require('./views/main'))
app.route('/*', require('./views/404'))

if (!module.parent) {
  document.body.appendChild(document.createElement('div'))
  app.mount('div')
} else module.exports = app
