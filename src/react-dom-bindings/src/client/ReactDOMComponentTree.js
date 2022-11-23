const randomKey = Math.random().toString(36).slice(2);
const internalInstanceKey = '__reactFiber$' + randomKey;
const internalPropsKey = '__reactProps$' + randomKey;
const internalContainerInstanceKey = '__reactContainer$' + randomKey;
const internalEventHandlersKey = '__reactEvents$' + randomKey;
const internalEventHandlerListenersKey = '__reactListeners$' + randomKey;
const internalEventHandlesSetKey = '__reactHandles$' + randomKey;
const internalRootNodeResourcesKey = '__reactResources$' + randomKey;
const internalResourceMarker = '__reactMarker$' + randomKey;

/**
 * 提前缓存Fiber结点的实例到DOM结点上
 * @param {*} hostInst
 * @param {*} node
 */
export function precacheFiberNode(hostInst, node) {
  node[internalInstanceKey] = hostInst;
}
/**
 * 从真实的DOM结点上,获取它对应的Fiber结点
 * @param {*} targetNode
 */
export function getClosestInstanceFromNode(targetNode) {
  const targetInst = targetNode[internalInstanceKey];
  if (targetInst) {
    return targetInst;
  }
  return null;
}

export function updateFiberProps(node, props) {
  node[internalPropsKey] = props;
}
export function getFiberCurrentPropsFromNode(node) {
  return node[internalPropsKey] || null;
}
