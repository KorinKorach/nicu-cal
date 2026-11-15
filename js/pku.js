// מועדי בדיקת סקר ילודים (PKU) לפי שעת לידה
(function (root) {
  const NT = (root.NT = root.NT || {});
  const HOUR = 3600 * 1000;

  function addMonth(d) {
    const r = new Date(d.getTime());
    const day = r.getDate();
    r.setDate(1);
    r.setMonth(r.getMonth() + 1);
    const last = new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate();
    r.setDate(Math.min(day, last));
    return r;
  }

  // birth: Date, now: Date
  NT.pkuSchedule = function (birth, now) {
    now = now || new Date();
    const b = birth.getTime();
    const items = [
      { key: "t1", title: "בדיקה ראשונה (תינוק שאוכל)", note: "בגיל 36 עד 72 שעות",
        start: new Date(b + 36 * HOUR), end: new Date(b + 72 * HOUR) },
      { key: "t2", title: "בדיקה שנייה", note: "בגיל 7 עד 10 ימים",
        start: new Date(b + 7 * 24 * HOUR), end: new Date(b + 10 * 24 * HOUR) },
      { key: "t3", title: "בדיקה שלישית", note: "בגיל חודש",
        start: addMonth(birth), end: addMonth(birth) },
    ];
    items.forEach(function (it) {
      const n = now.getTime();
      if (n < it.start.getTime()) it.status = "upcoming";
      else if (n <= it.end.getTime()) it.status = "now";
      else it.status = it.key === "t3" ? "now" : "passed";
      it.single = it.start.getTime() === it.end.getTime();
    });
    // בדיקה בגיל חודש: "היום" אם עבר מועדה. מציגים כ"הגיע המועד"
    return items;
  };
})(typeof window !== "undefined" ? window : globalThis);
