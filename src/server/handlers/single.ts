import Server, { type Request } from '../Server';
import ServerError from '../../ServerError';
import helper from '../../helper';

type SingleQuery = {
  include?: string;
};

export default function singleHandler(
  request: Request,
  db: any,
  server: Server<any, any>
) {
  const { id } = request.params;
  const { include } = request.query as SingleQuery;
  let item = db[request.model].find(id);

  if (!item) throw new ServerError(404);

  if (request.settings.envelope === false) {
    return item;
  }

  const hasMany = db[request.model].hasMany;
  const includeList = include ? include.split(',') : [];
  Object.keys(item).forEach((field) => {
    const rel = helper.removeHasManyPostfix(field);
    if (rel in hasMany && !includeList.includes(rel)) {
      delete item[field];
    }
  });

  const included = {} as { [key: string]: any[] };
  if (include) {
    include.split(',').forEach((field: string) => {
      const modelName = db[request.model].getRelatedModelName(field);
      included[modelName] = [];
      const rels = db[request.model].getRelated(item.id, field);
      rels.forEach((rel: any) => {
        if (!included[modelName].find((r) => r.id === rel.id))
          included[modelName].push(rel);
      });

      // Remove *Ids fields on the relations
      const relatedHasMany = db[modelName].hasMany;
      included[modelName] = included[modelName].map((item: any) => {
        Object.keys(item).forEach((field) => {
          const rel = helper.removeHasManyPostfix(field);
          if (rel in relatedHasMany) {
            delete item[field];
          }
        });
        return item;
      });
    });
  }

  if (request.sideEffects?.read) {
    const result = request.sideEffects.read(item, db, request);
    if (result) {
      item = result;
    }
  }

  return {
    [server.naming.dataSingle]: item,
    [server.naming.included]: included,
  };
}
