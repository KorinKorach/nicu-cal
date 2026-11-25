// מחשבון סיכון לזיהום מוקדם (EOS) - מודל מעודכן 2024
// מקור: Kuzniewicz MW et al. Pediatrics 2024;154(4):e2023065267, Table 2
(function (root) {
  const NT = (root.NT = root.NT || {});

  const B = {
    intercept: 57.29929499,
    temp: 0.85194656,      // טמפרטורה אימהית מרבית, פרנהייט
    ga: -7.72247124,       // שבוע לידה (עשרוני, ימים/7)
    ga2: 0.09842383,
    rom: 0.86770862,       // (שעות + 0.05)^(1/5)
    abx1: -2.13142945,     // אנטיביוטיקה GBS ספציפית >=2ש' או רחבת טווח 2-3.9ש'
    abx2: -2.33985917,     // רחבת טווח >=4ש'
    gbsPos: 1.02265353,
    gbsUnk: 1.13710111,
  };
  const COHORT_INCIDENCE = 0.0002763; // שכיחות KPNC כפי שמופיעה ב-FAQ של Kaiser
  const LR = { well: 0.36, equivocal: 3.65, ill: 14.5 };
  // המקדם החופשי לכל שכיחות כפי שמופיע ב-FAQ של Kaiser (ModelUpdateFAQ)
  const INTERCEPT_TABLE = {
    "0.05": 55.6, "0.10": 56.3, "0.20": 57.0, "0.30": 57.4, "0.40": 57.7, "0.50": 57.9,
    "0.60": 58.1, "0.70": 58.2, "0.80": 58.4, "0.90": 58.5, "1.00": 58.6, "2.00": 59.3,
    "4.00": 60.0, "5.00": 60.2, "0.27": 57.29929499,
  };

  const logit = (p) => Math.log(p / (1 - p));
  const expit = (x) => 1 / (1 + Math.exp(-x));

  // in: {incidencePer1000, gaWeeks, gaDays, tempF, romHours, gbs:'neg'|'pos'|'unk', abx:'none'|'gbs2'|'broad2'|'broad4'}
  NT.sepsisRisk = function (i) {
    const gaW = i.gaWeeks + (i.gaDays || 0) / 7;
    if (!(gaW >= 34 && gaW <= 43)) return { error: "המודל מיועד לשבוע 34–43 (נבנה לשבוע 35 ומעלה)" };
    if (!(i.tempF >= 95 && i.tempF <= 106)) return { error: "טמפרטורה לא סבירה" };
    if (!(i.romHours >= 0)) return { error: "יש להזין זמן ירידת מים" };
    const abx1 = i.abx === "gbs2" || i.abx === "broad2" ? 1 : 0;
    const abx2 = i.abx === "broad4" ? 1 : 0;
    const z =
      B.intercept + B.temp * i.tempF + B.ga * gaW + B.ga2 * gaW * gaW +
      B.rom * Math.pow(i.romHours + 0.05, 0.2) + B.abx1 * abx1 + B.abx2 * abx2 +
      (i.gbs === "pos" ? B.gbsPos : 0) + (i.gbs === "unk" ? B.gbsUnk : 0);
    // התאמת הנקודה לשכיחות המקומית
    // Kaiser מפרסמים מקדם חופשי מעוגל לספרה אחת לכל שכיחות (FAQ), והמחשבון שלהם משתמש בו.
    const rounded = INTERCEPT_TABLE[i.incidencePer1000.toFixed(2)];
    const adj = rounded !== undefined ? rounded - B.intercept
      : logit(i.incidencePer1000 / 1000) - logit(COHORT_INCIDENCE);
    const priorOdds = Math.exp(z + adj);
    const res = { atBirth: priorOdds / (1 + priorOdds) * 1000 };
    ["well", "equivocal", "ill"].forEach(function (k) {
      const o = priorOdds * LR[k];
      res[k] = (o / (1 + o)) * 1000;
    });
    return res;
  };
  // המלצות. נגזרו מקריאות של האתר של Kaiser (גרסת 2024):
  //   מאומת: <1 בלי תרבית ובלי אנטיביוטיקה; בדיקת דם אצל "גבולי" בסיכון 1-3; אנטיביוטיקה אצל גבולי מעל 3;
  //   מחלה קלינית: "לשקול" בסיכון נמוך (1.66) ו"אנטיביוטיקה" בסיכון גבוה (5.81);
  //   מדדים חיוניים ליילוד תקין: כל 4 שעות כשהסיכון בלידה >=1, אחרת שגרתי.
  //   לא נבדק ישירות: תינוק תקין עם סיכון >=1 לאחר בדיקה (נגזר מאותם ספים).
  // status: 'well' | 'equivocal' | 'ill'; risk: סיכון לאחר בדיקה; birthRisk: סיכון בלידה (לאלף)
  NT.sepsisAdvice = function (status, risk, birthRisk) {
    let action, vitals;
    if (status === "ill") {
      action = risk >= 3 ? "abx" : "consider-abx";
      vitals = "nicu";
    } else if (risk >= 3) {
      action = "abx"; vitals = "nicu";
    } else if (risk >= 1) {
      action = "culture"; vitals = "q4h";
    } else {
      action = "none";
      vitals = status === "well" && birthRisk >= 1 ? "q4h" : "routine";
    }
    return { action: action, vitals: vitals };
  };
})(typeof window !== "undefined" ? window : globalThis);
