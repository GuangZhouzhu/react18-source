import { createHostRootFiber } from './ReactFiber';
import { initializeUpdateQueue } from './ReactFiberClassUpdateQueue';
import { NoLane, NoLanes, createLaneMap, NoTimestamp } from './ReactFiberLane';

function FiberRootNode(containerInfo) {
  this.containerInfo = containerInfo;
  // 此根上有哪些车道等待被处理
  this.pendingLanes = NoLanes;
  this.callbackNode = null;
  this.callbackPriority = NoLane;
  // 过期时间(存放每个车道的过期时间)
  this.expirationTimes = createLaneMap(NoTimestamp);
  // 过期的车道
  this.expiredLanes = NoLanes;
}

export function createFiberRoot(containerInfo) {
  const root = new FiberRootNode(containerInfo);
  // hostRoot指的是根节点div#root
  const uninitializedFiber = createHostRootFiber();
  // 根容器的current指向根Fiber
  root.current = uninitializedFiber;
  // 根Fiber的stateNode指向根容器(也就是真实的DOM节点)
  uninitializedFiber.stateNode = root;
  initializeUpdateQueue(uninitializedFiber);
  return root;
}
