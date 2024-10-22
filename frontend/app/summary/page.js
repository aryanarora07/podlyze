import { Suspense } from 'react';
import { SummaryPage } from '@/components/components-summary-page';

export default function Summary() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SummaryPage />
    </Suspense>
  );
}