import { IBattle } from './battle';

export interface ICompetitionTemplate {
  _id?: string;
  name: string;
  description: string;
  battles: IBattle[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
