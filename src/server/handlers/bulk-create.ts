import { Request } from '../Server';

export default function bulkCreateHandler(request: Request, db: any) {
  const items = [] as any[];

  (request.json as any[]).forEach((itemToCreate: any) => {
    const newItem = JSON.parse(
      JSON.stringify(db[request.model].create(itemToCreate))
    );

    const hasMany = db[request.model].hasMany;
    Object.keys(newItem).forEach((field) => {
      const rel = field.replace(/Ids$/, '');
      if (rel in hasMany) {
        delete newItem[field];
      }
    });

    items.push(newItem);
  });

  return items;
}
