/* App identity, version and where feedback messages go. */
(function () {
  'use strict';
  const SH = (window.SH = window.SH || {});

  SH.VERSION = window.SHAMARTI_VERSION || { version: '1.1', build: 'dev' };
  SH.APP_ID = 'com.luachsport.shamarti';
  SH.REPO = 'luach-sport/shamarti';
  // Feedback goes to the developer's own Google Apps Script (shared with MyCar), which e-mails only the
  // developer and says which app the message came from. No e-mail address ships in the app.
  SH.FEEDBACK_URL = 'https://script.google.com/macros/s/AKfycbwuxeoRQSIFoCfTrJqJ_QUeF1JANm0H4PY5Mc00Ns8hBm9K8lvJ2S5hBYQOVtA3lZX1lw/exec';
  SH.FEEDBACK_KEY = 'mc_9-ATPT_LPmYj188PGtCksaLh';
  SH.FEEDBACK_APP = 'shamarti';
})();
