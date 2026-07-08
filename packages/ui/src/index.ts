// Export common styles or shared elements
export const THEME = {
  colors: {
    background: '#050505',
    primary: '#3b82f6', // blue
    accent: '#10b981', // emerald
    dark: '#09090b',
  },
  borderRadius: {
    mobileSheet: '24px',
    phoneSimulator: '48px',
    button: '12px',
  }
};
export const getNeonGlowStyle = (color: 'blue' | 'green') => {
  return color === 'blue' 
    ? 'shadow-[0_0_20px_rgba(59,130,246,0.3)] border-blue-500/20'
    : 'shadow-[0_0_20px_rgba(16,185,129,0.3)] border-emerald-500/20';
};
