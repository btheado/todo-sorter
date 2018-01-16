const R = require('ramda')
module.exports = store

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
      {title: 'child1'},
      {title: 'child2'},
      {title: 'child1.1'},
      {title: 'child1.2'},
      {title: 'child2.1'},
      {title: 'child2.2'},
      {title: 'child1.1.1'}
  ]
  console.log(JSON.stringify(state.item_list[0]))

  var child1 = idx => idx * 2 + 1
  var child2 = idx => idx * 2 + 2
  var parent = idx => Math.floor(Math.abs(idx - 1) / 2)
  var isleaf = (idx, list) => child1(idx) >= list.length
  var depth = idx => Math.floor(Math.log2(idx + 1))
  var relativeidx = idx => idx === 0 ? 1 : (idx + 1) % 2 + 1
  var ancestorsAndSelf = idx => R.reverse(R.scan(parent, idx, R.range(0, depth(idx))))
  var path = idx => R.map(relativeidx, ancestorsAndSelf(idx)).join('.')
  var addBinaryTreeFields = R.addIndex(R.map)((item, idx) => Object.assign({
    id: idx,
    child1: child1(idx),
    child2: child2(idx),
    parent: parent(idx),
    path: path(idx)
  }, item))
  state.R = R

  function listToBinaryTree (list, idx = 0) {
    if (idx < list.length) {
      var item = list[idx]
      var children = [
        listToBinaryTree(list, item.child1),
        listToBinaryTree(list, item.child2)
      ].filter(i => i) // Keep only truthy items
      if (children.length > 0) {
        return Object.assign({children: children}, item)
      } else {
        return item
      }
    }
  }
  function markItemsForComparison (itemList) {
    var lastUnsorted = R.pipe(
      R.sortBy(R.prop('path')),
      R.reject(item => item.sorted || isleaf(item.id, itemList)),
      R.last,
      R.prop('id'))(itemList)
    return R.pipe(
      R.adjust(R.assoc('compare', {action: 'item:mark-sorted'}), lastUnsorted),
      R.adjust(R.assoc('collapsed', false), lastUnsorted),
      R.adjust(R.assoc('header', 'Which first?'), lastUnsorted),
      R.adjust(R.assoc('compare', {action: 'item:parent-swap'}), child1(lastUnsorted)),
      R.adjust(R.assoc('collapsed', true), child1(lastUnsorted)),
      R.when(() => child2(lastUnsorted) <= itemList.length,
        R.adjust(R.assoc('compare', {action: 'item:parent-swap'}), child2(lastUnsorted)))
    )
  }
  function recomputeState (state) {
    var itemList = addBinaryTreeFields(state.item_list)
    state.item_tree_root = R.pipe(markItemsForComparison(itemList), listToBinaryTree)(itemList)
    console.log(itemList)
    if (R.reject(item => item.sorted || isleaf(item.id, itemList))(itemList).length === 0) {
      state.work_item = state.item_list[0]
    } else {
      delete state.work_item
    }
  }
  recomputeState(state)

  // When integrating with TW, maybe store as a hash indexed by title? Not sure that makes
  // sense. If doing that, then why not store as attributes on tiddlers instead? Because
  // otherwise I would have to find a way to sync the two lists.

  // Events:
  // Toggle expansion
  // select for sort (prefix click)
  emitter.on('DOMContentLoaded', function () {
    emitter.on('item:toggle-expansion', function (id) {
      state.item_list[id].collapsed = !state.item_list[id].collapsed
      recomputeState(state)
      emitter.emit(state.events.RENDER)
    })
    emitter.on('item:parent-swap', function (id) {
      // The item being promoted is now considered sorted
      var item = state.item_list[id]
      item.sorted = true

      // The old parent is marked unsorted so it can be compared
      // with more descendants
      var itemParent = state.item_list[parent(id)]
      itemParent.sorted = false

      // Swap
      state.item_list[parent(id)] = item
      state.item_list[id] = itemParent

      // The grandparent of the original item marked unsorted
      if (parent(id) !== 0) {
        state.item_list[parent(parent(id))].sorted = false
      }

      // Rebuild tree and re-render
      recomputeState(state)
      emitter.emit(state.events.RENDER)
    })
    emitter.on('item:mark-sorted', function (id) {
      state.item_list[id].sorted = true
      recomputeState(state)
      emitter.emit(state.events.RENDER)
    })
    emitter.on('item:mark-unsorted', function (id) {
      state.item_list[id].sorted = false
      recomputeState(state)
      emitter.emit(state.events.RENDER)
    })
    emitter.on('item:mark-done', function (id) {
      // Move the last item of the list to where the item marked done was and
      // relaunch the sorting for that area of the tree
      state.item_list[id] = state.item_list[state.item_list.length - 1]
      state.item_list[id].sorted = false
      state.item_list.splice(state.item_list.length - 1)
      recomputeState(state)
      emitter.emit(state.events.RENDER)
    })
    emitter.on('item:add-new', function (title) {
      state.item_list.push({title: title})

      // Adding a new item forces sorting choice with parent
      if (state.item_list.length > 1) {
        state.item_list[parent(state.item_list.length - 1)].sorted = false
      }
      recomputeState(state)
      emitter.emit(state.events.RENDER)
    })
  })
}
