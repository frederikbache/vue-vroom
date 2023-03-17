import type { Request } from '../Server';

export default function createHandler(request: Request, db: any) {
  const newItem = JSON.parse(
    JSON.stringify(db[request.model].create(request.json))
  );

  const hasMany = db[request.model].hasMany;
  Object.keys(newItem).forEach((field) => {
    const rel = field.replace(/Ids$/, '');
    if (rel in hasMany) {
      delete newItem[field];
    }
  });

  if (request.sideEffects?.create) {
    const result = request.sideEffects.create(newItem, db);
    if (result) {
      return result;
    }
  }

  return newItem;
}
