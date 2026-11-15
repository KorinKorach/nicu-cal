// סף טיפול באור וחילוף דם
// >=35 שבועות: AAP 2022 (Kemper et al., טבלאות משלימות 1-4)
// <35 שבועות: Stanford Premie BiliRecs (מבוסס Maisels 2012, J Perinatol)
(function (root) {
  const NT = (root.NT = root.NT || {});

  function at(arr, hours) {
    const i = Math.max(0, Math.floor(hours));
    return i >= arr.length ? arr[arr.length - 1] : arr[i];
  }

  // ga: שבוע לידה שלם (35 ומעלה). rf: יש גורם סיכון נוירוטוקסי נוסף (מעבר לפגות).
  NT.biliAAP = function (ga, ageHours, rf) {
    ga = Math.floor(ga);
    if (ga < 35) return { error: "מתחת ל-35 שבועות משתמשים בחישוב הפגים" };
    if (!(ageHours >= 0)) return { error: "יש להזין גיל בשעות" };
    const A = NT.AAP;
    const photoTab = rf ? A.photoRF : A.photoNoRF;
    const exchTab = rf ? A.exchRF : A.exchNoRF;
    const photoKey = ga >= (rf ? 38 : 40) ? (rf ? "38+" : "40+") : String(ga);
    const exchKey = ga >= 38 ? "38+" : String(ga);
    return {
      photo: at(photoTab[photoKey], ageHours),
      exchange: at(exchTab[exchKey], ageHours),
    };
  };

  // פגים מתחת ל-35: ערך לפי גיל הריון מצטבר (PMA), בקו ישר בין נקודות עוגן בכל שבוע שלם.
  // נקודות העוגן נלקחו מהטווחים בטבלה של Maisels 2012 ואומתו מול הכלי של Stanford/PediTools.
  // שבוע:           27    28    29    30    31    32    33    34    35
  const ANCHORS = {
    photoNoRF: [6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0, 13.0, 14.0],
    photoRF:   [5.0, 5.5, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0],
    exchNoRF:  [14.0, 14.0, 14.5, 15.0, 16.0, 17.0, 18.0, 18.5, 19.0],
    exchRF:    [11.0, 11.5, 12.0, 12.5, 13.0, 14.0, 15.0, 16.0, 17.0],
  };
  function interp(a, pmaDays) {
    const w = pmaDays / 7 - 27;
    if (w >= 8) return a[8];
    const i = Math.floor(w), f = w - i;
    return a[i] + (a[i + 1] - a[i]) * f;
  }
  const r1 = (x) => Math.round(x * 10 + 1e-9) / 10;

  NT.biliPreterm = function (gaWeeks, gaDays, ageHours, rf) {
    const days = gaWeeks * 7 + (gaDays || 0);
    if (days >= 35 * 7) return { error: "נולד בשבוע 35 ומעלה" };
    if (!(ageHours >= 0)) return { error: "יש להזין גיל בשעות" };
    const pma = days + Math.floor(ageHours / 24);
    if (pma < 27 * 7) return { error: "הכלי מיועד לגיל מצטבר 27 שבועות ומעלה" };
    const warnings = [];
    if (ageHours < 48) warnings.push("הכלי לא מיועד לתינוקות מתחת ל-48 שעות");
    if (pma >= 35 * 7) warnings.push("גיל מצטבר 35 שבועות ומעלה: יש להשוות גם ל-AAP 2022 כאילו נולד בשבוע 35");
    return {
      pma: { weeks: Math.floor(pma / 7), days: pma % 7 },
      photo: r1(interp(rf ? ANCHORS.photoRF : ANCHORS.photoNoRF, pma)),
      exchange: r1(interp(rf ? ANCHORS.exchRF : ANCHORS.exchNoRF, pma)),
      warnings: warnings,
    };
  };
})(typeof window !== "undefined" ? window : globalThis);
