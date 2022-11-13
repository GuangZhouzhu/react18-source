export function initialUpdateQueue(fiber) {
  // pending是一个循环链表
  const queue = {
    shared: {
      pending: null,
    },
  };
  fiber.updateQueue = queue;
}
