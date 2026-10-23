import droneIconGreen from '../assets/drone-icon-green.png';

export default function DroneIcon({ size = 40, className = '', variant = 'green' }) {
  return (
    <img
      src={droneIconGreen}
      alt=""
      className={`drone-icon-img ${variant === 'white' ? 'drone-icon-white' : ''} ${className}`.trim()}
      style={{ height: size, width: 'auto' }}
      aria-hidden="true"
      draggable={false}
    />
  );
}
