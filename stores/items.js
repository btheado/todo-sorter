module.exports = store

function listToBinaryTree (list, idx = 0) {
  if (idx < list.length) {
    let child1 = idx * 2 + 1
    let child2 = idx * 2 + 2
    var children = []
    if (child1 < list.length) {
      children.push(listToBinaryTree(list, child1))
    }
    if (child2 < list.length) {
      children.push(listToBinaryTree(list, child2))
    }
    if (children.length > 0) {
      return Object.assign(list[idx], {id: idx, children: children})
    } else {
      return Object.assign(list[idx], {id: idx})
    }
  }
}

function store (state, emitter) {
  /*
  state.item_tree_root = {
    title: 'root',
    id: 0,
    children: [
      {title: 'child1', id: 1, prefix: 'h'},
      {title: 'child2', id: 2, collapsed: true, children: [{title: 'child2.1', id: 3}, {title: 'child2.2', id: 4}]},
      {title: 'child3', id: 5, children: [{title: 'child3.1', id: 6}, {title: 'child3.2', id: 7}]}
    ]
  }
  */
  state.item_list = [
      {title: 'root'},
      {title: 'child1', prefix: 'h'},
      {title: 'child2', collapsed: true},
      {title: 'child1.1'},
      {title: 'child1.2'},
      {title: 'child2.1'},
      {title: 'child2.2'},
      {title: 'child1.1.1'}
  ]
  console.log(listToBinaryTree(state.item_list))
  state.item_tree_root=listToBinaryTree(state.item_list)

  // When integrating with TW, maybe store as a hash indexed by title? Not sure that makes
  // sense. If doing that, then why not store as attributes on tiddlers instead? Because
  // otherwise I would have to find a way to sync the two lists.

  // Events:
  // Toggle expansion
  // select for sort (prefix click)
  emitter.on('DOMContentLoaded', function () {
    emitter.on('item:toggle-expansion', function (id) {
      state.item_list[id].collapsed = !state.item_list[id].collapsed
      state.item_tree_root=listToBinaryTree(state.item_list)
      emitter.emit(state.events.RENDER)
    })
  })
}
