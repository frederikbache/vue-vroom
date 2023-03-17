import type { Settings } from './../types';
import Server from './Server';

export default function createServer<DbType, IdentityModel>(
  settings: Settings,
  models: any,
  db: DbType
) {
  if (settings.server && settings.server.enable) {
    return new Server<DbType, IdentityModel>(settings, models, db);
  }

  return null;
}
