import { Suspense } from 'react';
import { AuthPageComponent } from '@/components/AuthPageComponent';

export default function Auth() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthPageComponent />
    </Suspense>
  );
}
