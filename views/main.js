var html = require('choo/html')
var itemView = require('./item.js')

var TITLE = '🚂🚋🚋do-sorter'

module.exports = view

function view (state, emit) {
  if (state.title !== TITLE) emit(state.events.DOMTITLECHANGE, TITLE)

  // TODO: add 'work on X' (and done/done for now buttons) when there are no comparisons to perform
  return html`
    <body>
    <div class="treedisplay">
      ${itemView(state.item_tree_root, emit)}
    </div>
    </body>
  `
}
