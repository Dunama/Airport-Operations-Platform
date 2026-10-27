export interface CrudFormProps<T> {
  open: boolean;
  item: T | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}
