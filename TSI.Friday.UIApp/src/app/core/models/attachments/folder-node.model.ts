import { Attachment } from './attachment.model';

export interface FolderNode {
  name: string;
  path: string;
  children: FolderNode[];
  files: Attachment[];
}
