import type { Request } from '../Server'
import ServerError from '../../ServerError';

export default function itemActionHandler(cb: (item: any) => any) {
    return (request: Request, db: any) => {
        const { id } = request.params;

        const item = db[request.model].find(id);

        if (!item) throw new ServerError(404)

        return db[request.model].update(id, cb(item));
    }
}