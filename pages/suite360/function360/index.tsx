import { useEffect } from 'react';
import { useRouter } from 'next/router';

const Function360Index = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace('/suite360/function360/start');
  }, [router]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <p>Redirecting to Function360...</p>
    </div>
  );
};

export default Function360Index;