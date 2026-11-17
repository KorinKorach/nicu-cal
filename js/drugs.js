// מחשבון תרופות IV: אמפיצילין וגנטמיצין
// הנוסחאות לפי נוהל המחלקה (כפי שנמסר על ידי קורין). כל המספרים מוצגים בחיתוך לשתי ספרות אחרי הנקודה.
(function (root) {
  const NT = (root.NT = root.NT || {});

  // חיתוך (לא עיגול) לשתי ספרות אחרי הנקודה
  const cut2 = (x) => Math.floor(x * 100 + 1e-6) / 100;

  // משקל בגרמים. מחזיר { kg } או { error }
  function weightKg(grams) {
    if (!(grams > 0)) return { error: "יש להזין משקל בגרמים" };
    if (grams < 100) return { error: "המשקל מוזן בגרמים (למשל 3000), לא בקילוגרמים" };
    if (grams < 400 || grams > 6000) return { error: "המשקל לא סביר (400 עד 6000 גרם). יש לבדוק את ההזנה" };
    return { kg: grams / 1000 };
  }

  // אמפיצילין: 50 מ"ג/ק"ג. מאריך 1 מ"ל: כופלים ב-5/4. ריכוז 200 מ"ג/מ"ל (1000 מ"ג ב-5 מ"ל)
  NT.ampicillin = function (grams) {
    const w = weightKg(grams);
    if (w.error) return { error: w.error };
    const dose = 50 * w.kg;
    const withExt = (dose * 5) / 4;
    const draw = cut2(withExt / 200);
    const saline = cut2(5 - draw);
    return { kg: w.kg, perKg: 50, dose: dose, withExt: withExt, draw: draw, saline: saline, give: 4 };
  };

  // קלפורן (צפוטקסים): אותו חישוב כמו אמפיצילין. בקבוקון 1000 מ"ג מומס ב-4 מ"ל מים להזרקה, נפח סופי 4.5 מ"ל
  NT.cefotaxime = function (grams) {
    const w = weightKg(grams);
    if (w.error) return { error: w.error };
    const dose = 50 * w.kg;
    const withExt = (dose * 5) / 4;
    const draw = cut2((withExt * 4.5) / 1000);
    const saline = cut2(5 - draw);
    return { kg: w.kg, perKg: 50, dose: dose, withExt: withExt, draw: draw, saline: saline, give: 4 };
  };

  // גנטמיצין: מינון לפי שבוע לידה (שורת 0-7 ימים), ריכוז 3 מ"ג/מ"ל מוכן
  NT.gentamicin = function (grams, gaWeeks) {
    const w = weightKg(grams);
    if (w.error) return { error: w.error };
    if (!(gaWeeks >= 22 && gaWeeks <= 44)) return { error: "שבוע הלידה צריך להיות בין 22 ל-44" };
    const perKg = gaWeeks >= 35 ? 4 : gaWeeks >= 30 ? 4.5 : 5;
    const dose = perKg * w.kg;
    const res = { kg: w.kg, perKg: perKg, dose: dose };
    // החלטה לפי כמות המינון: מ-12 מ"ג (4 מ"ל) ומעלה - טהור (PURE) ותוספת 3 מ"ג למאריך
    if (dose < 12) {
      res.mode = "dilute";
      res.withExt = (dose * 5) / 4;
      res.draw = cut2(res.withExt / 3);
      res.saline = cut2(5 - res.draw);
      res.give = 4;
    } else {
      res.mode = "pure";
      res.withExt = dose + 3;
      res.draw = cut2(res.withExt / 3);
      res.give = cut2(dose / 3);
      res.saline = 0;
    }
    return res;
  };
})(typeof window !== "undefined" ? window : globalThis);
