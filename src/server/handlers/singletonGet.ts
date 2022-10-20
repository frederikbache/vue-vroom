import type { Request } from '../Server';
import ServerError from '../../ServerError';

export default function singletonGet(request: Request, db: any) {
  const item = db[request.model].first();

  if (!item) throw new ServerError(404);

  if (request.settings.envelope === false) {
    return item;
  }
  return {
    data: item,
  };
}
