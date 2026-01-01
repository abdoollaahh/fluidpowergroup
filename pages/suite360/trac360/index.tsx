import { useEffect } from 'react';
import { useRouter } from 'next/router';

const Trac360Index = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace('/suite360/trac360/start');
  }, [router]);

  return null;
};

export default Trac360Index;