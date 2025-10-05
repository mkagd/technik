import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function ClientIndex() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard
    router.replace('/client/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}
