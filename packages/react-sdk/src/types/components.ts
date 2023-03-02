import { ReactNode } from 'react';

export type ChildrenOnly = { children: ReactNode };

export type Readable<T> = {
  [k in keyof T]: T[k];
} & {};
