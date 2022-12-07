import {
  NormalPriority as NormalSchedulerPriority,
  ImmediatePriority as ImmediateSchedulerPriority,
  UserBlockingPriority as UserBlockingSchedulerPriority,
  IdlePriority as IdleSchedulerPriority,
  scheduleCallback as Scheduler_scheduleCallback,
  shouldYield,
} from './Scheduler';
import { createWorkInProgress } from './ReactFiber';
import { beginWork } from './ReactFiberBeginWork';
import { completeWork } from './ReactFiberCompleteWork';
import { MutationMask, NoFlags, Passive } from './ReactFiberFlags';
import {
  commitMutationEffectsOnFiber,
  commitPassiveMountEffects,
  commitPassiveUnmountEffects,
  commitLayoutEffects,
} from './ReactFiberCommitWork';
import { printFiber } from 'shared/logger';
import { finishQueueingConcurrentUpdates } from './ReactFiberConcurrentUpdates';
import {
  getHighestPriorityLane,
  getNextLanes,
  markRootUpdated,
  NoLane,
  NoLanes,
  SyncLane,
  includesBlockingLane,
} from './ReactFiberLane';
import {
  getCurrentUpdatePriority,
  lanesToEventPriority,
  DiscreteEventPriority,
  ContinuousEventPriority,
  DefaultEventPriority,
  IdleEventPriority,
  setCurrentUpdatePriority,
} from './ReactEventPriorities';
import { getCurrentEventPriority } from 'react-dom-bindings/src/client/ReactDOMHostConfig';
import { flushSyncCallbacks, scheduleSyncCallback } from './ReactFiberSyncTaskQueue';

let workInProgress = null;
// 此根节点上有没有useEffect类似的副作用
let rootDoesHavePassiveEffect = false;
// 具有useEffect副作用的根节点(FiberRoot)
let rootWithPendingPassiveEffects = null;
let workInProgressRootRenderLanes = NoLanes;

// 枚举值: 构建Fiber树正在进行中
const RootInProgress = 0;
// 枚举值: 构建Fiber树已经完成
const RootCompleted = 5;
// 正在构建中的根节点
let workInProgressRoot = null;
// 当渲染工作停止(结束或者暂停)时,当前的Fiber树处于什么状态(默认是进行中的状态)
// 因为是并发渲染,那么渲染工作可能会暂停,所以需要该变量记录当前Fiber树的构建状态
let workInProgressRootExitStatus = RootInProgress;

/**
 * 计划更新root
 * 调度任务
 * @param {*} root
 */
export function scheduleUpdateOnFiber(root, fiber, lane) {
  markRootUpdated(root, lane);
  // 确保调度执行root上的更新
  ensureRootIsScheduled(root);
}

function ensureRootIsScheduled(root) {
  // 获取当前优先级最高的车道
  const nextLanes = getNextLanes(root, NoLanes);
  // 如果没有要执行的任务
  if (nextLanes === NoLanes) {
    root.callbackNode = null;
    root.callbackPriority = NoLane;
    return;
  }
  // 获取新的调度优先级
  const newCallbackPriority = getHighestPriorityLane(nextLanes);
  // 新的回调任务
  let newCallbackNode;
  // 如果新的优先级是同步的话
  if (newCallbackPriority === SyncLane) {
    // 先把performSyncWorkOnRoot添加到同步队列中
    scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root));
    // 再把flushSyncCallbacks放入微任务队列
    queueMicrotask(flushSyncCallbacks);
    // 如果是同步执行的话,那么它就是个null,因为立刻执行掉了
    newCallbackNode = null;
  } else {
    // 如果不是同步,则需要调度一个新的任务
    let schedulerPriorityLevel;
    switch (lanesToEventPriority(nextLanes)) {
      case DiscreteEventPriority:
        schedulerPriorityLevel = ImmediateSchedulerPriority;
        break;
      case ContinuousEventPriority:
        schedulerPriorityLevel = UserBlockingSchedulerPriority;
        break;
      case DefaultEventPriority:
        schedulerPriorityLevel = NormalSchedulerPriority;
        break;
      case IdleEventPriority:
        schedulerPriorityLevel = IdleSchedulerPriority;
        break;
      default:
        schedulerPriorityLevel = NormalSchedulerPriority;
        break;
    }
    newCallbackNode = Scheduler_scheduleCallback(
      schedulerPriorityLevel,
      performConcurrentWorkOnRoot.bind(null, root),
    );
  }
  root.callbackNode = newCallbackNode;
}

function performSyncWorkOnRoot(root) {
  // 获取最高优先级的lane
  const lanes = getNextLanes(root);
  // 渲染新Fiber树
  renderRootSync(root, lanes);
  // 获取新的渲染完成的Fiber根节点
  const finishedWork = root.current.alternate;
  root.finishedWork = finishedWork;
  commitRoot(root);
  // 如果没有任务了,必须返回null(因为有一个循环根据返回值跳出)
  return null;
}

/**
 * 1. 根据虚拟DOM构建fiber树
 * 2. 创建真实的DOM节点
 * 3. 把真实DOM插入容器
 * @param {*} root
 */
function performConcurrentWorkOnRoot(root, didTimeout) {
  const originalCallbackNode = root.callbackNode;
  const lanes = getNextLanes(root, NoLanes);
  if (lanes === NoLanes) {
    return null;
  }
  // 如果不包含阻塞车道,并且没有超时,就可以并行渲染,需要启用时间分片
  const shouldTimeSlice = !includesBlockingLane(root, lanes) && !didTimeout;
  const exitStatus = shouldTimeSlice
    ? renderRootConcurrent(root, lanes)
    : renderRootSync(root, lanes);
  // 如果渲染完成了
  if (exitStatus !== RootInProgress) {
    const finishedWork = root.current.alternate;
    root.finishedWork = finishedWork;
    commitRoot(root);
  }
  // 因为渲染完成时会把root.callbackNode = null,这里说明root.callbackNode没被清空,也就是渲染没完成,需要继续执行
  if (root.callbackNode === originalCallbackNode) {
    // 任务没完成,则把此函数返回,下次接着执行
    return performConcurrentWorkOnRoot.bind(null, root);
  }
  return null;
}

function renderRootConcurrent(root, lanes) {
  // 因为在构建Fiber树时,此方法会进入多次
  // 加上此判断,是因为,只有在第一次进来的时候才需要创建新的Fiber
  if (workInProgressRoot !== root || workInProgressRootRenderLanes !== lanes) {
    prepareFreshStack(root, lanes);
  }
  // 在当前分配的时间片内执行Fiber树的构建或者渲染
  workLoopConcurrent();
  // 如果workInProgress不为null,说明Fiber树的构建还没有完成
  if (workInProgress !== null) {
    return RootInProgress;
  }
  // 如果workInProgress为null,说明渲染工作完全结束了
  workInProgressRoot = null;
  workInProgressRootRenderLanes = NoLanes;
  return workInProgressRootExitStatus;
}

function workLoopConcurrent() {
  while (workInProgress !== null && !shouldYield()) {
    sleep(6);
    performUnitOfWork(workInProgress);
    console.log('shouldYield()', shouldYield(), workInProgress?.type);
  }
}

function prepareFreshStack(root, lanes) {
  workInProgressRoot = root;
  workInProgress = createWorkInProgress(root.current, null);
  workInProgressRootRenderLanes = lanes;
  finishQueueingConcurrentUpdates();
}
function renderRootSync(root, lanes) {
  //不是一个根，或者是更高优先级的更新
  if (workInProgressRoot !== root || workInProgressRootRenderLanes !== lanes) {
    prepareFreshStack(root, lanes);
  }
  workLoopSync();
  return workInProgressRootExitStatus;
}
function workLoopSync() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}
/**
 * 执行一个工作单元
 * @param {*} unitOfWork
 */
function performUnitOfWork(unitOfWork) {
  // 获取对应的老Fiber
  const current = unitOfWork.alternate;
  const next = beginWork(current, unitOfWork, workInProgressRootRenderLanes);
  unitOfWork.memoizedProps = unitOfWork.pendingProps;
  if (next === null) {
    // 如果没有子结点了,则表示当期那的Fiber已经完成了
    completeUnitOfWork(unitOfWork);
  } else {
    // 如果还有子结点,则让子结点成为下一个工作单元
    workInProgress = next;
  }
}

function completeUnitOfWork(unitOfWork) {
  let completedWork = unitOfWork;
  do {
    const current = completedWork.alternate;
    const returnFiber = completedWork.return;
    completeWork(current, completedWork);
    const siblingFiber = completedWork.sibling;
    // 如果有弟弟,就构建弟弟对应的Fiber链表
    if (siblingFiber !== null) {
      workInProgress = siblingFiber;
      return;
    }
    // 如果没有弟弟,说明当前完成的就是父Fiber的最后一个结点,即该父Fiber的所有子Fiber全都完成了
    completedWork = returnFiber;
    workInProgress = completedWork;
  } while (completedWork !== null);
  // 如果走到了这里,说明整个Fiber树全部构建完毕,要把构建状态设置为完成
  if (workInProgressRootExitStatus === RootInProgress) {
    workInProgressRootExitStatus = RootCompleted;
  }
}

function flushPassiveEffects() {
  if (rootWithPendingPassiveEffects !== null) {
    const root = rootWithPendingPassiveEffects;
    // 执行卸载副作用(destroy)
    commitPassiveUnmountEffects(root.current);
    // 执行挂载副作用(create)
    commitPassiveMountEffects(root, root.current);
  }
}

function commitRoot(root) {
  const previousUpdatePriority = getCurrentUpdatePriority();
  try {
    setCurrentUpdatePriority(DiscreteEventPriority);
    commitRootImpl(root);
  } finally {
    setCurrentUpdatePriority(previousUpdatePriority);
  }
}
// 要注意,一个父结点如果是新的,那么其所有子结点都没有副作用,因为创建之后都已经挂在父结点DOM上了.因此这种情况下只有父结点有副作用
function commitRootImpl(root) {
  const { finishedWork } = root;
  root.callbackNode = null;
  root.callbackPriority = NoLane;
  workInProgressRoot = null;
  workInProgressRootRenderLanes = NoLanes;
  if (
    (finishedWork.subtreeFlags & Passive) !== NoFlags ||
    (finishedWork.flags & Passive) !== NoFlags
  ) {
    if (!rootDoesHavePassiveEffect) {
      rootDoesHavePassiveEffect = true;
      Scheduler_scheduleCallback(NormalSchedulerPriority, flushPassiveEffects);
    }
  }
  const subtreeHasEffects = (finishedWork.subtreeFlags & MutationMask) !== NoFlags;
  const rootHasEffect = (finishedWork.flags & MutationMask) !== NoFlags;
  // 如果自己有副作用,或者子结点有副作用,才进行提交DOM操作
  if (subtreeHasEffects || rootHasEffect) {
    commitMutationEffectsOnFiber(finishedWork, root);
    // 执行layoutEffect
    commitLayoutEffects(finishedWork, root);
    root.current = finishedWork;
    if (rootDoesHavePassiveEffect) {
      rootDoesHavePassiveEffect = false;
      rootWithPendingPassiveEffects = root;
    }
  }
  // DOM变更后,就可以把root的current指向新的Fiber数(即current与workInProgress交换)
  root.current = finishedWork;
}

export function requestUpdateLane() {
  const updateLane = getCurrentUpdatePriority();
  if (updateLane !== NoLanes) {
    return updateLane;
  }
  const eventLane = getCurrentEventPriority();
  return eventLane;
}

// 为了查看并发过程写的方法(源码中没有,可以忽略)
function sleep(time) {
  const timeStamp = new Date().getTime();
  const endTime = timeStamp + time;
  while (true) {
    if (new Date().getTime() > endTime) {
      return;
    }
  }
}
