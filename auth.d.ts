import * as express from 'express'; 

export interface RequestUser {
  id: string;
  role: string;
  name: string;
}

export type AuthenticatedRequest = express.Request & { user?: RequestUser };