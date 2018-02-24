var html = require('choo/html')

module.exports = view

function view (item, emit) {
  var children = ''
  var bullet = '•'
  if (item.children) {
    if (item.collapsed) {
      bullet = '►'
    } else {
      bullet = '▼'

      // Recursively construct the descendants
      children = html`
        <div class='node-children pl3'>
          ${item.children.map(child => view(child, emit))}
        </div>
      `
    }
  }
  var arrow = ''
  if (item.arrow === 'up') {
    arrow = html`<div class='arrow dib w1 tc pointer' title='send to top' onclick=${onArrowClick}>↑</div>`
  } else if (item.arrow === 'down') {
    arrow = html`<div class='arrow dib w1 tc pointer' title='send to bottom' onclick=${onArrowClick}>↓</div>`
  }
  var prefix = ''
  if (item.compare) {
    prefix = html`<input type=checkbox onclick=${onPrefixClick}></input>`
  }
  return html`
    <div class='node'>
      <div class='header'><b>${item.header}</b></div>
      <div class='prefix dib w1 tc'>${prefix}</div>
      <div class='bullet dib w1 tc pointer' onclick=${onBulletClick}>${bullet}</div>
      <div class='checkmark dib w1 tc pointer' title='mark item complete' onclick=${onCheckmarkClick}>✓</div>
      ${arrow}
      <div class='headline dib'>${item.title}</div>
      ${children}
    </div>
  `
  function onBulletClick () {
    emit('item:toggle-expansion', item.id)
  }
  function onPrefixClick () {
    emit(item.compare.action, item.id)
  }
  function onCheckmarkClick () {
    emit('item:mark-done', item.id)
  }
  function onArrowClick () {
    if (item.arrow === 'up') {
      emit('item:to-top', item.id)
    } else {
      emit('item:to-bottom', item.id)
    }
  }
}
