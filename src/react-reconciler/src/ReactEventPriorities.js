import {
  NoLane,
  SyncLane,
  InputContinuousLane,
  DefaultLane,
  IdleLane,
  getHighestPriorityLane,
  includesNonIdleWork,
} from './ReactFiberLane';

// 离散事件优先级
export const DiscreteEventPriority = SyncLane;
// 连续事件优先级
export const ContinuousEventPriority = InputContinuousLane;
// 默认事件优先级
export const DefaultEventPriority = DefaultLane;
// 空闲事件优先级
export const IdleEventPriority = IdleLane;

let currentUpdatePriority = NoLane;

export function getCurrentUpdatePriority() {
  return currentUpdatePriority;
}

export function setCurrentUpdatePriority(newPriority) {
  currentUpdatePriority = newPriority;
}

export function lanesToEventPriority(lanes) {
  let lane = getHighestPriorityLane(lanes);
  if (!isHigherEventPriority(DiscreteEventPriority, lane)) {
    return DiscreteEventPriority;
  }
  if (!isHigherEventPriority(ContinuousEventPriority, lane)) {
    return ContinuousEventPriority;
  }
  if (includesNonIdleWork(lane)) {
    return DefaultEventPriority;
  }
  return IdleEventPriority;
}

/**
 * 判断b是不是比a大,越大说明优先级越低
 * @param {*} a
 * @param {*} b
 * @returns
 */
export function isHigherEventPriority(a, b) {
  return a !== 0 && a < b;
}
