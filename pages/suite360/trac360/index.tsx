// /suite360/trac360/index.tsx
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

const Trac360Index = () => {
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!hasRedirected.current) {
      hasRedirected.current = true;
      router.replace('/suite360/trac360/start');
    }
  }, [router]);

  return null;
};

export default Trac360Index;