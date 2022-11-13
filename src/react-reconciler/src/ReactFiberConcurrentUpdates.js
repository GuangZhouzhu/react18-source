import { HostRoot } from './ReactWorkTags';

/**
 * 本来此方法要处理更新优先级的问题
 * 目前暂时只实现向上找到根节点的逻辑
 * @param {*} sourceFiber 
 * @returns 
 */
export function markUpdateLaneFromFiberToRoot(sourceFiber) {
  let node = sourceFiber;
  let parent = sourceFiber.return;
  while (parent !== null) {
    node = parent;
    parent = parent.return;
  }
  if (node.tag === HostRoot) {
    const root = node.stateNode;
    return root;
  }
  return null;
}
