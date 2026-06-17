export function getEventShareUrl(eventId: string, currentUrl = window.location.href): string {
  const shareUrl = new URL(currentUrl);
  shareUrl.searchParams.set('event', eventId);
  return shareUrl.toString();
}

export async function shareOrCopyEventUrl(title: string, url: string): Promise<'shared' | 'copied'> {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, url });
      return 'shared';
    } catch (err) {
      if ((err as Error).name === 'AbortError') throw err;
    }
  }

  await navigator.clipboard.writeText(url);
  return 'copied';
}