var html = require('choo/html')

module.exports = view

// item state fields:
// children
// sorted - not used for any display purposes?
// checkbox prefix/dom element?, sort action: swap vs. noswap
// id/idx?
// expanded/collapsed/leaf and bullet click action
// header - for displaying the question on previous line
// title
function view (item, emit) {
  var children = ''
  var bullet = '•'
  if (item.children) {
    if (item.collapsed) {
      bullet = '►'
    } else {
      bullet = '▼'
      children = html`
        <div class='node-children pl3'>
          ${item.children.map(child => view(child, emit))}
        </div>
      `
    }
  }
  // TODO: header
  return html`
    <div class='node'>
      <div class='prefix dib w1 tc'>${item.prefix}</div>
      <div class='bullet dib w1 tc pointer' onclick=${onBulletClick}>${bullet}</div>
      <div class='headline dib'>${item.title}</div>
      ${children}
    </div>
  `
  function onBulletClick () {
    emit('item:toggle-expansion', item.id)
  }
}
