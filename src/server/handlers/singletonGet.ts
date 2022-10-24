import type { Request } from '../Server';
import ServerError from '../../ServerError';
import { parseFilterField } from './helpers';
import Server from '../Server';

export default function singletonGet(
  request: Request,
  db: any,
  server: Server<any>
) {
  const filters = request.query;

  let items = db[request.model].all().filter((item: any) => {
    let match = true;
    Object.entries(filters).forEach(([field, value]) => {
      if (request.filters && field in request.filters) {
        if (!request.filters[field](item, value as string, db)) match = false;
      } else {
        const { name, fn } = parseFilterField(field);
        if (name in item && !fn(item[name], value)) match = false;
      }
    });
    return match;
  });

  if (!items.length) throw new ServerError(404);

  const item = items[0];

  if (request.settings.envelope === false) {
    return item;
  }

  return {
    [server.naming.dataSingle]: item,
  };
}
