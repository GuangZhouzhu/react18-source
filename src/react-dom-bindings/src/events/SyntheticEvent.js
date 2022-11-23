import assign from 'shared/assign';

function functionThatReturnsTrue() {
  return true;
}
function functionThatReturnsFalse() {
  return false;
}
const MouseEventInterface = {
  clientX: 0,
  clientY: 0,
};
function createSyntheticEvent(Interface) {
  /**
   * 合成事件的基类
   * @param {*} reactName react属性名,如: onClick
   * @param {*} reactEventType react事件类型,如: click
   * @param {*} targetInst 事件源对应的Fiber实例
   * @param {*} nativeEvent 原生事件对象
   * @param {*} nativeEventTarget 事件源DOM,比如: <span>
   * @returns
   */
  function SyntheticBaseEvent(
    reactName,
    reactEventType,
    targetInst,
    nativeEvent,
    nativeEventTarget,
  ) {
    this._reactName = reactName;
    this.type = reactEventType;
    this._targetInst = targetInst;
    this.nativeEvent = nativeEvent;
    this.target = nativeEventTarget;
    // 根据传入接口的属性名,把原生事件的属性拷贝到合成事件上
    for (const propName in Interface) {
      if (!Interface.hasOwnProperty(propName)) {
        continue;
      }
      this[propName] = nativeEvent[propName];
    }
    this.isDefaultPrevented = functionThatReturnsFalse;
    this.isPropagationStopped = functionThatReturnsFalse;
    return this;
  }

  assign(SyntheticBaseEvent.prototype, {
    preventDefault() {
      const event = this.nativeEvent;
      if (event.preventDefault) {
        event.preventDefault();
      } else {
        event.returnValue = false;
      }
      this.isDefaultPrevented = functionThatReturnsTrue;
    },
    stopPropagation() {
      const event = this.nativeEvent;
      if (event.stopPropagation) {
        event.stopPropagation();
      } else {
        event.cancelBubble = true;
      }
      this.isPropagationStopped = functionThatReturnsTrue;
    },
  });
  return SyntheticBaseEvent;
}
export const SyntheticMouseEvent = createSyntheticEvent(MouseEventInterface);
