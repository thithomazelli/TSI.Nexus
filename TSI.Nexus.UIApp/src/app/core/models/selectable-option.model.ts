import { SelectableOptionGroup } from '../enums/selectable-option-group.enum';
import { BaseModel } from './base.model';

export interface SelectableOption extends BaseModel {
  id?: string;
  group?: SelectableOptionGroup;
  value?: string;
  color?: string | null;
}
