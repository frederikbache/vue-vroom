import type { Request } from '../Server';
import ServerError from '../../ServerError';

export default function bulkDeleteHandler(request: Request, db: any) {
  const { id } = request.params;

  (request.json as any[]).forEach((itemToDelete: any) => {
    const item = db[request.model].find(itemToDelete.id);
    if (!item) throw new ServerError(404);
    db[request.model].destroy(item.id);
  });
}
