import type { Request, Response, NextFunction } from 'express';

function parseUserQuery(
  req: Request,
  res: Response,
  next: NextFunction
): void | Response {
  if (!req.body) {
    return next({
      log: 'parseUserQuery: There is no request body',
      message: { err: 'Add input to the request body' },
    });
  }
  if (!req.body.userQuery) {
    return next({
      log: 'parseUserQuery: key "userQuery" not given',
      message: { err: 'key "userQuery" not given' },
    });
  }
  if (typeof req.body.userQuery !== 'string') {
    return next({
      log: 'parseUserQuery: key "userQuery" is not a string',
      message: { err: 'key "userQuery" is not a string' },
    });
  }
  res.locals.inputQuery = req.body.userQuery;
  return next();
}

export { parseUserQuery };
