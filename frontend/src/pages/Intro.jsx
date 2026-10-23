import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import DroneTransitionOverlay, { DRONE_TRANSITION_MS } from '../components/DroneTransitionOverlay';
import { markIntroComplete } from '../utils/intro';

const FEATURES = [
  { icon: 'bi-radar', text: 'Real-time AI waste detection from drone footage' },
  { icon: 'bi-geo-alt', text: 'Interactive geospatial mapping' },
  { icon: 'bi-bar-chart-line', text: 'Analytics, reports & smart insights' },
];

export default function Intro() {
  const navigate = useNavigate();
  const [transitioning, setTransitioning] = useState(false);

  const handleGetStarted = () => {
    if (transitioning) return;
    setTransitioning(true);
    markIntroComplete();
    setTimeout(() => navigate('/login'), DRONE_TRANSITION_MS);
  };

  return (
    <PublicLayout>
      {transitioning && <DroneTransitionOverlay fullscreen />}

      <main className="intro-hero">
        <p className="intro-eyebrow">Drone Waste Monitoring</p>
        <h1 className="intro-title">
          <span className="intro-title-main">Find waste from the sky.</span>
          <span className="intro-title-accent"> Map it. Track it. Clean it up.</span>
        </h1>
        <p className="intro-lead intro-system-desc">
          <strong>Campus Eye</strong> combines drone vision, AI waste detection, and geospatial mapping
          to help your team monitor, map, and manage campus environmental health — all in one place.
        </p>

        <ul className="intro-features">
          {FEATURES.map((item) => (
            <li key={item.text}>
              <i className={`bi ${item.icon}`} />
              {item.text}
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="btn intro-cta"
          onClick={handleGetStarted}
          disabled={transitioning}
        >
          Get Started
          <i className="bi bi-arrow-right ms-2" />
        </button>

        <p className="intro-footnote">
          AI-Based Drone Waste Detection & Geospatial Mapping · DNSC
        </p>
      </main>
    </PublicLayout>
  );
}
