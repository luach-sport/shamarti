/* Instagram links. The page tags (read as Facebook's crawler) usually have the picture;
   when they don't, Instagram's public "embed" page does. */
(function () {
  'use strict';
  const SH = window.SH;
  const I = (SH.instagram = {});

  I.code = (url) => {
    const m = String(url || '').match(/instagram\.com\/(?:[\w.]+\/)?(p|reel|reels|tv)\/([\w-]+)/);
    return m ? { kind: m[1] === 'reels' ? 'reel' : m[1], code: m[2] } : null;
  };
  const decode = (s) => String(s || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

  I.embed = async (url, log) => {
    const c = I.code(url);
    if (!c) return null;
    try {
      const page = await SH.getHtml('https://www.instagram.com/' + c.kind + '/' + c.code + '/embed/captioned/', SH.UA.mobile, log);
      const h = page.html;
      const img = h.match(/class="EmbeddedMediaImage"[^>]*\ssrc="([^"]+)"/) || h.match(/<img[^>]+src="([^"]+)"[^>]*class="EmbeddedMediaImage"/);
      const user = h.match(/class="UsernameText"[^>]*>([^<]+)</);
      const cap = h.match(/class="Caption"[^>]*>([\s\S]*?)<div class="CaptionComments"/);
      let title = '';
      if (cap) title = decode(cap[1].replace(/<a[^>]*class="CaptionUsername"[^>]*>[\s\S]*?<\/a>/, '').replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, ' '));
      const out = { image: img ? decode(img[1]) : '', author: user ? '@' + decode(user[1]).trim() : '', title: SH.clip(title, 300) };
      SH.plog(log, 'instagram embed: ' + (out.image ? 'picture' : 'no picture'));
      return out;
    } catch (e) { return null; }
  };

  I.preview = async (url, log) => {
    let p = null;
    try { p = await SH.genericPreview(url, 'instagram', log); } catch (e) { p = null; }
    if (p && p.images.length) return p;
    const e = await I.embed(url, log);
    if (!p && !(e && (e.image || e.title))) throw new Error('no preview');
    const out = p || { url, title: '', author: '', site: 'Instagram', images: [] };
    if (e) {
      if (e.image) out.images.push(e.image);
      out.title = out.title || e.title;
      out.author = out.author || e.author;
    }
    return out;
  };
})();
