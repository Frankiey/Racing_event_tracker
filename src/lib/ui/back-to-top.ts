export function initBackToTop(): () => void {
  const button = document.getElementById('back-to-top');
  if (!button) return () => {};

  const update = () => {
    const show = window.scrollY > 400;
    button.style.opacity = show ? '1' : '0';
    button.style.pointerEvents = show ? 'auto' : 'none';
  };

  const handleClick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  window.addEventListener('scroll', update, { passive: true });
  button.addEventListener('click', handleClick);
  update();

  return () => {
    window.removeEventListener('scroll', update);
    button.removeEventListener('click', handleClick);
  };
}