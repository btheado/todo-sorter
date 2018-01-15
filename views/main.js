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
      ${state.item_tree_root ? itemView(state.item_tree_root, emit) : ''}
    </div>
    <input type="text" placeholder="Enter new task here" class="w5" onkeydown=${onKeyDown}/>
    </body>
  `
  function onKeyDown (e) {
    if (e.key === 'Enter' && e.target.value !== '') {
      emit('item:add-new', e.target.value)
    }
  }
}
