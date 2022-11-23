import { allNativeEvents } from './EventRegistry';
import * as SimpleEventPlugin from './plugins/SimpleEventPlugin';
import { IS_CAPTURE_PHASE } from './EventSystemFlags';
import { createEventListenerWrapperWithPriority } from './ReactDOMEventListener';
import { addEventCaptureListener, addEventBubbleListener } from './EventListener';
import getEventTarget from './getEventTarget';
import { HostComponent } from 'react-reconciler/src/ReactWorkTags';
import getListener from './getListener';

SimpleEventPlugin.registerEvents();

const listeningMarker = `_reactListening` + Math.random().toString(36).slice(2);

export function listenToAllSupportedEvents(rootContainerElement) {
  if (!rootContainerElement[listeningMarker]) {
    rootContainerElement[listeningMarker] = true;
    allNativeEvents.forEach((domEventName) => {
      listenToNativeEvent(domEventName, true, rootContainerElement);
      listenToNativeEvent(domEventName, false, rootContainerElement);
    });
  }
}

/**
 * 注册原生时间
 * @param {*} domEventName 原生事件名
 * @param {*} isCapturePhaseListener 是否捕获阶段执行
 * @param {*} target 目标DOM节点(div#root容器节点)
 */
export function listenToNativeEvent(domEventName, isCapturePhaseListener, target) {
  // 默认是0,0-冒泡,4-捕获
  let eventSystemFlags = 0;
  if (isCapturePhaseListener) {
    eventSystemFlags |= IS_CAPTURE_PHASE;
  }
  addTrappedEventListener(target, domEventName, eventSystemFlags, isCapturePhaseListener);
}

function addTrappedEventListener(
  targetContainer,
  domEventName,
  eventSystemFlags,
  isCapturePhaseListener,
) {
  const listener = createEventListenerWrapperWithPriority(
    targetContainer,
    domEventName,
    eventSystemFlags,
  );
  if (isCapturePhaseListener) {
    addEventCaptureListener(targetContainer, domEventName, listener);
  } else {
    addEventBubbleListener(targetContainer, domEventName, listener);
  }
}

export function dispatchEventForPluginEventSystem(
  domEventName,
  eventSystemFlags,
  nativeEvent,
  targetInst,
  targetContainer,
) {
  dispatchEventFromPlugins(
    domEventName,
    eventSystemFlags,
    nativeEvent,
    targetInst,
    targetContainer,
  );
}

function dispatchEventFromPlugins(
  domEventName,
  eventSystemFlags,
  nativeEvent,
  targetInst,
  targetContainer,
) {
  const nativeEventTarget = getEventTarget(nativeEvent);
  const dispatchQueue = [];
  extractEvents(
    dispatchQueue,
    domEventName,
    targetInst,
    nativeEvent,
    nativeEventTarget,
    eventSystemFlags,
    targetContainer,
  );
  console.log('dispatchQueue', dispatchQueue);
}

function extractEvents(
  dispatchQueue,
  domEventName,
  targetInst,
  nativeEvent,
  nativeEventTarget,
  eventSystemFlags,
  targetContainer,
) {
  SimpleEventPlugin.extractEvents(
    dispatchQueue,
    domEventName,
    targetInst,
    nativeEvent,
    nativeEventTarget,
    eventSystemFlags,
    targetContainer,
  );
}

export function accumulateSinglePhaseListeners(
  targetFiber,
  reactName,
  nativeEventType,
  isCapturePhase,
) {
  const captureName = reactName + 'Capture';
  const reactEventName = isCapturePhase ? captureName : reactName;
  const listeners = [];
  let instance = targetFiber;
  while (instance !== null) {
    const { stateNode, tag } = instance;
    if (tag === HostComponent && stateNode !== null) {
      if (reactEventName !== null) {
        const listener = getListener(instance, reactEventName);
        if (listener !== null && listener !== undefined) {
          listeners.push(createDispatchListener(instance, listener, stateNode));
        }
      }
    }
    instance = instance.return;
  }
  return listeners;
}

function createDispatchListener(instance, listener, currentTarget) {
  return {
    instance,
    listener,
    currentTarget,
  };
}
