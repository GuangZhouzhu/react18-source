import { allowConcurrentByDefault } from 'shared/ReactFeatureFlags';

export const TotalLanes = 31;

export const NoLanes = /*                         */ 0b0000000000000000000000000000000;
export const NoLane = /*                          */ 0b0000000000000000000000000000000;

export const SyncHydrationLane = /*               */ 0b0000000000000000000000000000001;
export const SyncLane = /*                        */ 0b0000000000000000000000000000010;

export const InputContinuousHydrationLane = /*    */ 0b0000000000000000000000000000100;
export const InputContinuousLane = /*             */ 0b0000000000000000000000000001000;

export const DefaultHydrationLane = /*            */ 0b0000000000000000000000000010000;
export const DefaultLane = /*                     */ 0b0000000000000000000000000100000;

const TransitionHydrationLane = /*                */ 0b0000000000000000000000001000000;
const TransitionLanes = /*                        */ 0b0000000011111111111111110000000;
const TransitionLane1 = /*                        */ 0b0000000000000000000000010000000;
const TransitionLane2 = /*                        */ 0b0000000000000000000000100000000;
const TransitionLane3 = /*                        */ 0b0000000000000000000001000000000;
const TransitionLane4 = /*                        */ 0b0000000000000000000010000000000;
const TransitionLane5 = /*                        */ 0b0000000000000000000100000000000;
const TransitionLane6 = /*                        */ 0b0000000000000000001000000000000;
const TransitionLane7 = /*                        */ 0b0000000000000000010000000000000;
const TransitionLane8 = /*                        */ 0b0000000000000000100000000000000;
const TransitionLane9 = /*                        */ 0b0000000000000001000000000000000;
const TransitionLane10 = /*                       */ 0b0000000000000010000000000000000;
const TransitionLane11 = /*                       */ 0b0000000000000100000000000000000;
const TransitionLane12 = /*                       */ 0b0000000000001000000000000000000;
const TransitionLane13 = /*                       */ 0b0000000000010000000000000000000;
const TransitionLane14 = /*                       */ 0b0000000000100000000000000000000;
const TransitionLane15 = /*                       */ 0b0000000001000000000000000000000;
const TransitionLane16 = /*                       */ 0b0000000010000000000000000000000;

const RetryLanes = /*                             */ 0b0000111100000000000000000000000;
const RetryLane1 = /*                             */ 0b0000000100000000000000000000000;
const RetryLane2 = /*                             */ 0b0000001000000000000000000000000;
const RetryLane3 = /*                             */ 0b0000010000000000000000000000000;
const RetryLane4 = /*                             */ 0b0000100000000000000000000000000;

export const SomeRetryLane = RetryLane1;

export const SelectiveHydrationLane = /*          */ 0b0001000000000000000000000000000;

const NonIdleLanes = /*                           */ 0b0001111111111111111111111111111;

export const IdleHydrationLane = /*               */ 0b0010000000000000000000000000000;
export const IdleLane = /*                        */ 0b0100000000000000000000000000000;

export const OffscreenLane = /*                   */ 0b1000000000000000000000000000000;

// ???????????????
export const NoTimestamp = -1;

export function mergeLanes(a, b) {
  return a | b;
}

export function markRootUpdated(root, updateLane) {
  // ????????????????????????lane
  root.pendingLanes |= updateLane;
}

export function getNextLanes(root, wipLanes) {
  // ???????????????????????????
  const pendingLanes = root.pendingLanes;
  if (pendingLanes === NoLanes) {
    return NoLanes;
  }
  // ?????????????????????????????????????????????
  const nextLanes = getHighestPriorityLanes(pendingLanes);
  if (wipLanes !== NoLanes && wipLanes !== nextLanes) {
    // ?????????????????????????????????????????????,??????????????????????????????
    if (nextLanes >= wipLanes) {
      return wipLanes;
    }
  }
  return nextLanes;
}

export function getHighestPriorityLanes(lanes) {
  return getHighestPriorityLane(lanes);
}
export function getHighestPriorityLane(lanes) {
  return lanes & -lanes;
}

export function includesNonIdleWork(lanes) {
  return (lanes & NonIdleLanes) !== NoLanes;
}
export function includesBlockingLane(root, lanes) {
  if (allowConcurrentByDefault) {
    return false;
  }
  const SyncDefaultLanes =
    InputContinuousLane | DefaultLane | InputContinuousHydrationLane | DefaultHydrationLane;
  return (lanes & SyncDefaultLanes) !== NoLanes;
}
export function isSubsetOfLanes(set, subset) {
  return (set & subset) === subset;
}

export function markStarvedLanesAsExpired(root, currentTime) {
  // ??????????????????????????????
  const pendingLanes = root.pendingLanes;
  // ??????????????????????????????
  const expirationTimes = root.expirationTimes;
  let lanes = pendingLanes;
  while (lanes > 0) {
    const index = pickArbitraryLaneIndex(lanes);
    const lane = 1 << index;
    const expirationTime = expirationTimes[index];
    // ????????????????????????????????????,??????????????????????????????????????????,????????????????????????????????????????????????
    if (expirationTime === NoTimestamp) {
      expirationTimes[index] = computeExpirationTime(lane, currentTime);
    } else if (expirationTime <= currentTime) {
      // ????????????????????????????????????????????????,????????????????????????????????????
      root.expiredLanes |= lane;
    }
    lanes &= ~lane;
  }
}

// ??????32?????????,?????????1?????????
function pickArbitraryLaneIndex(lanes) {
  return 31 - Math.clz32(lanes);
}

function computeExpirationTime(lane, currentTime) {
  switch (lane) {
    case SyncLane:
    case InputContinuousHydrationLane:
    case InputContinuousLane:
      // User interactions should expire slightly more quickly.
      //
      // NOTE: This is set to the corresponding constant as in Scheduler.js.
      // When we made it larger, a product metric in www regressed, suggesting
      // there's a user interaction that's being starved by a series of
      // synchronous updates. If that theory is correct, the proper solution is
      // to fix the starvation. However, this scenario supports the idea that
      // expiration times are an important safeguard when starvation
      // does happen.
      return currentTime + 250;
    case DefaultHydrationLane:
    case DefaultLane:
    case TransitionHydrationLane:
    case TransitionLane1:
    case TransitionLane2:
    case TransitionLane3:
    case TransitionLane4:
    case TransitionLane5:
    case TransitionLane6:
    case TransitionLane7:
    case TransitionLane8:
    case TransitionLane9:
    case TransitionLane10:
    case TransitionLane11:
    case TransitionLane12:
    case TransitionLane13:
    case TransitionLane14:
    case TransitionLane15:
    case TransitionLane16:
      return currentTime + 5000;
    case RetryLane1:
    case RetryLane2:
    case RetryLane3:
    case RetryLane4:
    case RetryLane5:
      // TODO: Retries should be allowed to expire if they are CPU bound for
      // too long, but when I made this change it caused a spike in browser
      // crashes. There must be some other underlying bug; not super urgent but
      // ideally should figure out why and fix it. Unfortunately we don't have
      // a repro for the crashes, only detected via production metrics.
      return NoTimestamp;
    case SelectiveHydrationLane:
    case IdleHydrationLane:
    case IdleLane:
    case OffscreenLane:
      // Anything idle priority or lower should never expire.
      return NoTimestamp;
    default:
      return NoTimestamp;
  }
}

export function createLaneMap(initial) {
  const laneMap = [];
  for (let i = 0; i < TotalLanes; i++) {
    laneMap.push(initial);
  }
  return laneMap;
}

export function includesExpiredLane(root, lanes) {
  return (lanes & root.expiredLanes) !== NoLanes;
}

export function markRootFinished(root, remainingLanes) {
  // ??????????????????lane
  const noLongerPendingLanes = root.pendingLanes & ~remainingLanes;
  root.pendingLanes = remainingLanes;
  let lanes = noLongerPendingLanes;
  const expirationTimes = root.expirationTimes;
  while (lanes > 0) {
    const index = pickArbitraryLaneIndex(lanes);
    const lane = 1 << index;
    expirationTimes[index] = NoTimestamp;
    lanes &= ~lane;
  }
}
