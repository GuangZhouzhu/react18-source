import { createFiberRoot } from './ReactFiberRoot';
import { createUpdate, enqueueUpdate } from './ReactFiberClassUpdateQueue';
import { scheduleUpdateOnFiber } from './ReactFiberWorkLoop';

export function createContainer(containerInfo) {
  return createFiberRoot(containerInfo);
}

/**
 * 更新容器,把虚拟DOM变成真实DOM插入到container容器中
 * @param {*} element 虚拟DOM
 * @param {*} container DOM容器(FiberRootNode,containerInfo,div#root)
 */
export function updateContainer(element, container) {
  // 获取当前的根fiber
  const current = container.current;
  const update = createUpdate();
  // 把要更新的虚拟DOM放进update里
  update.payload = { element };
  // 把此更新对象添加到current这个根Fiber的更新队列里
  const root = enqueueUpdate(current, update);
  scheduleUpdateOnFiber(root);
}
