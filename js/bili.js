// סף טיפול באור וחילוף דם
// >=35 שבועות: AAP 2022 (Kemper et al., טבלאות משלימות 1-4)
// <35 שבועות: Stanford Premie BiliRecs (מבוסס Maisels 2012, J Perinatol)
(function (root) {
  const NT = (root.NT = root.NT || {});

  function at(arr, hours) {
    const i = Math.max(0, Math.floor(hours));
    return i >= arr.length ? arr[arr.length - 1] : arr[i];
  }

  // גיל (בשעות) שממנו הסף קבוע (פלאטו). אם יש הערת שוליים בטבלה של AAP משתמשים בה, אחרת לפי הטבלה עצמה.
  const FOOT = {
    photoNoRF: { "40+": 96, "39": 157, "38": 325 },
    photoRF: { "38+": 96, "37": 151 },
    exchNoRF: { "38+": 96, "37": 151 },
  };
  function plateauFrom(arr, foot) {
    if (foot !== undefined) return foot;
    const last = arr[arr.length - 1];
    let i = arr.length - 1;
    while (i > 0 && arr[i - 1] === last) i--;
    return i;
  }

  // ga: שבוע לידה שלם (35 ומעלה). rf: יש גורם סיכון נוירוטוקסי נוסף (מעבר לפגות).
  NT.biliAAP = function (ga, ageHours, rf) {
    ga = Math.floor(ga);
    if (ga < 35) return { error: "מתחת ל-35 שבועות משתמשים בחישוב הפגים" };
    if (!(ageHours >= 0)) return { error: "יש להזין גיל בשעות" };
    const A = NT.AAP;
    const photoName = rf ? "photoRF" : "photoNoRF", exchName = rf ? "exchRF" : "exchNoRF";
    const photoKey = ga >= (rf ? 38 : 40) ? (rf ? "38+" : "40+") : String(ga);
    const exchKey = ga >= 38 ? "38+" : String(ga);
    const photoArr = A[photoName][photoKey], exchArr = A[exchName][exchKey];
    return {
      photo: at(photoArr, ageHours),
      exchange: at(exchArr, ageHours),
      photoFrom: plateauFrom(photoArr, (FOOT[photoName] || {})[photoKey]),
      exchFrom: plateauFrom(exchArr, (FOOT[exchName] || {})[exchKey]),
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
    // הסף מפסיק לעלות כשגיל ההריון המצטבר מגיע ל-35 שבועות (סוף טווח הכלי של Stanford)
    const from = Math.max(0, (35 * 7 - days) * 24);
    return {
      pma: { weeks: Math.floor(pma / 7), days: pma % 7 },
      photo: r1(interp(rf ? ANCHORS.photoRF : ANCHORS.photoNoRF, pma)),
      exchange: r1(interp(rf ? ANCHORS.exchRF : ANCHORS.exchNoRF, pma)),
      warnings: warnings,
      photoFrom: from,
      exchFrom: from,
    };
  };

  // פגים 24 עד 34 שבועות: עקומות NICE (CG98), בקריאה מהעקומות שהוצגו במחלקה.
  // בלידה: אור 40, חילוף 80 מיקרומול/ל'. עולה בקו ישר עד גיל 72 שעות (3 ימים) ואז קבוע.
  // רמת הרצפה (מגיל 3 ימים): חילוף = 10 × שבוע, אור = חילוף פחות 100. המרה למ"ג/ד"ל: חלוקה ב-17.
  NT.biliNICE = function (gaWeeks, ageHours) {
    const w = Math.floor(gaWeeks);
    if (w < 24) return { error: "העקומות מיועדות לשבוע 24 ומעלה" };
    if (w > 34) return { error: "מגיל 35 שבועות משתמשים בלשונית הצהבת הרגילה" };
    if (!(ageHours >= 0)) return { error: "יש להזין גיל בשעות" };
    const f = Math.min(ageHours, 72) / 72;
    const exchUm = 80 + (10 * w - 80) * f, photoUm = 40 + (10 * w - 100 - 40) * f;
    return {
      week: w,
      photoUm: photoUm, exchUm: exchUm,
      photo: photoUm / 17, exchange: exchUm / 17,
      photoFrom: 72, exchFrom: 72,
      beyond: ageHours > 14 * 24,
    };
  };
})(typeof window !== "undefined" ? window : globalThis);
