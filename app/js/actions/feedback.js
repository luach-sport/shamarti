/* Feedback form actions: type, send, try again. */
(function () {
  'use strict';
  const SH = window.SH;
  const A = SH.A;
  const ui = SH.ui;

  A['fb-type'] = (el) => { ui.form.type = el.dataset.v; SH.renderSheet(); };
  A['feedback-retry'] = async () => {
    if (!SH.online()) { SH.toast('אין חיבור כרגע'); return; }
    const n = await SH.flushOutbox();
    SH.toast(n ? 'נשלח. תודה!' : 'עדיין לא הצלחתי לשלוח. ננסה שוב לבד.');
  };
  A['send-feedback'] = async () => {
    if (SH.feedbackBusy()) return;
    const f = ui.form, err = SH.feedbackErrors(f);
    f.err = err;
    if (Object.keys(err).length) { SH.renderSheet(); return; }
    SH.state.profile = { name: f.name.trim(), email: f.email.trim() };
    SH.state.outbox.push({ id: SH.uid(), ts: Date.now(), type: f.type, name: f.name.trim(), email: f.email.trim(), message: f.message.trim(), status: 'pending' });
    SH.state.outbox = SH.state.outbox.slice(-30);
    SH.save();
    f.message = ''; f.err = {};
    SH.renderSheet();
    if (!SH.online()) { SH.toast('נשמר. הפנייה תישלח כשיחזור האינטרנט'); return; }
    SH.toast('שולח…', 8000);
    const n = await SH.flushOutbox();
    SH.toast(n ? 'תודה! הפנייה נשלחה' : 'לא הצלחתי לשלוח כרגע. ננסה שוב לבד.');
  };
})();
