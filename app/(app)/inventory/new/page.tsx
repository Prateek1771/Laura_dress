import { ItemForm } from '@/components/inventory/ItemForm';
import { createItem } from '../actions';

export default function NewItemPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <h1 className="font-display text-2xl font-semibold text-ink">Add Item</h1>
      <ItemForm action={createItem} />
    </div>
  );
}
