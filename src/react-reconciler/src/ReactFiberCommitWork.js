import {
  appendChild,
  insertBefore,
  commitUpdate,
  removeChild,
} from 'react-dom-bindings/src/client/ReactDOMHostConfig';
import { MutationMask, Passive, Placement, Update } from './ReactFiberFlags';
import { HostComponent, HostRoot, HostText, FunctionComponent } from './ReactWorkTags';
import { HasEffect as HookHasEffect, Passive as HookPassive } from './ReactHookEffectTags';

/**
 * 遍历Fiber树,执行所有Fiber上的副作用
 * @param {*} finishedWork 前workInProgress,现current(新的RootFiber)
 * @param {*} root Fiber根
 */
export function commitMutationEffectsOnFiber(finishedWork, root) {
  const current = finishedWork.alternate;
  const flags = finishedWork.flags;
  switch (finishedWork.tag) {
    case HostRoot: {
      // 先递归处理子结点的副作用
      recursivelyTraverseMutationEffects(root, finishedWork);
      // 再处理自己的副作用
      commitReconciliationEffects(finishedWork);
      break;
    }
    case FunctionComponent: {
      // 先递归处理子结点的副作用
      recursivelyTraverseMutationEffects(root, finishedWork);
      // 再处理自己的副作用
      commitReconciliationEffects(finishedWork);
      break;
    }
    case HostComponent: {
      // 先递归处理子结点的副作用
      recursivelyTraverseMutationEffects(root, finishedWork);
      // 再处理自己的副作用
      commitReconciliationEffects(finishedWork);
      // 处理DOM更新
      if (flags & Update) {
        const instance = finishedWork.stateNode;
        if (instance !== null) {
          const newProps = finishedWork.memoizedProps;
          const oldProps = current !== null ? current.memoizedProps : newProps;
          const type = finishedWork.type;
          const updatePayload = finishedWork.updateQueue;
          finishedWork.updateQueue = null;
          if (updatePayload) {
            commitUpdate(instance, updatePayload, type, oldProps, newProps, finishedWork);
          }
        }
      }
      break;
    }
    case HostText: {
      recursivelyTraverseMutationEffects(root, finishedWork);
      commitReconciliationEffects(finishedWork);
      break;
    }
    default: {
      break;
    }
  }
}

/**
 * 递归处理变更的副作用
 * @param {*} root FiberRoot
 * @param {*} parentFiber 父Fiber
 */
function recursivelyTraverseMutationEffects(root, parentFiber) {
  // 先把父Fiber上的需要删除的节点删除
  const deletions = parentFiber.deletions;
  if (deletions !== null) {
    for (let i = 0; i < deletions.length; i++) {
      const childToDelete = deletions[i];
      commitDeletionEffects(root, parentFiber, childToDelete);
    }
  }
  // 再处理剩下的子节点
  if (parentFiber.subtreeFlags & MutationMask) {
    let { child } = parentFiber;
    while (child !== null) {
      commitMutationEffectsOnFiber(child, root);
      child = child.sibling;
    }
  }
}

let hostParent = null;
/**
 * 提交删除副作用
 * @param {*} root FiberRoot
 * @param {*} returnFiber 父Fiber
 * @param {*} deletedFiber 要删除的Fiber
 */
function commitDeletionEffects(root, returnFiber, deletedFiber) {
  let parent = returnFiber;
  // 一直向上查找,直到找到真实DOM节点
  findParent: while (parent !== null) {
    switch (parent.tag) {
      case HostComponent: {
        hostParent = parent.stateNode;
        break findParent;
      }
      case HostRoot: {
        hostParent = parent.stateNode.containerInfo;
        break findParent;
      }
      default: {
        break;
      }
    }
    parent = parent.return;
  }
  commitDeletionEffectsOnFiber(root, returnFiber, deletedFiber);
  hostParent = null;
}

function commitDeletionEffectsOnFiber(finishedRoot, nearestMountedAncestor, deletedFiber) {
  switch (deletedFiber.tag) {
    case HostComponent:
    case HostText: {
      // 当要删除一个节点的时候,要先删除它的子结点,然后再把自己删除
      recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
      // 再把自己删除
      if (hostParent !== null) {
        removeChild(hostParent, deletedFiber.stateNode);
      }
      break;
    }
    default: {
      break;
    }
  }
}
function recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, parent) {
  let child = parent.child;
  while (child !== null) {
    commitDeletionEffectsOnFiber(finishedRoot, nearestMountedAncestor, child);
    child = child.sibling;
  }
}

function commitReconciliationEffects(finishedWork) {
  const { flags } = finishedWork;
  if (flags & Placement) {
    // 该结点有插入操作,则把Fiber对应的真实DOM结点添加到父真实DOM结点上
    commitPlacement(finishedWork);
    // 完成操作后,修改对应标记(相当于删除flags中的Placement二进制位)
    finishedWork.flags &= ~Placement;
  }
}

/**
 * 把此Fiber的真实DOM插入到父DOM中,注意要找到正确的插入位置
 * @param {*} finishedWork
 */
function commitPlacement(finishedWork) {
  // 父结点有可能是虚拟结点(比如函数组件),因此需要递归向上查找到一个真实DOM结点
  const parentFiber = getHostParentFiber(finishedWork);
  switch (parentFiber.tag) {
    case HostComponent: {
      const parent = parentFiber.stateNode;
      const before = getHostSibling(finishedWork);
      insertOrAppendPlacementNode(finishedWork, before, parent);
      break;
    }
    case HostRoot: {
      const parent = parentFiber.stateNode.containerInfo;
      const before = getHostSibling(finishedWork);
      insertOrAppendPlacementNode(finishedWork, before, parent);
      break;
    }
    default: {
      break;
    }
  }
}

/**
 * 查找stateNode为真实DOM的父结点
 * @param {*} fiber
 * @returns
 */
function getHostParentFiber(fiber) {
  let parent = fiber.return;
  while (parent !== null) {
    if (isHostParent(parent)) {
      return parent;
    }
    parent = parent.return;
  }
  return parent;
}

function isHostParent(fiber) {
  return fiber.tag === HostComponent || fiber.tag === HostRoot;
}

/**
 * 找到要插入的位置(找到可以插在它前面的那个Fiber的真实DOM)
 * 其实就是找到与该Fiber相邻的有真实DOM的弟Fiber,这个弟Fiber的DOM的前面,就是该DOM需要插入的位置
 * 如果没找到这个位置,则直接append就行,找到了,就在该DOM前面insert
 * @param {*} fiber
 */
function getHostSibling(fiber) {
  let node = fiber;
  siblings: while (true) {
    while (node.sibling === null) {
      // 当前结点没有弟弟,如果我们是根Fiber或者父亲是原生节点，我们就是最后的弟弟,因此不需要找插入位置,直接append
      if (node.return === null || isHostParent(node.return)) {
        return null;
      }
      node = node.return;
    }
    node = node.sibling;
    // 如果弟结点不是原生节点，试着向下搜索弟的子结点是否有原生结点
    while (node.tag !== HostComponent && node.tag !== HostText) {
      // 如果此结点也是将要插入的新结点,那么这个结点不能用,需要继续找它的弟结点
      if (node.flags & Placement) {
        continue siblings;
      } else {
        node = node.child;
      }
    }
    // 检查此原生节点是否稳定可以放置
    if (!(node.flags & Placement)) {
      return node.stateNode;
    }
  }
}

/**
 * 把子结点对应的真实DOM,插入到父结点DOM中
 * @param {*} node 将要插入的Fiber结点
 * @param {*} parent 父DOM结点
 */
function insertOrAppendPlacementNode(node, before, parent) {
  const { tag } = node;
  // 判断此Fiber结点是不是真实DOM结点
  const isHost = tag === HostComponent || tag === HostText;
  if (isHost) {
    // 如果此Fiber是真实DOM结点,直接插入
    const { stateNode } = node;
    if (before) {
      insertBefore(parent, stateNode, before);
    } else {
      appendChild(parent, stateNode);
    }
  } else {
    // 若此Fiber不是真实DOM结点,则往下找真实的子结点插入
    const { child } = node;
    if (child !== null) {
      insertOrAppendPlacementNode(child, before, parent);
      let { sibling } = child;
      while (sibling !== null) {
        insertOrAppendPlacementNode(sibling, before, parent);
        sibling = sibling.sibling;
      }
    }
  }
}

export function commitPassiveMountEffects(root, finishedWork) {
  commitPassiveMountOnFiber(root, finishedWork);
}
export function commitPassiveUnmountEffects(finishedWork) {
  commitPassiveUnmountOnFiber(finishedWork);
}

function commitPassiveMountOnFiber(finishedRoot, finishedWork) {
  const flags = finishedWork.flags;
  switch (finishedWork.tag) {
    case FunctionComponent: {
      recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork);
      if (flags & Passive) {
        commitHookPassiveMountEffects(finishedWork, HookPassive | HookHasEffect);
      }
      break;
    }
    case HostRoot: {
      recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork);
      break;
    }
    default: {
      break;
    }
  }
}

function commitPassiveUnmountOnFiber(finishedWork) {
  switch (finishedWork.tag) {
    case FunctionComponent: {
      recursivelyTraversePassiveUnmountEffects(finishedWork);
      if (finishedWork.flags & Passive) {
        commitHookPassiveUnmountEffects(
          finishedWork,
          finishedWork.return,
          HookPassive | HookHasEffect,
        );
      }
      break;
    }
    default: {
      recursivelyTraversePassiveUnmountEffects(finishedWork);
      break;
    }
  }
}

function recursivelyTraversePassiveMountEffects(root, parentFiber) {
  if (parentFiber.subtreeFlags & Passive) {
    let child = parentFiber.child;
    while (child !== null) {
      commitPassiveMountOnFiber(root, child);
      child = child.sibling;
    }
  }
}
function recursivelyTraversePassiveUnmountEffects(parentFiber) {
  if (parentFiber.subtreeFlags & Passive) {
    let child = parentFiber.child;
    while (child !== null) {
      commitPassiveUnmountOnFiber(child);
      child = child.sibling;
    }
  }
}

function commitHookPassiveMountEffects(finishedWork, hookFlags) {
  commitHookEffectListMount(hookFlags, finishedWork);
}
function commitHookPassiveUnmountEffects(finishedWork, nearestMountedAncestor, hookFlags) {
  commitHookEffectListUnmount(hookFlags, finishedWork, nearestMountedAncestor);
}

function commitHookEffectListMount(flags, finishedWork) {
  const updateQueue = finishedWork.updateQueue;
  const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
  if (lastEffect !== null) {
    const firstEffect = lastEffect.next;
    let effect = firstEffect;
    do {
      if ((effect.tag & flags) === flags) {
        const create = effect.create;
        effect.destroy = create();
      }
      effect = effect.next;
    } while (effect !== firstEffect);
  }
}
function commitHookEffectListUnmount(flags, finishedWork) {
  const updateQueue = finishedWork.updateQueue;
  const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
  if (lastEffect !== null) {
    const firstEffect = lastEffect.next;
    let effect = firstEffect;
    do {
      if ((effect.tag & flags) === flags) {
        const destroy = effect.destroy;
        if (destroy !== undefined) {
          destroy();
        }
      }
      effect = effect.next;
    } while (effect !== firstEffect);
  }
}
