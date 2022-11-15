import { markUpdateLaneFromFiberToRoot } from './ReactFiberConcurrentUpdates';
import assign from 'shared/assign';

export const UpdateState = 0;
export const ReplaceState = 1;
export const ForceUpdate = 2;
export const CaptureUpdate = 3;

export function initializeUpdateQueue(fiber) {
  // pending是一个单向循环链表: pending一直会指向链表中最后一个结点
  const queue = {
    shared: {
      pending: null,
    },
  };
  fiber.updateQueue = queue;
}

export function createUpdate() {
  const update = { tag: UpdateState };
  return update;
}

export function enqueueUpdate(fiber, update) {
  const updateQueue = fiber.updateQueue;
  const sharedQueue = updateQueue.shared;
  const pending = sharedQueue.pending;
  if (pending === null) {
    update.next = update;
  } else {
    update.next = pending.next;
    pending.next = update;
  }
  updateQueue.shared.pending = update;
  return markUpdateLaneFromFiberToRoot(fiber);
}

/**
 * 根据老状态和更新,计算新状态
 * @param {*} update 更新的对象有多种类型
 * @param {*} prevState
 */
function getStateFromUpdate(update, prevState) {
  switch (update.tag) {
    case UpdateState: {
      const { payload } = update;
      const partialState = payload;
      return assign({}, prevState, partialState);
    }
    default: {
      return prevState;
    }
  }
}

/**
 * 根据老状态和更新队列中的更新,计算最新状态
 * @param {*} workInProgress 要计算的Fiber
 */
export function processUpdateQueue(workInProgress) {
  const queue = workInProgress.updateQueue;
  const pendingQueue = queue.shared.pending;
  if (pendingQueue !== null) {
    // 清除等待生效的更新(先清,后清无所谓,因为该更新已经要生效了,且已经有变量引用了)
    queue.shared.pending = null;
    // 获取更新链表中最后一个更新(update = {payload:{element: h1}})
    const lastPendingUpdate = pendingQueue;
    // 更新链表中的第一个更新
    const firstPendingUpdate = lastPendingUpdate.next;
    // 把更新链表剪开,从循环链表变成一个单向链表
    lastPendingUpdate.next = null;
    // 获取老状态(第一次渲染时为null)
    let newState = workInProgress.memoizedState;
    let update = firstPendingUpdate;
    while (update) {
      // 根据老状态和更新,计算新状态
      newState = getStateFromUpdate(update, newState);
      update = update.next;
    }
    // 把最终计算到的状态赋值给memoizedState
    workInProgress.memoizedState = newState;
  }
}
