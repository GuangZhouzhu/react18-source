import * as ReactWorkTags from 'react-reconciler/src/ReactWorkTags';
import {
  FunctionComponent,
  HostRoot,
  HostComponent,
  HostText,
} from 'react-reconciler/src/ReactWorkTags';
import { Update, Placement, ChildDeletion } from 'react-reconciler/src/ReactFiberFlags';

const ReactWorkTagsMap = new Map();
for (let tag in ReactWorkTags) {
  ReactWorkTagsMap.set(ReactWorkTags[tag], tag);
}

export default function logger(prefix, workInProgress) {
  let tagValue = workInProgress.tag;
  let tagName = ReactWorkTagsMap.get(tagValue);
  let str = `${tagName} `;
  if (tagName === 'HostComponent') {
    str += ` ${workInProgress.type} `;
  } else if (tagName === 'HostText') {
    str += ` ${workInProgress.pendingProps} `;
  }
  console.log(`${prefix} ${str}`);
}

let indent = { number: 0 };
export { indent };

export function printFiber(fiber) {
  /*
  fiber.flags &= ~Forked;
  fiber.flags &= ~PlacementDEV;
  fiber.flags &= ~Snapshot;
  fiber.flags &= ~PerformedWork;
  */
  if (fiber.flags !== 0) {
    console.log(
      getFlags(fiber.flags),
      getTag(fiber.tag),
      typeof fiber.type === 'function' ? fiber.type.name : fiber.type,
      fiber.memoizedProps,
    );
    if (fiber.deletions) {
      for (let i = 0; i < fiber.deletions.length; i++) {
        const childToDelete = fiber.deletions[i];
        console.log(getTag(childToDelete.tag), childToDelete.type, childToDelete.memoizedProps);
      }
    }
  }
  let child = fiber.child;
  while (child) {
    printFiber(child);
    child = child.sibling;
  }
}

function getTag(tag) {
  switch (tag) {
    case FunctionComponent:
      return `FunctionComponent`;
    case HostRoot:
      return `HostRoot`;
    case HostComponent:
      return `HostComponent`;
    case HostText:
      return HostText;
    default:
      return tag;
  }
}

function getFlags(flags) {
  if (flags === (Update | Placement | ChildDeletion)) {
    return `自己移动和子元素有删除`;
  }
  if (flags === (ChildDeletion | Update)) {
    return `自己有更新和子元素有删除`;
  }
  if (flags === ChildDeletion) {
    return `子元素有删除`;
  }
  if (flags === (Placement | Update)) {
    return `移动并更新`;
  }
  if (flags === Placement) {
    return `插入`;
  }
  if (flags === Update) {
    return `更新`;
  }
  return flags;
}
