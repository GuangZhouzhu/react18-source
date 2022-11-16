import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import isArray from 'shared/isArray';
import { createFiberFromElement, FiberNode, createFiberFromText } from './ReactFiber';
import { Placement } from './ReactFiberFlags';

/**
 *
 * @param {*} shouldTrackSideEffects 是否跟踪副作用
 * 第一次挂载新结点时,是不用跟踪副作用的,complete阶段会直接把新结点DOM挂到父结点DOM上
 * 当更新有老Fiber的结点时,才会跟踪副作用,并在commitRoot阶段会递归执行副作用
 */
function createChildReconciler(shouldTrackSideEffects) {
  function reconcileSingleElement(returnFiber, currentFirstFiber, element) {
    // 因为现在实现的是初次挂载,currentFirstFiber肯定是没有的,所以可以直接根据虚拟DOM创建新的Fiber结点
    const created = createFiberFromElement(element);
    created.return = returnFiber;
    return created;
  }

  function placeSingleChild(newFiber, newIndex) {
    if (shouldTrackSideEffects) {
      // 要在最后的提交阶段插入此结点
      newFiber.flags |= Placement;
    }
    return newFiber;
  }

  function reconcileSingleTextNode(returnFiber, currentFirstChild, content) {
    const created = new FiberNode(HostText, { content }, null);
    created.return = returnFiber;
    return created;
  }

  function createChild(returnFiber, newChild) {
    if ((typeof newChild === 'string' && newChild !== '') || typeof newChild === 'number') {
      const created = createFiberFromText(`${newChild}`);
      created.return = returnFiber;
      return created;
    }
    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          const created = createFiberFromElement(newChild);
          created.return = returnFiber;
          return created;
        }
        default: {
          break;
        }
      }
    }
    return null;
  }
  function placeChild(newFiber, newIndex) {
    newFiber.index = newIndex;
    if (shouldTrackSideEffects) {
      newFiber.flags |= Placement;
    }
  }
  function reconcileChildrenArray(returnFiber, currentFirstFiber, newChildren) {
    // 需要返回的第一个新儿子
    let resultingFirstChild = null;
    // 上一个新Fiber
    let previousNewFiber = null;
    let newIndex = 0;
    for (; newIndex < newChildren.length; newIndex++) {
      const newFiber = createChild(returnFiber, newChildren[newIndex]);
      if (newFiber === null) {
        continue;
      }
      placeChild(newFiber, newIndex);
      // 如果previousNewFiber为null,说明它是第一个子结点
      if (previousNewFiber === null) {
        resultingFirstChild = newFiber;
      } else {
        previousNewFiber.sibling = newFiber;
      }
      previousNewFiber = newFiber;
    }
    return resultingFirstChild;
  }

  /**
   * 比较子Fibers
   * @param {*} returnFiber 新的父Fiber
   * @param {*} currentFirstChild 老Fiber的第一个子Fiber
   * @param {*} newChild 新的子虚拟DOM
   */
  function reconcileChildFibers(returnFiber, currentFirstChild, newChild) {
    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          return placeSingleChild(reconcileSingleElement(returnFiber, currentFirstChild, newChild));
        }
        default: {
          break;
        }
      }
    }
    if (isArray(newChild)) {
      return reconcileChildrenArray(returnFiber, currentFirstChild, newChild);
    }
    if (typeof newChild === 'string') {
      return placeSingleChild(reconcileSingleTextNode(returnFiber, currentFirstChild, newChild));
    }
    return null;
  }

  return reconcileChildFibers;
}

export const reconcileChildrenFibers = createChildReconciler(true);
export const mountChildFibers = createChildReconciler(false);
