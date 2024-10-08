import type { Request } from '../Server';
import ServerError from '../../ServerError';
import helper from '../../helper';

export default function updateHandler(request: Request, db: any) {
  const { id } = request.params;
  const item = db[request.model].find(id);

  if (!item) throw new ServerError(404);

  const updatedItem = JSON.parse(
    JSON.stringify(db[request.model].update(id, request.json))
  );

  const hasMany = db[request.model].hasMany;
  Object.keys(updatedItem).forEach((field) => {
    const rel = helper.removeHasManyPostfix(field);
    if (rel in hasMany) {
      delete updatedItem[field];
    }
  });

  if (request.sideEffects?.update) {
    const result = request.sideEffects.update(updatedItem, db, request);
    if (result) {
      return result;
    }
  }
  return updatedItem;
}
