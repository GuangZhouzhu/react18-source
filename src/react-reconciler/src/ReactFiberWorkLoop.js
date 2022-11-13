import { scheduleCallback } from 'scheduler';
import { createWorkInProgress } from './ReactFiber';

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
  scheduleCallback(performConcurrentWorkOnRoot.bind(null, root));
}

/**
 * 1. 根据虚拟DOM构建fiber树
 * 2. 创建真实的DOM节点
 * 3. 把真实DOM插入容器
 * @param {*} root
 */
function performConcurrentWorkOnRoot(root) {
  // 以同步的方式渲染根节点,初次渲染时,都是同步的
  renderRootSync(root);
}

function prepareFreshStack(root) {
  workInProgress = createWorkInProgress(root.current, null);
  console.log(workInProgress);
}
function renderRootSync(root) {
  prepareFreshStack(root);
}
