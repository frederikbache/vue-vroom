import type { Request } from '../Server';
import ServerError from '../../ServerError';

export default function bulkUpdateHandler(request: Request, db: any) {
  const items = [] as any[];

  (request.json as any[]).forEach((itemToUpdate: any) => {
    const { id, ...data } = itemToUpdate;
    const item = db[request.model].find(id);

    if (!item) throw new ServerError(404);

    const updatedItem = JSON.parse(
      JSON.stringify(db[request.model].update(id, data))
    );

    const hasMany = db[request.model].hasMany;
    Object.keys(updatedItem).forEach((field) => {
      const rel = field.replace(/Ids$/, '');
      if (rel in hasMany) {
        delete updatedItem[field];
      }
    });

    items.push(updatedItem);
  });

  return items;
}
