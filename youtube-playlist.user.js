// ==UserScript==
// @name         Download YouTube Playlist as Markdown
// @match        https://www.youtube.com/playlist*
// @grant        GM_registerMenuCommand
// ==/UserScript==

GM_registerMenuCommand('Download playlist (.md)', async () => {
  let previous = -1, stable = 0;
  while (stable < 3) {
    const count = document.querySelectorAll('ytd-playlist-video-renderer').length;
    stable = count === previous ? stable + 1 : 0;
    previous = count;
    window.scrollTo(0, document.documentElement.scrollHeight);
    await new Promise(resolve => setTimeout(resolve, 1200));
  }

  const escape = text => text.replace(/([\\[\]])/g, '\\$1').replace(/\s+/g, ' ').trim();
  const lines = [...document.querySelectorAll('ytd-playlist-video-renderer a#video-title')]
    .map((link, index) => {
      const id = new URL(link.href).searchParams.get('v');
      return `${index + 1}. [${escape(link.textContent)}](https://www.youtube.com/watch?v=${id})`;
    });
  const title = document.querySelector('ytd-playlist-header-renderer h1')?.textContent.trim()
    || document.title.replace(/\s*-\s*YouTube$/, '')
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
