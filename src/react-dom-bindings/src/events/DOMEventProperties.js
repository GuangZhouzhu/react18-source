import { registerTwoPhaseEvent } from './EventRegistry';

// const simpleEventPluginEvents = [
//   'abort',
//   'auxClick',
//   'cancel',
//   'canPlay',
//   'canPlayThrough',
//   'click',
//   'close',
//   'contextMenu',
//   'copy',
//   'cut',
//   'drag',
//   'dragEnd',
//   'dragEnter',
//   'dragExit',
//   'dragLeave',
//   'dragOver',
//   'dragStart',
//   'drop',
//   'durationChange',
//   'emptied',
//   'encrypted',
//   'ended',
//   'error',
//   'gotPointerCapture',
//   'input',
//   'invalid',
//   'keyDown',
//   'keyPress',
//   'keyUp',
//   'load',
//   'loadedData',
//   'loadedMetadata',
//   'loadStart',
//   'lostPointerCapture',
//   'mouseDown',
//   'mouseMove',
//   'mouseOut',
//   'mouseOver',
//   'mouseUp',
//   'paste',
//   'pause',
//   'play',
//   'playing',
//   'pointerCancel',
//   'pointerDown',
//   'pointerMove',
//   'pointerOut',
//   'pointerOver',
//   'pointerUp',
//   'progress',
//   'rateChange',
//   'reset',
//   'resize',
//   'seeked',
//   'seeking',
//   'stalled',
//   'submit',
//   'suspend',
//   'timeUpdate',
//   'touchCancel',
//   'touchEnd',
//   'touchStart',
//   'volumeChange',
//   'scroll',
//   'toggle',
//   'touchMove',
//   'waiting',
//   'wheel',
// ];
const simpleEventPluginEvents = ['click'];

export const topLevelEventsToReactNames = new Map();

export function registerSimpleEvents() {
  for (let i = 0; i < simpleEventPluginEvents.length; i++) {
    const eventName = simpleEventPluginEvents[i];
    const domEventName = eventName.toLowerCase();
    const capitalizeEvent = eventName[0].toUpperCase() + eventName.slice(1);
    registerSimpleEvent(domEventName, `on${capitalizeEvent}`);
  }
}

function registerSimpleEvent(domEventName, reactName) {
  topLevelEventsToReactNames.set(domEventName, reactName);
  registerTwoPhaseEvent(reactName, [domEventName]);
}
