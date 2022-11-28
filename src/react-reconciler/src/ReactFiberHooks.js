import ReactSharedInternals from 'shared/ReactSharedInternals';
import { scheduleUpdateOnFiber } from './ReactFiberWorkLoop';
import { enqueueConcurrentHookUpdate } from './ReactFiberConcurrentUpdates';
import is from 'shared/objectIs';

const { ReactCurrentDispatcher } = ReactSharedInternals;
let currentlyRenderingFiber = null;
let workInProgressHook = null;
let currentHook = null;
const HooksDispatcherOnMount = {
  useReducer: mountReducer,
  useState: mountState,
};
const HooksDispatcherOnUpdate = {
  useReducer: updateReducer,
  useState: updateState,
};
// useState其实就是一个内置了reducer的useReducer
function basicStateReducer(state, action) {
  return typeof action === 'function' ? action(state) : action;
}

function mountReducer(reducer, initialArg, init) {
  const hook = mountWorkInProgressHook();
  hook.memoizedState = initialArg;
  const queue = {
    pending: null,
    dispatch: null,
  };
  hook.queue = queue;
  const dispatch = (queue.dispatch = dispatchReducerAction.bind(
    null,
    currentlyRenderingFiber,
    queue,
  ));
  return [hook.memoizedState, dispatch];
}
function mountState(initialState) {
  const hook = mountWorkInProgressHook();
  hook.memoizedState = initialState;
  const queue = {
    pending: null,
    dispatch: null,
    lastRenderedReducer: basicStateReducer,
    lastRenderedState: initialState,
  };
  hook.queue = queue;
  const dispatch = (queue.dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue));
  return [hook.memoizedState, dispatch];
}

function updateReducer(reducer) {
  // 获取新Hook
  const hook = updateWorkInProgressHook();
  // 获取新Hook的更新队列
  const queue = hook.queue;
  queue.lastRenderedReducer = reducer;
  // 获取老Hook
  const current = currentHook;
  // 获取将要生效的队列
  const pendingQueue = queue.pending;
  // 初始化一个新的状态,初始值为当前的状态(也就是老状态)
  let newState = current.memoizedState;
  if (pendingQueue !== null) {
    queue.pending = null;
    const first = pendingQueue.next;
    let update = first;
    do {
      if (update.hasEagerState) {
        newState = update.eagerState;
      } else {
        const action = update.action;
        newState = reducer(newState, action);
      }
      update = update.next;
    } while (update !== null && update !== first);
  }
  hook.memoizedState = queue.lastRenderedState = newState;
  return [hook.memoizedState, queue.dispatch];
}

function updateState(initialState) {
  return updateReducer(basicStateReducer, initialState);
}

function updateWorkInProgressHook() {
  // 获取将要构建的新Hook的老Hook
  if (currentHook === null) {
    const current = currentlyRenderingFiber.alternate;
    currentHook = current.memoizedState;
  } else {
    currentHook = currentHook.next;
  }
  // 根据老Hook创建新Hook
  const newHook = {
    memoizedState: currentHook.memoizedState,
    queue: currentHook.queue,
    next: null,
  };
  if (workInProgressHook === null) {
    currentlyRenderingFiber.memoizedState = workInProgressHook = newHook;
  } else {
    workInProgressHook = workInProgressHook.next = newHook;
  }
  return workInProgressHook;
}

/**
 * 挂载构建中的hook
 */
function mountWorkInProgressHook() {
  const hook = {
    // hook的状态
    memoizedState: null,
    // 存放本hook的更新队列(queue.pending = update的循环链表)
    queue: null,
    // 指向下一个Hook(一个函数里可能会有多个Hook,它们会组成一个单向链表)
    next: null,
  };
  if (workInProgressHook === null) {
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    workInProgressHook = workInProgressHook.next = hook;
  }
  return workInProgressHook;
}

function dispatchReducerAction(fiber, queue, action) {
  // 每个hook里会存放一个更新队列,更新队列是一个更新对象的循环链表
  const update = {
    action,
    next: null,
  };
  // 把当前的最新更新添加到更新队列中,并返回当前的根Fiber
  const root = enqueueConcurrentHookUpdate(fiber, queue, update);
  scheduleUpdateOnFiber(root);
}
function dispatchSetState(fiber, queue, action) {
  const update = {
    action,
    hasEagerState: false,
    eagerState: null,
    next: null,
  };
  // 当用useState派发动作后,立刻用上一次的状态和上一次的reducer计算新状态,如果一样就不更新了
  const { lastRenderedReducer, lastRenderedState: currentState } = queue;
  const eagerState = lastRenderedReducer(currentState, action);
  update.hasEagerState = true;
  update.eagerState = eagerState;
  if (is(eagerState, currentState)) {
    return;
  }
  const root = enqueueConcurrentHookUpdate(fiber, queue, update);
  scheduleUpdateOnFiber(root, fiber);
}

/**
 * 渲染函数组件
 * @param {*} current 老Fiber
 * @param {*} workInProgress 新Fiber
 * @param {*} Component 组件定义
 * @param {*} props 组件属性
 * @returns 虚拟DOM(ReactElement)
 */
export function renderWithHooks(current, workInProgress, Component, props) {
  currentlyRenderingFiber = workInProgress;
  // 需要在函数执行前,给 ReactCurrentDispatcher.current赋值,首次渲染和更新渲染需要赋值不同的函数
  if (current !== null && current.memoizedState !== null) {
    ReactCurrentDispatcher.current = HooksDispatcherOnUpdate;
  } else {
    ReactCurrentDispatcher.current = HooksDispatcherOnMount;
  }
  const children = Component(props);
  currentlyRenderingFiber = null;
  workInProgressHook = null;
  currentHook = null;
  return children;
}
