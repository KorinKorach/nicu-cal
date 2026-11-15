// חישוב גיל מתוקן / גיל הריון מצטבר
// קלט: שבוע לידה, ימים נוספים, גיל כרונולוגי בשעות
(function (root) {
  const NT = (root.NT = root.NT || {});

  function fmtWD(totalDays) {
    const w = Math.floor(totalDays / 7);
    const d = totalDays - w * 7;
    return { weeks: w, days: d };
  }

  // gaWeeks, gaDays: גיל הריון בלידה. ageHours: גיל כרונולוגי בשעות.
  NT.correctedAge = function (gaWeeks, gaDays, ageHours) {
    if (!(gaWeeks >= 22 && gaWeeks <= 44)) return { error: "שבוע לידה צריך להיות בין 22 ל-44" };
    gaDays = gaDays || 0;
    if (gaDays < 0 || gaDays > 6) return { error: "ימים חייבים להיות בין 0 ל-6" };
    if (!(ageHours >= 0)) return { error: "יש להזין גיל בשעות" };

    const gaTotalDays = gaWeeks * 7 + gaDays;
    const ageDaysExact = ageHours / 24;
    const ageWholeDays = Math.floor(ageDaysExact); // ימים שלמים בלבד
    const pmaDays = gaTotalDays + ageWholeDays;     // גיל מצטבר (PMA)
    const pma = fmtWD(pmaDays);

    // גיל מתוקן = גיל כרונולוגי פחות מה שחסר ל-40 שבועות
    const prematureDays = Math.max(0, 40 * 7 - gaTotalDays);
    const corrDays = ageWholeDays - prematureDays;
    const res = {
      pma, ageWholeDays, ageDaysExact,
      premature: gaTotalDays < 37 * 7,
      weeksEarly: fmtWD(prematureDays),
      chrono: fmtWD(ageWholeDays),
    };
    if (corrDays >= 0) res.corrected = fmtWD(corrDays);
    else res.beforeTerm = fmtWD(-corrDays); // עדיין לפני 40 שבועות
    return res;
  };
})(typeof window !== "undefined" ? window : globalThis);
