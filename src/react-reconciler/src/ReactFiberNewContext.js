export function pushProvider(context, nextValue) {
  context._currentValue = nextValue;
}

export function readContext(context) {
  return context._currentValue;
}
