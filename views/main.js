var html = require('choo/html')
var itemView = require('./item.js')

var TITLE = '🚂🚋🚋do-sorter'

module.exports = view

function view (state, emit) {
  if (state.title !== TITLE) emit(state.events.DOMTITLECHANGE, TITLE)

  var workItem = ''
  if (state.work_item) {
    workItem = html`
      <p>
      Work on '${state.work_item.title}'
      <button onclick=${() => emit('item:mark-done', 0)}>Done</button>
      <button onclick=${() => emit('item:mark-unsorted', 0)}>Done for now</button>
      </p>
    `
  }

  return html`
    <body>
    ${workItem}
    <div class="treedisplay">
      ${itemView(state.item_tree_root, emit)}
    </div>
    </body>
  `
}
