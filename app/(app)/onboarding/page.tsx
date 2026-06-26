import { OnboardingForm } from '@/components/onboarding/OnboardingForm';

export default function OnboardingPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">New Styling Session</h1>
        <p className="mt-1 text-sm text-ink-muted">A few quick questions to find the right outfits.</p>
      </div>
      <OnboardingForm />
    </div>
  );
}
