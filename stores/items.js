const R = require('ramda')
module.exports = store

function store (state, emitter) {
  if (!state.hasOwnProperty('item_list')) {
    state.item_list = []
  }
  if (!state.hasOwnProperty('max_tree_size')) {
    state.max_tree_size = 7
  }

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
    var itemLists = R.pipe(
      addBinaryTreeFields,
      R.splitAt(state.max_tree_size),
      R.when(R.pipe(R.last, R.isEmpty, R.not),
        R.zipWith(R.map, [
          R.assoc('arrow', 'down'),
          R.assoc('arrow', 'up')
        ])))(state.item_list)
    state.item_tree_root = R.pipe(markItemsForComparison(itemLists[0]), listToBinaryTree)(itemLists[0])
    state.backlog_list = itemLists[1]
    if (R.reject(item => item.sorted || isleaf(item.id, itemLists[0]))(itemLists[0]).length === 0) {
      state.work_item = state.item_list[0]
    } else {
      delete state.work_item
    }
  }
  recomputeState(state)

  emitter.on('DOMContentLoaded', function () {
    emitter.on('item:toggle-expansion', function (id) {
      state.item_list[id].collapsed = !state.item_list[id].collapsed
      emitter.emit('state-changed')
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
      emitter.emit('state-changed')
    })
    emitter.on('item:mark-sorted', function (id) {
      state.item_list[id].sorted = true
      emitter.emit('state-changed')
    })
    emitter.on('item:mark-unsorted', function (id) {
      state.item_list[id].sorted = false
      emitter.emit('state-changed')
    })
    emitter.on('mark-all-unsorted', function () {
      state.item_list.forEach((item) => delete item.sorted)
      emitter.emit('state-changed')
    })
    emitter.on('item:mark-done', function (id) {
      if (!state.deleted_list) {
        state.deleted_list = []
      }
      state.deleted_list.push(state.item_list.splice(id, 1)[0])
      if (id < state.item_list.length) {
        state.item_list[id].sorted = false
      }
      emitter.emit('state-changed')
    })
    emitter.on('item:add-new', function (title) {
      state.item_list.splice(Math.min(state.max_tree_size, state.item_list.length), 0, {title: title})

      // Adding a new item forces sorting choice with parent
      if (state.item_list.length > 1) {
        state.item_list[parent(state.item_list.length - 1)].sorted = false
      }
      emitter.emit('state-changed')
    })
    emitter.on('item:to-top', function (id) {
      var item = state.item_list.splice(id, 1)[0]
      item.sorted = false
      state.item_list.splice(0, 0, item)
      emitter.emit('state-changed')
    })
    emitter.on('item:to-bottom', function (id) {
      state.item_list[state.max_tree_size].sorted = false
      var item = state.item_list.splice(id, 1)[0]
      state.item_list.push(item)
      emitter.emit('state-changed')
    })
    emitter.on('increase-tree-size', function () {
      // Increase maximum tree size to one level deeper (i.e. one power of two higher)
      state.max_tree_size = Math.pow(2, Math.floor(Math.log2(state.max_tree_size + 1)) + 1) - 1
      emitter.emit('state-changed')
    })
    emitter.on('decrease-tree-size', function () {
      // Decrease maximum tree size to one level shallower (i.e. one power of two lower)
      // Actually decrease by as many levels as needed to make the number of current items
      // in the tree to shrink. So if the max tree size is 127, but there are only 10 items,
      // then shrink max tree size down to 7, instead of 63.
      state.max_tree_size = Math.min(
        Math.max(3, Math.pow(2, Math.ceil(Math.log2(state.max_tree_size + 1)) - 1) - 1),
        Math.max(3, Math.pow(2, Math.ceil(Math.log2(state.item_list.length + 1)) - 1) - 1))
      console.log('hi')
      emitter.emit('state-changed')
    })
  })
  emitter.on('state-changed', function (title) {
    recomputeState(state)
    emitter.emit(state.events.RENDER)
  })
}
