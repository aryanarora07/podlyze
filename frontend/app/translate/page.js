import { Suspense } from 'react';
import { TranslateSummary } from '@/components/TranslateSummary';

export default function TranslatePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TranslateSummary />
    </Suspense>
  );
}
