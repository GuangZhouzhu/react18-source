import {
  HostRoot,
  HostComponent,
  HostText,
  IndeterminateComponent,
  FunctionComponent,
} from './ReactWorkTags';
import { processUpdateQueue, cloneUpdateQueue } from './ReactFiberClassUpdateQueue';
import { mountChildFibers, reconcileChildrenFibers } from './ReactChildFiber';
import { shouldSetTextContent } from 'react-dom-bindings/src/client/ReactDOMHostConfig';
import { renderWithHooks } from './ReactFiberHooks';

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

function updateHostRoot(current, workInProgress, renderLanes) {
  const nextProps = workInProgress.pendingProps;
  cloneUpdateQueue(current, workInProgress);
  // 此方法会赋值: workInProgress.memoizedState = {element}
  processUpdateQueue(workInProgress, nextProps, renderLanes);
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
 * 挂载函数组件
 * @param {*} current 老Fiber
 * @param {*} workInProgress 新Fiber
 * @param {*} Component 组件类型: 也就是函数组件的定义
 */
function mountIndeterminateComponent(current, workInProgress, Component) {
  const props = workInProgress.pendingProps;
  const value = renderWithHooks(current, workInProgress, Component, props);
  workInProgress.tag = FunctionComponent;
  reconcileChildren(current, workInProgress, value);
  return workInProgress.child;
}

function updateFunctionComponent(current, workInProgress, Component, nextProps, renderLanes) {
  const nextChildren = renderWithHooks(current, workInProgress, Component, nextProps, renderLanes);
  reconcileChildren(current, workInProgress, nextChildren);
  return workInProgress.child;
}

/**
 *  根据新虚拟DOM,构建新的Fiber子链表
 * @param {*} current 老Fiber
 * @param {*} workInProgress 新Fiber
 * @returns
 */
export function beginWork(current, workInProgress, renderLanes) {
  // 在构建Fiber树前,先清空当前Fiber的lanes
  workInProgress.lanes = 0;
  switch (workInProgress.tag) {
    case HostRoot: {
      return updateHostRoot(current, workInProgress, renderLanes);
    }
    case HostComponent: {
      return updateHostComponent(current, workInProgress, renderLanes);
    }
    // 处理函数组件和类组件,在这里还区分不了具体是函数组件还是类组件,因此先用这个类型判断
    case IndeterminateComponent: {
      return mountIndeterminateComponent(current, workInProgress, workInProgress.type, renderLanes);
    }
    case FunctionComponent: {
      const Component = workInProgress.type;
      const nextProps = workInProgress.pendingProps;
      return updateFunctionComponent(current, workInProgress, Component, nextProps, renderLanes);
    }
    case HostText:
    default: {
      return null;
    }
  }
}
