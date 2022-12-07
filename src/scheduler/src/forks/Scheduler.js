import { peek, pop, push } from 'scheduler/src/SchedulerMinHeap';
import {
  ImmediatePriority,
  UserBlockingPriority,
  NormalPriority,
  LowPriority,
  IdlePriority,
} from 'scheduler/src/SchedulerPriorities';
import { frameYieldMs } from '../SchedulerFeatureFlags';

// Max 31 bit integer. The max integer size in V8 for 32-bit systems.
// Math.pow(2, 30) - 1
// 0b111111111111111111111111111111
var maxSigned31BitInt = 1073741823;
// 立刻过期级别的过期时间(单位毫秒ms)
var IMMEDIATE_PRIORITY_TIMEOUT = -1;
// Eventually times out(阻塞用户操作级别的过期时间)
var USER_BLOCKING_PRIORITY_TIMEOUT = 250;
// 正常优先级的过期时间
var NORMAL_PRIORITY_TIMEOUT = 5000;
// 低优先级的过期时间
var LOW_PRIORITY_TIMEOUT = 10000;
// 永不过期
var IDLE_PRIORITY_TIMEOUT = maxSigned31BitInt;

// 任务的最小堆
const taskQueue = [];
// 任务ID计数器
let taskIdCounter = 1;
let scheduledHostCallback = null;
let startTime = -1;
let currentTask = null;
// 一帧的空闲时间(官方定义为5ms)
// React每一帧向浏览器申请5ms用于自己任务的执行
// 如果5ms内没有完成, React会放弃控制权, 把控制权交还给浏览器
const frameInterval = frameYieldMs;
const channel = new MessageChannel();
var port = channel.port2;
channel.port1.onmessage = performWorkUntilDeadline;

function getCurrentTime() {
  return performance.now();
}

function performWorkUntilDeadline() {
  if (scheduledHostCallback !== null) {
    startTime = getCurrentTime();
    let hasMoreWork = true;
    try {
      hasMoreWork = scheduledHostCallback(startTime);
    } finally {
      if (hasMoreWork) {
        schedulePerformWorkUntilDeadline();
      } else {
        scheduledHostCallback = null;
      }
    }
  }
}

function unstable_scheduleCallback(priorityLevel, callback) {
  // 获取当前的时间
  const currentTime = getCurrentTime();
  // 此任务的开始时间
  const startTime = currentTime;
  let timeout;
  switch (priorityLevel) {
    case ImmediatePriority:
      timeout = IMMEDIATE_PRIORITY_TIMEOUT;
      break;
    case UserBlockingPriority:
      timeout = USER_BLOCKING_PRIORITY_TIMEOUT;
      break;
    case IdlePriority:
      timeout = IDLE_PRIORITY_TIMEOUT;
      break;
    case LowPriority:
      timeout = LOW_PRIORITY_TIMEOUT;
      break;
    case NormalPriority:
    default:
      timeout = NORMAL_PRIORITY_TIMEOUT;
      break;
  }
  // 计算次任务的过期时间
  const expirationTime = startTime + timeout;
  const newTask = {
    // 任务id(一个自增变量,表示任务进来的先后顺序)
    id: taskIdCounter++,
    // 回调函数(任务函数)
    callback,
    // 优先级别
    priorityLevel,
    // 任务的开始时间
    startTime,
    // 任务的过期时间
    expirationTime,
    // 排序依赖
    sortIndex: -1,
  };
  newTask.sortIndex = expirationTime;
  // 往最小堆中添加任务,排序的依据是过期时间
  push(taskQueue, newTask);
  // 开始执行taskQueue中的所有任务
  requestHostCallback(flushWork);
  return newTask;
}

function requestHostCallback(flushWork) {
  scheduledHostCallback = flushWork;
  schedulePerformWorkUntilDeadline();
}

function schedulePerformWorkUntilDeadline() {
  port.postMessage(null);
}
/**
 * 开始执行任务队列中的任务
 * @param {*} initialTime
 */
function flushWork(initialTime) {
  return workLoop(initialTime);
}

function workLoop(initialTime) {
  let currentTime = initialTime;
  // 取出优先级最高的任务
  currentTask = peek(taskQueue);
  while (currentTask !== null) {
    if (currentTask.expirationTime > currentTime && shouldYieldToHost()) {
      break;
    }
    const callback = currentTask.callback;
    if (typeof callback === 'function') {
      currentTask.callback = null;
      const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
      const continuationCallback = callback(didUserCallbackTimeout);
      currentTime = getCurrentTime();
      if (typeof continuationCallback === 'function') {
        currentTask.callback = continuationCallback;
        return true;
      }
      if (currentTask === peek(taskQueue)) {
        pop(taskQueue);
      }
    } else {
      pop(taskQueue);
    }
    currentTask = peek(taskQueue);
  }
  // 如果循环结束,还有未完成的任务,那说明hasMoreWork = true
  if (currentTask !== null) {
    return true;
  }
  return false;
}

function shouldYieldToHost() {
  const timeElapsed = getCurrentTime() - startTime;
  if (timeElapsed < frameInterval) {
    return false;
  }
  return true;
}

function unstable_cancelCallback(task) {
  task.callback = null;
}

export {
  NormalPriority as unstable_NormalPriority,
  unstable_scheduleCallback,
  shouldYieldToHost as unstable_shouldYield,
  unstable_cancelCallback,
  getCurrentTime as unstable_now,
};
