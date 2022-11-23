export const allNativeEvents = new Set();

/**
 * 注册两个阶段的事件
 * @param {*} registrationName React事件名,如: onClick
 * @param {*} dependencies 原生事件数组,如: ['click','drag']
 */
export function registerTwoPhaseEvent(registrationName, dependencies) {
  registerDirectEvent(registrationName, dependencies);
  registerDirectEvent(registrationName + 'Capture', dependencies);
}

export function registerDirectEvent(registrationName, dependencies) {
  for (let i = 0; i < dependencies.length; i++) {
    allNativeEvents.add(dependencies[i]);
  }
}
