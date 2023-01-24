import type { Request } from '../Server';
import ServerError from '../../ServerError';

export default function deleteHandler(request: Request, db: any) {
  const { id } = request.params;
  const item = db[request.model].find(id);

  if (!item) throw new ServerError(404);

  db[request.model].destroy(item.id);
}
