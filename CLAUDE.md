# שמרתי – הוראות לעבודה על הפרויקט

- האפליקציה: `www/` (HTML/JS בלי תלויות, נארזת ל-APK עם Capacitor). כל push ל-main בונה APK, מפרסם Release ועדכון חתום שנכנס מתוך האפליקציה.
- **מה חדש**: לפני כל גרסה כותבים את השינויים ב-`release-notes.txt` (שורה לכל שינוי, בשפה פשוטה). זה מוצג בחלון "גרסה חדשה" באפליקציה.
- מספר גרסה: `APP_VERSION` ב-`.github/workflows/build.yml` (ובברירות המחדל ב-`scripts/prepare-web.mjs`, `scripts/make-update.mjs`).
- שינוי בחלק הנייטיב (`scripts/patch-android.sh`, `capacitor.config.json`, `android-res/`, תוספים ב-`package.json`) מחייב התקנת APK חדש. האפליקציה מזהה את זה לבד ומציעה להוריד APK במקום עדכון פנימי.
- שיתוף מאפליקציות אחרות: `MainActivity` (נכתב ב-`patch-android.sh`) הופך ACTION_SEND לקישור `shamarti://share?text=…`, והאפליקציה מקבלת אותו דרך תוסף App (`getLaunchUrl` / `appUrlOpen`).
- הנתונים: `state-a.json` / `state-b.json` בתיקיית הנתונים של האפליקציה (כתיבה לסירוגין, נטען הכי חדש ותקין). התמונות: `thumbs/<id>.jpg` לידם.
- פניות מהאפליקציה נשלחות לסקריפט Google Apps Script של המפתח, אותו סקריפט של MyCar (`feedback/Code.gs`, הכתובת ב-`SH.FEEDBACK_URL`). האפליקציה שולחת `app: 'shamarti'` והסקריפט כותב במייל מאיזו אפליקציה הפנייה. כתובת המייל של המפתח לא נכנסת לקוד.
- קרדיט: "פותח על ידי Itzko" בתחתית מסך ההגדרות.
