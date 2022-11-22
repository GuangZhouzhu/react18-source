/**
 * 渲染函数组件
 * @param {*} current 老Fiber
 * @param {*} workInProgress 新Fiber
 * @param {*} Component 组件定义
 * @param {*} props 组件属性
 * @returns 虚拟DOM(ReactElement)
 */
// 暂时这么写,后续会添加hooks逻辑
export function renderWithHooks(current, workInProgress, Component, props) {
  const children = Component(props);
  return children;
}
