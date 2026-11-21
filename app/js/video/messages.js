/* What to tell the user when a video can't be downloaded. */
(function () {
  'use strict';
  const SH = window.SH;

  SH.VIDEO_MSG = {
    blocked: 'היוצר חסם הורדות של הסרטון הזה בטיקטוק, ולכן אי אפשר להוריד אותו. אפשר לשתף אותו כקישור.',
    private: 'הסרטון פרטי בטיקטוק, ולכן אי אפשר להוריד אותו.',
    gone: 'הסרטון לא זמין בטיקטוק (אולי נמחק או הוסר), ולכן אי אפשר להוריד אותו.',
    photo: 'זה פוסט של תמונות, אין בו סרטון להורדה.',
    offline: 'אין חיבור לאינטרנט. אפשר לנסות שוב כשיחזור.',
    failed: 'לא הצלחתי להוריד את הסרטון. ייתכן שהיוצר חסם הורדות בטיקטוק, שהסרטון פרטי או נמחק, או שטיקטוק חוסם הורדות כרגע. אפשר לנסות שוב מאוחר יותר, או לשתף אותו כקישור.'
  };
  // Reasons that won't change by trying again: no "try again" button for them.
  SH.VIDEO_FINAL = ['blocked', 'private', 'gone', 'photo'];
})();
