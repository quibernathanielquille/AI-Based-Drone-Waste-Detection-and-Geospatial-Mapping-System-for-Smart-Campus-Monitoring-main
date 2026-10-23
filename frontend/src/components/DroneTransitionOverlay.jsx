import DroneIcon from './DroneIcon';

function FlyingDroneIcon() {
  return (
    <div className="flying-drone-unit">
      <span className="drone-prop drone-prop-tl" aria-hidden="true" />
      <span className="drone-prop drone-prop-tr" aria-hidden="true" />
      <span className="drone-prop drone-prop-bl" aria-hidden="true" />
      <span className="drone-prop drone-prop-br" aria-hidden="true" />
      <DroneIcon size={44} className="flying-drone-body" />
      <span className="drone-trail" aria-hidden="true" />
    </div>
  );
}

export default function DroneTransitionOverlay({ fullscreen = false }) {
  return (
    <div
      className={`page-transition-overlay ${fullscreen ? 'page-transition-fullscreen' : ''}`}
      role="status"
      aria-label="Loading"
    >
      <div className="drone-flight-scene">
        <FlyingDroneIcon />
      </div>
    </div>
  );
}

export const DRONE_TRANSITION_MS = 1000;
