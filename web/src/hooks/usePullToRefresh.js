import { useEffect, useRef, useState } from 'react';

export default function usePullToRefresh(onRefresh, enabled) {
  const startY = useRef(null);
  const pulling = useRef(false);
  const [isPulling, setIsPulling] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const onTouchStart = (e) => {
      if (window.scrollY > 0) return;
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    };

    const onTouchMove = (e) => {
      if (!pulling.current || startY.current === null) return;
      const delta = e.touches[0].clientY - startY.current;
      setIsPulling(delta > 20);
    };

    const onTouchEnd = async (e) => {
      if (!pulling.current || startY.current === null) return;
      const delta = e.changedTouches[0].clientY - startY.current;
      pulling.current = false;
      startY.current = null;
      setIsPulling(false);
      if (delta > 60) {
        await onRefresh();
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [onRefresh, enabled]);

  return isPulling;
}
