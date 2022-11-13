// 此处暂时先这样实现,后面会实现一个优先队列
export function scheduleCallback(callback) {
  requestIdleCallback(callback);
}
