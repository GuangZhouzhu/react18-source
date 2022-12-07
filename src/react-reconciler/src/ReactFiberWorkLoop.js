import {
  NormalPriority as NormalSchedulerPriority,
  ImmediatePriority as ImmediateSchedulerPriority,
  UserBlockingPriority as UserBlockingSchedulerPriority,
  IdlePriority as IdleSchedulerPriority,
  scheduleCallback as Scheduler_scheduleCallback,
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
let workInProgressRoot = null;
// 此根节点上有没有useEffect类似的副作用
let rootDoesHavePassiveEffect = false;
// 具有useEffect副作用的根节点(FiberRoot)
let rootWithPendingPassiveEffects = null;
let workInProgressRootRenderLanes = NoLanes;

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
  // 获取新的调度优先级
  let newCallbackPriority = getHighestPriorityLane(nextLanes);
  // 如果新的优先级是同步的话
  if (newCallbackPriority === SyncLane) {
    // 先把performSyncWorkOnRoot添加到同步队列中
    scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root));
    // 再把flushSyncCallbacks放入微任务队列
    queueMicrotask(flushSyncCallbacks);
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
    Scheduler_scheduleCallback(
      schedulerPriorityLevel,
      performConcurrentWorkOnRoot.bind(null, root),
    );
  }
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
  const lanes = getNextLanes(root, NoLanes);
  if (lanes === NoLanes) {
    return null;
  }
  const shouldTimeSlice = !includesBlockingLane(root, lanes) && !didTimeout;
  if (shouldTimeSlice) {
    renderRootConcurrent(root, lanes);
  } else {
    renderRootSync(root, lanes);
  }
  const finishedWork = root.current.alternate;
  root.finishedWork = finishedWork;
  commitRoot(root);
}

function renderRootConcurrent(root, lanes) {
  console.log(root, lanes);
}

function prepareFreshStack(root, lanes) {
  workInProgress = createWorkInProgress(root.current, null);
  workInProgressRootRenderLanes = lanes;
  finishQueueingConcurrentUpdates();
}
function renderRootSync(root, lanes) {
  prepareFreshStack(root, lanes);
  workLoopSync();
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
