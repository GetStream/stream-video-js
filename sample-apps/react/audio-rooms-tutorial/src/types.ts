export interface User {
  id: string;
  name?: string;
  imageUrl?: string;
}

export type CustomCallData = {
  description?: string;
  hosts?: User[];
  speakerIds?: string[];
  title?: string;
};
