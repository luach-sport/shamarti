/* Any other website (and Facebook, Pinterest…): the preview tags of the page, read the way WhatsApp does. */
(function () {
  'use strict';
  const SH = window.SH;
  const SOCIAL = ['instagram', 'facebook', 'x', 'pinterest', 'threads'];

  // "Name on Instagram: "caption"" → author + caption
  function instagramTitle(og) {
    let title = og.title, author = og.author;
    const im = String(og.title || '').match(/^(.*?)\s+on Instagram:\s*["“]?([\s\S]*?)["”]?$/i);
    if (im) { author = im[1]; title = im[2]; }
    if (!im && og.desc) {
      const dm = og.desc.match(/-\s*([\w.]+)\s+on\s+[^:]+:\s*["“]?([\s\S]*?)["”]?\.?$/i);
      if (dm) { author = '@' + dm[1]; title = dm[2]; }
    }
    return { title, author };
  }
  // "Article title | Site name" → "Article title"
  function withoutSiteName(title, site) {
    if (!site || !title) return title;
    const s = site.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return title.replace(new RegExp('\\s*[|•–—:-]\\s*' + s + '\\s*$'), '').replace(new RegExp('^' + s + '\\s*[|•–—:-]\\s*'), '') || title;
  }

  SH.genericPreview = async (url, src, log) => {
    const uas = SOCIAL.includes(src) ? [SH.UA.facebook, SH.UA.whatsapp, SH.UA.mobile] : [SH.UA.mobile, SH.UA.whatsapp, SH.UA.facebook];
    const og = await SH.crawl(url, uas, log);
    if (!og) throw new Error('no page');
    let { title, author } = src === 'instagram' ? instagramTitle(og) : { title: og.title, author: og.author };
    // A bare app name ("Instagram") or a login page title is not a real title.
    if (!title || /^(instagram|facebook|threads|x|log in|login|התחברות)$/i.test(title.trim())) title = og.desc || '';
    title = withoutSiteName(title, og.site);
    return { url: og.url || url, title: SH.clip(title, 300), author: SH.clip(author, 80), site: SH.clip(og.site, 60), images: og.image ? [og.image] : [] };
  };
})();
