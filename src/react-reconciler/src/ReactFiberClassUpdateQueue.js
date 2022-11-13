import { markUpdateLaneFromFiberToRoot } from './ReactFiberConcurrentUpdates';

export const UpdateState = 0;
export const ReplaceState = 1;
export const ForceUpdate = 2;
export const CaptureUpdate = 3;

export function initialUpdateQueue(fiber) {
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
