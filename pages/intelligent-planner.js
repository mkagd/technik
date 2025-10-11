import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import IntelligentWeekPlanner from '../components/IntelligentWeekPlanner';

export default function IntelligentPlannerPage() {
  const router = useRouter();
  
  // Zapobiegnij nawigacji do tego samego URL
  useEffect(() => {
    const handleRouteChange = (url) => {
      if (url === '/intelligent-planner' && router.pathname === '/intelligent-planner') {
        console.warn('⚠️ Prevented navigation to same URL');
        return false;
      }
    };
    
    router.events?.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events?.off('routeChangeStart', handleRouteChange);
    };
  }, [router]);
  
  return (
    <Layout>
      <IntelligentWeekPlanner />
    </Layout>
  );
}