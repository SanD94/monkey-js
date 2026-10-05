// ==UserScript==
// @name         Download YouTube Playlist as Markdown
// @match        https://www.youtube.com/*
// @grant        GM_registerMenuCommand
// ==/UserScript==

GM_registerMenuCommand('Download playlist (.md)', async () => {
  const itemSelector = location.pathname === '/watch'
    ? 'ytd-playlist-panel-video-renderer'
    : 'ytd-playlist-video-renderer';

  if (!new URL(location.href).searchParams.has('list')) {
    alert('Open a YouTube playlist before downloading it.');
    return;
  }

  let previous = -1, stable = 0;
  while (stable < 3) {
    const items = [...document.querySelectorAll(itemSelector)];
    const count = items.length;
    stable = count === previous ? stable + 1 : 0;
    previous = count;
    items.at(-1)?.scrollIntoView({ block: 'end' });
    await new Promise(resolve => setTimeout(resolve, 1200));
  }

  const escape = text => text.replace(/([\\[\]])/g, '\\$1').replace(/\s+/g, ' ').trim();
  const lines = [...document.querySelectorAll(itemSelector)]
    .map(item => {
      const link = item.querySelector('a#video-title, a#wc-endpoint');
      const title = item.querySelector('#video-title')?.textContent || '';
      if (!link) return null;
      const id = new URL(link.href).searchParams.get('v');
      return id && { id, title: escape(title) };
    })
    .filter(Boolean)
    .map(({ id, title }, index) => `${index + 1}. [${title}](https://www.youtube.com/watch?v=${id})`);
  const title = document.querySelector('ytd-playlist-header-renderer h1')?.textContent.trim()
    || document.querySelector('ytd-playlist-panel-renderer #header-description .title')?.textContent.trim()
    || 'YouTube Playlist';
  const filename = title.replace(/[\\/:*?"<>|]/g, '-').trim() || 'youtube-playlist';
  const blob = new Blob([`# ${title.replace(/^#+\s*/, '')}\n\n${lines.join('\n')}\n`], { type: 'text/markdown' });
  const link = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob),
    download: `${filename}.md`,
  });
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
});
