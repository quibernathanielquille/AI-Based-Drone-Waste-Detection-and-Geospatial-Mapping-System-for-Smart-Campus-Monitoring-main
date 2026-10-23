import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import DroneTransitionOverlay, { DRONE_TRANSITION_MS } from './DroneTransitionOverlay';

export default function PageTransitionLoader() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return undefined;
    }

    if (location.pathname === '/') return undefined;

    setVisible(true);
    const timer = setTimeout(() => setVisible(false), DRONE_TRANSITION_MS);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (!visible) return null;

  return <DroneTransitionOverlay />;
}
