import { ReturnsForm } from '@/components/returns/ReturnsForm';

export default function ReturnsPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5">
      <h1 className="font-display text-2xl font-semibold text-ink">Returns</h1>
      <ReturnsForm />
    </div>
  );
}
