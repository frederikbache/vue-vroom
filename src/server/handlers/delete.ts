import type { Request } from '../Server';
import ServerError from '../../ServerError';

export default function deleteHandler(request: Request, db: any) {
  const item = db[request.model].first();

  if (!item) throw new ServerError(404);

  db[request.model].destroy(item.id);
}
