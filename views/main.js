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

  var exportLink = html`
    <a download='state.json' href=${'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state))}>Export data</a>
  `

  function changeMaxTreeSize (maxTreeSize, totalItemCount) {
    var hideShrink = (maxTreeSize > 3 && totalItemCount > 3) ? '' : 'visibility:hidden'
    var hideGrow = (totalItemCount > maxTreeSize) ? '' : 'visibility:hidden'
    return html`
      <div class='pl1'>
        <div class='dib tc pointer' style=${hideShrink} onclick=${onShrinkClick}>↑</div>
        <div class='dib tc pointer' style=${hideGrow} onclick=${onGrowClick}>↓</div>
      </div>
    `
  }

  return html`
    <div>
    ${workItem}
    <div class="treedisplay ma1 outline">
      ${state.item_tree_root ? itemView(state.item_tree_root, emit) : ''}
      ${changeMaxTreeSize(state.max_tree_size, state.item_list.length)}
    </div>
    <div class="backlogdisplay">
      ${state.backlog_list ? state.backlog_list.map(item => itemView(item, emit)) : ''}
    </div>
    <input type="text" placeholder="Enter new task here" class="w5" onkeydown=${onKeyDown}/>
    ${exportLink}
    </div>
  `
  function onKeyDown (e) {
    if (e.key === 'Enter' && e.target.value !== '') {
      emit('item:add-new', e.target.value)
    }
  }
  function onShrinkClick () {
    emit('decrease-tree-size')
  }
  function onGrowClick () {
    emit('increase-tree-size')
  }
}
