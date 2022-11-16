import { scheduleCallback } from 'scheduler';
import { createWorkInProgress } from './ReactFiber';
import { beginWork } from './ReactFiberBeginWork';
import { completeWork } from './ReactFiberCompleteWork';

let workInProgress = null;

/**
 * 计划更新root
 * 调度任务
 * @param {*} root
 */
export function scheduleUpdateOnFiber(root) {
  // 确保调度执行root上的更新
  ensureRootIsScheduled(root);
}

function ensureRootIsScheduled(root) {
  // 告诉浏览器,要执行 performConcurrentWorkOnRoot
  scheduleCallback(performConcurrentWorkOnRoot.bind(null, root));
}

/**
 * 1. 根据虚拟DOM构建fiber树
 * 2. 创建真实的DOM节点
 * 3. 把真实DOM插入容器
 * @param {*} root
 */
function performConcurrentWorkOnRoot(root) {
  // 以同步的方式渲染根节点(初次渲染时,都是同步的)
  renderRootSync(root);
  console.log(root);
}

function prepareFreshStack(root) {
  workInProgress = createWorkInProgress(root.current, null);
}
function renderRootSync(root) {
  prepareFreshStack(root);
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
  const next = beginWork(current, unitOfWork);
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
