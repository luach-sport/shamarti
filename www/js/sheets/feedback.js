/* Feedback form (same as MyCar's; the e-mail says it came from שמרתי). Can open with a message ready,
   for example the technical details of a picture or a download that failed. */
(function () {
  'use strict';
  const SH = window.SH;
  const { esc, icon } = SH;
  const ui = SH.ui;
  const TYPES = [{ v: 'idea', label: 'הצעת ייעול' }, { v: 'bug', label: 'תקלה' }, { v: 'other', label: 'אחר' }];

  function sentList() {
    const box = SH.state.outbox.slice().reverse();
    if (!box.length) return '';
    let h = '<span class="section-label">הפניות שלי</span><div class="card list">';
    box.slice(0, 6).forEach((m) => {
      const st = m.status === 'sent' ? { i: 'check', t: 'נשלחה ' + SH.time(m.sentAt || m.ts) }
        : m.status === 'failed' ? { i: 'alert', t: 'עוד לא נשלחה' + (m.error ? ': ' + m.error : '') }
        : SH.online() ? { i: 'clock', t: 'בשליחה…' } : { i: 'clock', t: 'תישלח כשיחזור האינטרנט' };
      h += '<div class="row"><span class="tile" style="' + SH.colorVars(m.status === 'sent' ? 'green' : 'amber') + '">' + icon(st.i) + '</span><span class="grow"><span class="t">' + esc(String(m.message).slice(0, 60)) + (m.message.length > 60 ? '…' : '') + '</span><span class="s">' + esc(SH.dayLabel(m.ts)) + ' · ' + esc(st.t) + '</span></span></div>';
    });
    h += '</div>';
    if (box.some((m) => m.status !== 'sent') && SH.online() && !SH.feedbackBusy()) h += '<button type="button" class="btn secondary" data-action="feedback-retry">' + icon('refresh') + 'לנסות לשלוח שוב</button>';
    return h;
  }

  SH.SHEETS.feedback = {
    full: true,
    title: () => 'פנייה / הצעת ייעול',
    init: (d) => { const p = SH.state.profile; ui.form = { type: d.type || 'idea', name: p.name, email: p.email, message: d.message || '', err: {} }; },
    render: () => {
      const f = ui.form, e = f.err || {}, busy = SH.feedbackBusy();
      return '<p class="fine" style="font-size:14px">יש לך רעיון מה להוסיף? משהו לא עובד? כתוב כאן והפנייה תגיע ישירות למפתח.</p>' +
        '<div class="seg" role="group" aria-label="סוג הפנייה">' + TYPES.map((t) => '<button type="button" data-action="fb-type" data-v="' + t.v + '" aria-pressed="' + (f.type === t.v) + '">' + t.label + '</button>').join('') + '</div>' +
        '<div class="field"><label for="fbn">שם מלא *</label><input id="fbn" class="input" autocomplete="name" data-f="name" value="' + esc(f.name) + '" aria-required="true">' + (e.name ? '<span class="hint bad">' + e.name + '</span>' : '') + '</div>' +
        '<div class="field"><label for="fbe">אימייל *</label><input id="fbe" class="input ltr" style="text-align:left" type="email" inputmode="email" autocomplete="email" data-f="email" value="' + esc(f.email) + '" aria-required="true">' + (e.email ? '<span class="hint bad">' + e.email + '</span>' : '<span class="hint">כדי שנוכל לחזור אליך</span>') + '</div>' +
        '<div class="field"><label for="fbm">מה תרצה להגיד? *</label><textarea id="fbm" class="input" data-f="message" aria-required="true" placeholder="למשל: הייתי רוצה שאפשר יהיה לשמור גם תמונות מהגלריה">' + esc(f.message) + '</textarea>' + (e.message ? '<span class="hint bad">' + e.message + '</span>' : '') + '</div>' +
        '<button type="button" class="btn" data-action="send-feedback"' + (busy ? ' aria-disabled="true"' : '') + '>' + icon('message') + (busy ? 'שולח…' : 'שליחת הפנייה') + '</button>' +
        (SH.online() ? '' : '<p class="fine" style="text-align:center">אין חיבור כרגע. הפנייה תישמר ותישלח לבד כשיחזור האינטרנט.</p>') +
        sentList();
    }
  };
})();
