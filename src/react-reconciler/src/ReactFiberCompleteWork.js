import logger, { indent } from 'shared/logger';
import { HostRoot, HostComponent, HostText } from './ReactWorkTags';
import {
  createTextInstance,
  createInstance,
  appendInitialChild,
  finalizeInitialChildren,
} from 'react-dom-bindings/src/client/ReactDOMHostConfig';
import { NoFlags } from './ReactFiberFlags';

function bubbleProperties(completedWork) {
  let subtreeFlags = NoFlags;
  // 遍历当前Fiber的所有子结点,把所有子结点的副作用,以及孙子结点的副作用,全部合并subtreeFlags变量
  let child = completedWork.child;
  while (child !== null) {
    subtreeFlags |= child.subtreeFlags;
    subtreeFlags |= child.flags;
    child = child.sibling;
  }
  completedWork.subtreeFlags |= subtreeFlags;
}

/**
 * 把当前完成Fiber的所有子结点对应的真实DOM,都挂载到对应的父DOM结点上
 * @param {*} parent 当前完成的Fiber的真实DOM结点
 * @param {*} workInProgress 当前完成的Fiber
 */
function appendAllChildren(parent, workInProgress) {
  let node = workInProgress.child;
  while (node !== null) {
    if (node.tag === HostComponent || node.tag === HostText) {
      appendInitialChild(parent, node.stateNode);
    } else if (node.child !== null) {
      // 如果儿子不是一个原生结点,那么它可能是一个函数组件或者其他组件
      node = node.child;
      continue;
    }
    if (node === workInProgress) {
      return;
    }
    // 挂载函数组件子结点后,找不到sibling,那么需要返回找父结点的sibling
    while (node.sibling === null) {
      if (node.return === null || node.return === workInProgress) {
        return;
      }
      node = node.return;
    }
    node = node.sibling;
  }
}

/**
 * 完成一个Fiber结点
 * @param {*} current 老Fiber
 * @param {*} workInProgress 新构建的Fiber
 */
export function completeWork(current, workInProgress) {
  indent.number -= 2;
  logger(' '.repeat(indent.number) + 'completeWork', workInProgress);
  const newProps = workInProgress.pendingProps;
  switch (workInProgress.tag) {
    case HostComponent: {
      /// 此处暂时只处理初次挂载的情况,后续会添加更新的逻辑
      // 如果完成的是原生html节点
      const { type } = workInProgress;
      const instance = createInstance(type, newProps, workInProgress);
      // 把所有自己的儿子都添加到自己身上
      appendAllChildren(instance, workInProgress);
      workInProgress.stateNode = instance;
      finalizeInitialChildren(instance, type, newProps);
      bubbleProperties(workInProgress);
      break;
    }
    case HostRoot: {
      bubbleProperties(workInProgress);
      break;
    }
    case HostText: {
      // 如果完成的Fiber节点是文本节点,那么创建真实的文本DOM
      const newText = newProps;
      // 创建真实DOM结点,并传给stateNode属性
      workInProgress.stateNode = createTextInstance(newText);
      // 向上冒泡属性
      bubbleProperties(workInProgress);
      break;
    }
    default: {
      break;
    }
  }
}
