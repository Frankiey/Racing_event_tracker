import { readFavorites } from '../client-utils';
import { onFavoritesChanged } from './rt-events';

export function updateNavFavoriteCount(): void {
  const favorites = readFavorites();

  const badge = document.getElementById('nav-fav-count');
  if (badge) {
    if (favorites.length > 0) {
      badge.textContent = String(favorites.length);
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  const mobileBadge = document.getElementById('nav-fav-count-mobile');
  if (mobileBadge) {
    if (favorites.length > 0) {
      mobileBadge.textContent = String(favorites.length);
      mobileBadge.classList.remove('hidden');
    } else {
      mobileBadge.classList.add('hidden');
    }
  }
}

export function initMobileNav(): () => void {
  const button = document.getElementById('mobile-menu-btn');
  const menu = document.getElementById('mobile-menu');
  const hamburger = document.getElementById('hamburger-icon');
  const closeIcon = document.getElementById('close-icon');
  const navRoot = document.getElementById('main-nav');
  if (!button || !menu || !hamburger || !closeIcon || !navRoot) return () => {};

  const openMenu = () => {
    menu.classList.remove('hidden');
    hamburger.classList.add('hidden');
    closeIcon.classList.remove('hidden');
    button.setAttribute('aria-expanded', 'true');
  };

  const closeMenu = () => {
    menu.classList.add('hidden');
    hamburger.classList.remove('hidden');
    closeIcon.classList.add('hidden');
    button.setAttribute('aria-expanded', 'false');
  };

  const handleButtonClick = (event: Event) => {
    event.stopPropagation();
    const isOpen = !menu.classList.contains('hidden');
    if (isOpen) closeMenu();
    else openMenu();
  };

  const handleMenuClick = (event: Event) => {
    if ((event.target as HTMLElement).closest('a')) closeMenu();
  };

  const handleDocumentClick = (event: Event) => {
    if (!navRoot.contains(event.target as Node)) closeMenu();
  };

  button.addEventListener('click', handleButtonClick);
  menu.addEventListener('click', handleMenuClick);
  document.addEventListener('click', handleDocumentClick);

  return () => {
    button.removeEventListener('click', handleButtonClick);
    menu.removeEventListener('click', handleMenuClick);
    document.removeEventListener('click', handleDocumentClick);
  };
}

export function initNavControllers(): () => void {
  updateNavFavoriteCount();
  const cleanupMobileNav = initMobileNav();
  const cleanupFavorites = onFavoritesChanged(updateNavFavoriteCount);
  return () => {
    cleanupMobileNav();
    cleanupFavorites();
  };
}