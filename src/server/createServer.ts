import type { Settings } from "./../types";
import Server from './Server';

export default function createServer<DbType>(settings: Settings, models: any, db: DbType) {
    if (settings.server && settings.server.enable) {
        return new Server(settings, models, db);
    }

    return null;
}