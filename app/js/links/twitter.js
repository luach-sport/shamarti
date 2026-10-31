/* X (Twitter) links: text, author and picture through the public fxtwitter service, else the page tags. */
(function () {
  'use strict';
  const SH = window.SH;

  SH.twitterPreview = async (url, log) => {
    const m = url.match(/(?:x|twitter)\.com\/([^/]+)\/status(?:es)?\/(\d+)/);
    if (m) {
      try {
        const r = await SH.http('https://api.fxtwitter.com/' + m[1] + '/status/' + m[2], { timeout: 12000 });
        const t = r.data && r.data.tweet;
        SH.plog(log, 'fxtwitter: ' + r.status);
        if (r.ok && t) {
          const media = t.media || {};
          const img = (media.photos && media.photos[0] && media.photos[0].url) || (media.videos && media.videos[0] && media.videos[0].thumbnail_url) || (t.author && t.author.avatar_url) || '';
          return { url, title: SH.clip(t.text, 300), author: t.author ? '@' + t.author.screen_name : '', images: img ? [img] : [], site: 'X' };
        }
      } catch (e) { SH.plog(log, 'fxtwitter failed: ' + (e && e.message)); }
    }
    return SH.genericPreview(url, 'x', log);
  };
})();
