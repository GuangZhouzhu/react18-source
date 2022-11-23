export function createEventListenerWrapperWithPriority(
  targetContainer,
  domEventName,
  eventSystemFlags,
) {
  const listenerWrapper = dispatchDiscreteEvent;
  return listenerWrapper.bind(null, domEventName, eventSystemFlags, targetContainer);
}

/**
 * 派发离散的时间的监听函数
 * @param {*} domEventName dom原生事件名
 * @param {*} eventSystemFlags 阶段: 0-冒泡,4-捕获
 * @param {*} container 容器(div#root)
 * @param {*} nativeEvent 原生事件
 */
function dispatchDiscreteEvent(domEventName, eventSystemFlags, container, nativeEvent) {
  dispatchEvent(domEventName, eventSystemFlags, container, nativeEvent);
}

export function dispatchEvent(domEventName, eventSystemFlags, targetContainer, nativeEvent) {
  console.log('dispatchEvent', domEventName, eventSystemFlags, targetContainer, nativeEvent);
}