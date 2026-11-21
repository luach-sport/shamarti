/* YouTube links: pictures come straight from YouTube's image server, title and channel from oEmbed. */
(function () {
  'use strict';
  const SH = window.SH;

  SH.youtubePreview = async (url, log) => {
    const id = SH.youtubeId(url);
    const short = /\/shorts\//.test(url);
    const out = { url, title: '', author: '', site: 'YouTube', images: [] };
    if (id) {
      out.images = short
        ? ['https://i.ytimg.com/vi/' + id + '/oardefault.jpg', 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg']
        : ['https://i.ytimg.com/vi/' + id + '/hq720.jpg', 'https://i.ytimg.com/vi/' + id + '/mqdefault.jpg'];
    }
    try {
      const watch = id ? 'https://www.youtube.com/watch?v=' + id : url;
      const r = await SH.http('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent(watch), { timeout: 12000 });
      SH.plog(log, 'youtube oembed: ' + r.status);
      if (r.ok && SH.isObj(r.data)) {
        out.title = SH.clip(r.data.title, 300);
        out.author = SH.clip(r.data.author_name, 80);
        if (r.data.thumbnail_url) out.images.push(r.data.thumbnail_url);
      }
    } catch (e) { SH.plog(log, 'youtube oembed failed: ' + (e && e.message)); }
    if (!out.title && !id) {
      const og = await SH.crawl(url, [SH.UA.mobile], log);
      if (og) { out.title = SH.clip(og.title, 300); if (og.image) out.images.push(og.image); }
    }
    return out;
  };
})();
