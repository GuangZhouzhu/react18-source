import logger, { indent } from 'shared/logger';
import { HostRoot, HostComponent, HostText } from './ReactWorkTags';
import { processUpdateQueue } from './ReactFiberClassUpdateQueue';
import { mountChildFibers, reconcileChildrenFibers } from './ReactChildFiber';
import { shouldSetTextContent } from 'react-dom-bindings/src/client/ReactDOMHostConfig';

/**
 * 根据新的虚拟DOM,生成新的Fiber链表
 * @param {*} current 老的父Fiber
 * @param {*} workInProgress 新的父Fiber
 * @param {*} nextChildren 新的子虚拟DOM
 */
function reconcileChildren(current, workInProgress, nextChildren) {
  // 如果没有老Fiber,说明是新增的结点
  if (current === null) {
    workInProgress.child = mountChildFibers(workInProgress, null, nextChildren);
  } else {
    // 如果有老Fiber,说明是更新已有的结点, 则需要进行DOM-DIFF
    // 拿老的子Fiber链表和新的子虚拟DOM进行比较,进行最小化更新
    workInProgress.child = reconcileChildrenFibers(workInProgress, current.child, nextChildren);
  }
}

function updateHostRoot(current, workInProgress) {
  // 此方法会赋值: workInProgress.memoizedState = {element}
  processUpdateQueue(workInProgress);
  const nextState = workInProgress.memoizedState;
  // 新的子虚拟DOM
  const nextChildren = nextState.element;
  // 协调子结点: 根据新的虚拟DOM,生成子Fiber链表(DOM-DIFF算法在里面)
  reconcileChildren(current, workInProgress, nextChildren);
  return workInProgress.child;
}

/**
 * 构建原生组件的子Fiber链表
 * @param {*} current 老Fiber
 * @param {*} workInProgress 新Fiber
 */
function updateHostComponent(current, workInProgress) {
  const { type } = workInProgress;
  const nextProps = workInProgress.pendingProps;
  let nextChildren = nextProps.children;
  // 判断当期虚拟DOM的子结点,是不是只有一个文本结点
  const isDirectTextChild = shouldSetTextContent(type, nextProps);
  if (isDirectTextChild) {
    nextChildren = null;
  }
  reconcileChildren(current, workInProgress, nextChildren);
  return workInProgress.child;
}

/**
 *  根据新虚拟DOM,构建新的Fiber子链表
 * @param {*} current 老Fiber
 * @param {*} workInProgress 新Fiber
 * @returns
 */
export function beginWork(current, workInProgress) {
  logger(' '.repeat(indent.number) + 'beginWork', workInProgress);
  indent.number += 2;
  switch (workInProgress.tag) {
    case HostRoot: {
      return updateHostRoot(current, workInProgress);
    }
    case HostComponent: {
      return updateHostComponent(current, workInProgress);
    }
    case HostText: {
      return null;
    }
    default: {
      return null;
    }
  }
}
