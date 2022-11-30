import { HostComponent, HostRoot, HostText, IndeterminateComponent } from './ReactWorkTags';
import { NoFlags } from './ReactFiberFlags';

/**
 *
 * @param {*} tag fiber的类型: 详细列表见./ReactWorkTags, 函数组件0 类组件1 原生组件5 根元素3
 * @param {*} pendingProps 等待处理(或生效)的属性
 * @param {*} key 组件的key
 */
export function FiberNode(tag, pendingProps, key) {
  this.tag = tag;
  this.key = key;
  // 元素类型,来自虚拟DOM节点的type,比如: span,div等标签名
  this.type = null;
  // 此fiber对应的真实DOM节点
  // 三者对应关系为: 虚拟DOM => Fiber节点 => 真实DOM
  // 有一个例外: 容器结点(div#root,FiberRootNode)是没有虚拟DOM的
  // 因为React里,都是 虚拟DOM=(创建)=>Fiber节点=>真实DOM
  // 但容器节点是外部提供的, 对于React来说是固定的
  // 因此例外,做特殊处理,所以容器节点是没有虚拟DOM的
  this.stateNode = null;

  this.return = null;
  this.child = null;
  this.sibling = null;

  // 等待生效的属性
  this.pendingProps = pendingProps;
  // 已经生效的属性
  this.memoizedProps = null;

  // 存fiber有自己的状态,不同类型的fiber存储的状态类型不一样,如:
  // 类组件存的是=>类的实例的状态
  // HostRoot存的是=>要渲染的元素
  // 函数组件存的是=>hooks创建的状态
  this.memoizedState = null;

  // 每个fiber上可能还有更新队列
  this.updateQueue = null;

  // 副作用的标识: 表示针对此fiber节点进行何种操作
  // 操作标识列表详情见./ReactFiberFlags
  this.flags = NoFlags;
  // 子节点的副作用标识
  this.subtreeFlags = NoFlags;
  // 双缓冲技术: 用来存储替身结点(每个结点其实有2个Fiber结点在交替使用,节约内存)
  this.alternate = null;
  this.index = 0;
  // 存放将要删除的子Fiber
  this.deletions = null;
}

export function createFiber(tag, pendingProps, key) {
  return new FiberNode(tag, pendingProps, key);
}

export function createHostRootFiber() {
  return createFiber(HostRoot, null, null);
}

/**
 * 基于老的Fiber和新的属性创建新的Fiber
 * @param {*} current 老Fiber
 * @param {*} pendingProps 新属性
 */
export function createWorkInProgress(current, pendingProps) {
  let workInProgress = current.alternate;
  if (workInProgress === null) {
    workInProgress = createFiber(current.tag, pendingProps, current.key);
    workInProgress.type = current.type;
    workInProgress.stateNode = current.stateNode;
    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
    workInProgress.pendingProps = pendingProps;
    workInProgress.type = current.type;
    workInProgress.flags = NoFlags;
    workInProgress.subtreeFlags = NoFlags;
  }
  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.updateQueue = current.updateQueue;
  workInProgress.sibling = current.sibling;
  workInProgress.index = current.index;
  return workInProgress;
}

function createFiberFromTypeAndProps(type, key, pendingProps) {
  let fiberTag = IndeterminateComponent;
  // 如果类型type是一个字符串(如: div,p,span),则说明Fiber类型是一个原生组件
  if (typeof type === 'string') {
    fiberTag = HostComponent;
  }
  const fiber = createFiber(fiberTag, pendingProps, key);
  fiber.type = type;
  return fiber;
}

/**
 * 根据虚拟DOM创建Fiber结点
 * @param {*} element
 */
export function createFiberFromElement(element) {
  const { type, key, props: pendingProps } = element;
  const fiber = createFiberFromTypeAndProps(type, key, pendingProps);
  return fiber;
}

export function createFiberFromText(content) {
  const fiber = createFiber(HostText, content, null);
  return fiber;
}
