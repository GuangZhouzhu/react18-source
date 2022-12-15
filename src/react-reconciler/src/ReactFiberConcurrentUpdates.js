import { mergeLanes } from './ReactFiberLane';
import { HostRoot } from './ReactWorkTags';

const concurrentQueues = [];
let concurrentQueuesIndex = 0;

// /**
//  * 本来此方法要处理更新优先级的问题
//  * 目前暂时只实现向上找到根节点的逻辑
//  * @param {*} sourceFiber
//  * @returns
//  */
// export function markUpdateLaneFromFiberToRoot(sourceFiber) {
//   let node = sourceFiber;
//   let parent = sourceFiber.return;
//   while (parent !== null) {
//     node = parent;
//     parent = parent.return;
//   }
//   if (node.tag === HostRoot) {
//     const root = node.stateNode;
//     return root;
//   }
//   return null;
// }

/**
 * 把hook的更新对象添加到hook的更新队列中
 * @param {*} fiber 函数组件对应的Fiber
 * @param {*} queue 要更新的hook对应的更新队列
 * @param {*} update 更新对象
 */
export function enqueueConcurrentHookUpdate(fiber, queue, update, lane) {
  enqueueUpdate(fiber, queue, update, lane);
  return getRootForUpdatedFiber(fiber);
}

/**
 * 把更新先缓存到变量中
 * @param {*} fiber
 * @param {*} queue
 * @param {*} update
 */
function enqueueUpdate(fiber, queue, update, lane) {
  concurrentQueues[concurrentQueuesIndex++] = fiber;
  concurrentQueues[concurrentQueuesIndex++] = queue;
  concurrentQueues[concurrentQueuesIndex++] = update;
  concurrentQueues[concurrentQueuesIndex++] = lane;
  fiber.lanes = mergeLanes(fiber.lanes, lane);
  const alternate = fiber.alternate;
  if (alternate !== null) {
    alternate.lanes = mergeLanes(alternate.lanes, lane);
  }
}

function getRootForUpdatedFiber(sourceFiber) {
  let node = sourceFiber;
  let parent = node.return;
  while (parent !== null) {
    node = parent;
    parent = node.return;
  }
  return node.tag === HostRoot ? node.stateNode : null;
}

export function finishQueueingConcurrentUpdates() {
  const endIndex = concurrentQueuesIndex;
  concurrentQueuesIndex = 0;
  let i = 0;
  while (i < endIndex) {
    const fiber = concurrentQueues[i++];
    const queue = concurrentQueues[i++];
    const update = concurrentQueues[i++];
    const lane = concurrentQueues[i++];
    if (queue !== null && update !== null) {
      const pending = queue.pending;
      if (pending === null) {
        update.next = update;
      } else {
        update.next = pending.next;
        pending.next = update;
      }
      queue.pending = update;
    }
  }
}

/**
 * 把更新入队
 * @param {*} fiber 入队的Fiber(RootFiber)
 * @param {*} queue sharedQueue
 * @param {*} update 待入队的更新
 * @param {*} lane 此更新的车道
 */
export function enqueueConcurrentClassUpdate(fiber, queue, update, lane) {
  enqueueUpdate(fiber, queue, update, lane);
  return getRootForUpdatedFiber(fiber);
}
