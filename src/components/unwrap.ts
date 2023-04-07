export default function unwrap(item: any): any {
  if (Array.isArray(item)) {
    return item.map(unwrap);
  } else if (typeof item === 'object') {
    if (!item) return item;
    if ('value' in item) return unwrap(item.value);
    const unwrappedObject = {} as any;
    Object.entries(item).forEach(([key, val]) => {
      unwrappedObject[key] = unwrap(val);
    });
    return unwrappedObject;
  }

  return item;
}
