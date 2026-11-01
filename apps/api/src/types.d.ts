// Adds the authenticated user id to Express requests (set by loadSession).
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export {};
