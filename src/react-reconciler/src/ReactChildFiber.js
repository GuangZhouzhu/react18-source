import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import isArray from 'shared/isArray';
import {
  createFiberFromElement,
  FiberNode,
  createFiberFromText,
  createWorkInProgress,
} from './ReactFiber';
import { ChildDeletion, Placement } from './ReactFiberFlags';
import { HostText } from './ReactWorkTags';

/**
 *
 * @param {*} shouldTrackSideEffects 是否跟踪副作用
 * 第一次挂载新结点时,是不用跟踪副作用的,complete阶段会直接把新结点DOM挂到父结点DOM上
 * 当更新有老Fiber的结点时,才会跟踪副作用,并在commitRoot阶段会递归执行副作用
 */
function createChildReconciler(shouldTrackSideEffects) {
  function useFiber(fiber, pendingProps) {
    const clone = createWorkInProgress(fiber, pendingProps);
    clone.index = 0;
    clone.sibling = null;
    return clone;
  }
  function deleteChild(returnFiber, childToDelete) {
    if (!shouldTrackSideEffects) {
      return;
    }
    const deletions = returnFiber.deletions;
    if (deletions === null) {
      returnFiber.deletions = [childToDelete];
      returnFiber.flags |= ChildDeletion;
    } else {
      deletions.push(childToDelete);
    }
  }
  /**
   * 删除从currentFirstChild之后的所有Fiber节点
   * @param {*} returnFiber
   * @param {*} currentFirstChild
   * @returns
   */
  function deleteRemainingChildren(returnFiber, currentFirstChild) {
    if (!shouldTrackSideEffects) {
      return;
    }
    let childToDelete = currentFirstChild;
    while (childToDelete !== null) {
      deleteChild(returnFiber, childToDelete);
      childToDelete = childToDelete.sibling;
    }
    return null;
  }
  function reconcileSingleElement(returnFiber, currentFirstChild, element) {
    // 新虚拟DOM的key
    const key = element.key;
    // 老组件的Fiber
    let child = currentFirstChild;
    while (child !== null) {
      // 判断老Fiber对应的key和新虚拟DOM对象的key是否一致
      if (child.key === key) {
        const elementType = element.type;
        // 老Fiber对应的类型和新虚拟DOM的类型是否相同
        if (child.type === elementType) {
          deleteRemainingChildren(returnFiber, child.sibling);
          // 如果key一样,类型也一样,则认为此Fiber结点可以复用
          const existing = useFiber(child, element.props);
          existing.return = returnFiber;
          return existing;
        }
        // 如果key一样,类型不一样,则不能复用此Fiber,需要把剩下的其他老Fiber全部删除
        deleteRemainingChildren(returnFiber, child);
        break;
      } else {
        deleteChild(returnFiber, child);
      }
      child = child.sibling;
    }
    // 因为现在实现的是初次挂载,currentFirstChild肯定是没有的,所以可以直接根据虚拟DOM创建新的Fiber结点
    const created = createFiberFromElement(element);
    created.return = returnFiber;
    return created;
  }

  function placeSingleChild(newFiber, newIndex) {
    if (shouldTrackSideEffects && newFiber.alternate === null) {
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
  function placeChild(newFiber, lastPlacedIndex, newIndex) {
    newFiber.index = newIndex;
    if (!shouldTrackSideEffects) {
      return lastPlacedIndex;
    }
    const current = newFiber.alternate;
    // 如果有老Fiber,说明他是复用的老Fiber,那么更新的节点就行了,不需要插入
    if (current !== null) {
      const oldIndex = current.index;
      if (oldIndex < lastPlacedIndex) {
        newFiber.flags |= Placement;
        return lastPlacedIndex;
      } else {
        return oldIndex;
      }
    } else {
      // 如果没有老Fiber,说明这是一个新节点,需要插入
      newFiber.flags |= Placement;
      return lastPlacedIndex;
    }
  }
  function updateSlot(returnFiber, oldFiber, newChild) {
    const key = oldFiber !== null ? oldFiber.key : null;
    if (newChild !== null && typeof newChild === 'object') {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          if (newChild.key === key) {
            return updateElement(returnFiber, oldFiber, newChild);
          }
        }
        default: {
          return null;
        }
      }
    }
  }
  function updateElement(returnFiber, current, element) {
    const elementType = element.type;
    if (current !== null) {
      if (current.type === elementType) {
        const existing = useFiber(current, element.props);
        existing.return = returnFiber;
        return existing;
      }
    }
    const created = createFiberFromElement(element);
    created.return = returnFiber;
    return created;
  }
  function mapRemainingChildren(returnFiber, currentFirstChild) {
    const existingChildren = new Map();
    let existingChild = currentFirstChild;
    while (existingChild !== null) {
      // 如果有key则用key,没有则使用索引
      if (existingChild.key !== null) {
        existingChildren.set(existingChild.key, existingChild);
      } else {
        existingChildren.set(existingChild.index, existingChild);
      }
      existingChild = existingChild.sibling;
    }
    return existingChildren;
  }
  function updateTextNode(returnFiber, current, textContent) {
    if (current === null || current.tag !== HostText) {
      const created = createFiberFromText(textContent);
      created.return = returnFiber;
      return created;
    } else {
      const existing = useFiber(current, textContent);
      existing.return = returnFiber;
      return existing;
    }
  }
  function updateFromMap(existingChildren, returnFiber, newIndex, newChild) {
    if ((typeof newChild === 'string' && newChild !== '') || typeof newChild === 'number') {
      const matchedFiber = existingChildren.get(newIndex) || null;
      return updateTextNode(returnFiber, matchedFiber, '' + newChild);
    }
    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          const matchedFiber =
            existingChildren.get(newChild.key === null ? newIndex : newChild.key) || null;
          return updateElement(returnFiber, matchedFiber, newChild);
        }
      }
    }
    return null;
  }
  function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren) {
    // 需要返回的第一个新儿子
    let resultingFirstChild = null;
    // 上一个新Fiber
    let previousNewFiber = null;
    // 用来遍历新的虚拟DOM的索引
    let newIndex = 0;
    // 第一个老Fiber
    let oldFiber = currentFirstChild;
    // 下一个老Fiber
    let nextOldFiber = null;
    // 上一个不需要移动的老节点的索引
    let lastPlacedIndex = 0;

    // 开始第一轮循环
    for (; oldFiber !== null && newIndex < newChildren.length; newIndex++) {
      // 先暂存下一个老Fiber
      nextOldFiber = oldFiber.sibling;
      // 尝试更新或者复用老Fiber
      const newFiber = updateSlot(returnFiber, oldFiber, newChildren[newIndex]);
      if (newFiber === null) {
        break;
      }
      if (shouldTrackSideEffects) {
        // 如果有老Fiber,但是新Fiber没有成功复用老Fiber和老的真实DOM,则需要删除老Fiber(提交阶段会删除真实DOM)
        if (oldFiber && newFiber.alternate === null) {
          deleteChild(returnFiber, oldFiber);
        }
      }
      // 指定新Fiber的位置
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIndex);
      if (previousNewFiber === null) {
        resultingFirstChild = newFiber;
      } else {
        previousNewFiber.sibling = newFiber;
      }
      previousNewFiber = newFiber;
      oldFiber = nextOldFiber;
    }

    if (newIndex === newChildren.length) {
      deleteRemainingChildren(returnFiber, oldFiber);
      return resultingFirstChild;
    }
    if (oldFiber === null) {
      for (; newIndex < newChildren.length; newIndex++) {
        const newFiber = createChild(returnFiber, newChildren[newIndex]);
        if (newFiber === null) {
          continue;
        }
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIndex);
        if (previousNewFiber === null) {
          resultingFirstChild = newFiber;
        } else {
          previousNewFiber.sibling = newFiber;
        }
        previousNewFiber = newFiber;
      }
    }
    // 处理移动节点的情况
    const existingChildren = mapRemainingChildren(returnFiber, oldFiber);
    for (; newIndex < newChildren.length; newIndex++) {
      const newFiber = updateFromMap(
        existingChildren,
        returnFiber,
        newIndex,
        newChildren[newIndex],
      );
      if (newFiber !== null) {
        if (shouldTrackSideEffects) {
          if (newFiber.alternate !== null) {
            existingChildren.delete(newFiber.key === null ? newIndex : newFiber.key);
          }
        }
        // 指定新Fiber的存放位置,并且给lastPlacedIndex赋新值
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIndex);
        if (previousNewFiber === null) {
          resultingFirstChild = newFiber;
        } else {
          previousNewFiber.sibling = newFiber;
        }
        previousNewFiber = newFiber;
      }
    }
    if (shouldTrackSideEffects) {
      // 等全部处理完成后,删除所有map中剩下的老Fiber
      existingChildren.forEach((child) => deleteChild(returnFiber, child));
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
