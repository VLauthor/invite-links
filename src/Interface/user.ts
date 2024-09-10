import { string } from "joi";

export interface User {
  lastName: string;
  firstName: string;
  patronymic?: string | null;
  phone: number;
  mail: string;
  password: string;
  urlInvite: string;
  videos: Array<number>;
}

export interface FIO {
  lastName: string;
  firstName: string;
  patronymic?: string;
}

export interface Video {
  id?: number;
  name: string;
  url: string;
  accept?: boolean;
}
