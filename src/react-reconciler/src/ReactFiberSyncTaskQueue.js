import {
  DiscreteEventPriority,
  getCurrentUpdatePriority,
  setCurrentUpdatePriority,
} from './ReactEventPriorities';

// 同步队列
let syncQueue = null;
// 是否正在执行同步队列
let isFlushingSyncQueue = false;

export function scheduleSyncCallback(callback) {
  if (syncQueue === null) {
    syncQueue = [callback];
  } else {
    syncQueue.push(callback);
  }
}

export function flushSyncCallbacks() {
  if (!isFlushingSyncQueue && syncQueue !== null) {
    isFlushingSyncQueue = true;
    let i = 0;
    const previousUpdatePriority = getCurrentUpdatePriority();
    try {
      const isSync = true;
      const queue = syncQueue;
      setCurrentUpdatePriority(DiscreteEventPriority);
      for (; i < queue.length; i++) {
        let callback = queue[i];
        do {
          callback = callback(isSync);
        } while (callback !== null);
      }
      syncQueue = null;
    } finally {
      setCurrentUpdatePriority(previousUpdatePriority);
      isFlushingSyncQueue = false;
    }
  }
  return null;
}
