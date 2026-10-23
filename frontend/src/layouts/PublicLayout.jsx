import { useEffect, useRef } from 'react';
import PublicNav from '../components/PublicNav';

export default function PublicLayout({ children, className = '' }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => {});
  }, []);

  return (
    <div className={`intro-page public-layout ${className}`.trim()}>
      <div className="intro-video-wrap" aria-hidden="true">
        <video
          ref={videoRef}
          className="intro-video"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/videos/campus-intro.mp4" type="video/mp4" />
        </video>
        <div className="intro-video-scrim" />
        <div className="intro-watermark-cover" />
        <div className="intro-watermark-band" aria-hidden="true" />
      </div>

      <div className="intro-content public-layout-content">
        <PublicNav />
        {children}
      </div>
    </div>
  );
}
