import type { Request } from '../Server'
import ServerError from '../../ServerError';

export default function singletonUpdate(request: Request, db: any) {
    const item = db[request.model].first();

    if (!item) throw new ServerError(404);

    return db[request.model].update(item.id, request.json);
}