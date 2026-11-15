(function () {
  const $ = (id) => document.getElementById(id);
  const wd = (o) => o.weeks + " שבועות ו-" + o.days + " ימים";

  document.querySelectorAll("#tabs button").forEach((b) =>
    b.addEventListener("click", () => {
      document.querySelectorAll("#tabs button,.panel").forEach((e) => e.classList.remove("on"));
      b.classList.add("on");
      $(b.dataset.tab).classList.add("on");
    })
  );

  function renderAge() {
    const out = $("age-out");
    const w = parseInt($("age-w").value, 10), d = parseInt($("age-d").value || "0", 10), h = parseFloat($("age-h").value);
    if (isNaN(w) || isNaN(h)) { out.textContent = ""; return; }
    const r = NT.correctedAge(w, d, h);
    if (r.error) { out.innerHTML = '<p class="err">' + r.error + "</p>"; return; }
    let html = '<div class="card"><b>גיל הריון מצטבר (PMA)</b><span class="big">' + wd(r.pma) + "</span></div>";
    html += '<div class="card"><b>גיל כרונולוגי</b>' + r.ageWholeDays + " ימים שלמים</div>";
    if (r.premature) {
      html += '<div class="card"><b>גיל מתוקן (ביחס ל-40 שבועות)</b>' +
        (r.corrected ? '<span class="big">' + wd(r.corrected) + "</span>" :
          '<span class="big">עוד ' + wd(r.beforeTerm) + " ל-40 שבועות</span>") + "</div>";
    } else {
      html += '<div class="card">נולד/ה בשבוע 37 ומעלה – אין תיקון גיל.</div>';
    }
    out.innerHTML = html;
  }
  ["age-w", "age-d", "age-h"].forEach((i) => $(i).addEventListener("input", renderAge));

  const fmt = (d) => d.toLocaleString("he-IL", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const fmtDay = (d) => d.toLocaleDateString("he-IL", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
  const label = { upcoming: "עדיין לא הגיע", now: "זה הזמן", passed: "המועד עבר" };

  function renderPku() {
    const out = $("pku-out");
    if (!$("pku-birth").value) { out.textContent = ""; return; }
    const items = NT.pkuSchedule(new Date($("pku-birth").value), new Date());
    out.innerHTML = items.map((it) =>
      '<div class="card st-' + it.status + '"><b>' + it.title + "</b>" + it.note + "<br>" +
      (it.single ? fmtDay(it.start) : "מ-" + fmt(it.start) + "<br>עד " + fmt(it.end)) +
      "<br><small>" + label[it.status] + "</small></div>").join("");
  }
  $("pku-birth").addEventListener("input", renderPku);

  // ---------- צהבת ----------
  const num1 = (x) => (Math.round(x * 10) / 10).toString();
  function biliCard(title, r, v, aap) {
    const esc = aap ? r.exchange - 2 : null;
    let cls = "", status = "";
    if (v !== null && !isNaN(v)) {
      if (v >= r.exchange) { cls = "bad"; status = "בילירובין בסף חילוף דם או מעליו"; }
      else if (aap && v >= esc) { cls = "bad"; status = "בטווח הסלמת הטיפול (פחות מ-2 מתחת לסף חילוף הדם)"; }
      else if (v >= r.photo) { cls = "mid"; status = "בילירובין בסף פוטותרפיה או מעליו"; }
      else { cls = "ok"; status = "מתחת לסף פוטותרפיה"; }
    }
    return '<div class="card ' + cls + '"><b>' + title + "</b>" +
      "פוטותרפיה: <span class=\"big\">" + num1(r.photo) + "</span> mg/dL<br>" +
      "חילוף דם: <span class=\"big\">" + num1(r.exchange) + "</span> mg/dL" +
      (aap ? "<br>הסלמת טיפול: מ-" + num1(esc) + " mg/dL" : "") +
      (status ? "<br><b>" + status + "</b>" : "") + "</div>";
  }
  function renderBili() {
    const out = $("bili-out");
    const w = parseInt($("bili-w").value, 10), d = parseInt($("bili-d").value || "0", 10), h = parseFloat($("bili-h").value);
    const rf = $("bili-rf").checked, vRaw = $("bili-v").value, v = vRaw === "" ? null : parseFloat(vRaw);
    if (isNaN(w) || isNaN(h)) { out.textContent = ""; return; }
    if (d < 0 || d > 6) { out.innerHTML = '<p class="err">ימים חייבים להיות בין 0 ל-6</p>'; return; }
    let html = "";
    if (w >= 35) {
      const r = NT.biliAAP(w, h, rf);
      if (r.error) { out.innerHTML = '<p class="err">' + r.error + "</p>"; return; }
      html = biliCard("AAP 2022 (35 שבועות ומעלה)", r, v, true);
    } else {
      const r = NT.biliPreterm(w, d, h, rf);
      if (r.error) { out.innerHTML = '<p class="err">' + r.error + "</p>"; return; }
      html = biliCard("Stanford Premie BiliRecs (פגים), גיל מצטבר " + wd(r.pma), r, v, false);
      r.warnings.forEach((x) => (html += '<p class="warn">' + x + "</p>"));
      if (r.pma.weeks >= 35) {
        const a = NT.biliAAP(35, h, rf);
        html += biliCard("להשוואה: AAP 2022 כאילו נולד בשבוע 35", a, v, true);
      }
    }
    out.innerHTML = html;
  }
  ["bili-w", "bili-d", "bili-h", "bili-rf", "bili-v"].forEach((i) => $(i).addEventListener("input", renderBili));

  // ---------- זיהום ----------
  ["0.05", "0.10", "0.20", "0.27", "0.30", "0.40", "0.50", "0.60", "0.70", "0.80", "0.90", "1.00", "2.00", "4.00", "5.00"].forEach(function (v) {
    const o = document.createElement("option");
    o.value = v;
    o.textContent = v + " לאלף" + (v === "0.27" ? " (KPNC)" : v === "0.50" ? " (ארה\"ב, CDC)" : "");
    if (v === "0.50") o.selected = true;
    $("sp-inc").appendChild(o);
  });
  const ACT = { none: "ללא תרבית וללא אנטיביוטיקה", culture: "בדיקת דם לתרבית", abx: "אנטיביוטיקה אמפירית", "consider-abx": "לשקול התחלת אנטיביוטיקה אמפירית" };
  const VIT = { routine: "מדדים חיוניים שגרתיים", q4h: "מדדים חיוניים כל 4 שעות למשך 24 שעות", nicu: "מדדים חיוניים לפי נוהל היחידה" };
  function renderSepsis() {
    const out = $("sp-out");
    const w = parseInt($("sp-w").value, 10), d = parseInt($("sp-d").value || "0", 10);
    let t = parseFloat($("sp-t").value); const rom = parseFloat($("sp-rom").value);
    const gbs = $("sp-gbs").value, abx = $("sp-abx").value;
    if (isNaN(w) || isNaN(t) || isNaN(rom) || !gbs || !abx) { out.textContent = ""; return; }
    if (d < 0 || d > 6) { out.innerHTML = '<p class="err">ימים חייבים להיות בין 0 ל-6</p>'; return; }
    if ($("sp-u").value === "C") t = t * 9 / 5 + 32;
    const r = NT.sepsisRisk({ incidencePer1000: parseFloat($("sp-inc").value), gaWeeks: w, gaDays: d, tempF: t, romHours: rom, gbs: gbs, abx: abx });
    if (r.error) { out.innerHTML = '<p class="err">' + r.error + "</p>"; return; }
    const f2 = (x) => (Math.round(x * 100) / 100).toFixed(2);
    let html = '<div class="card"><b>סיכון בלידה (לאלף)</b><span class="big">' + f2(r.atBirth) + "</span></div>";
    html += '<table class="t"><tr><th>מצב התינוק</th><th>סיכון</th><th>המלצה</th></tr>';
    [["well", "תקין"], ["equivocal", "גבולי"], ["ill", "מחלה קלינית"]].forEach(function (s) {
      const a = NT.sepsisAdvice(s[0], r[s[0]], r.atBirth);
      html += "<tr><td>" + s[1] + "</td><td>" + f2(r[s[0]]) + "</td><td>" + ACT[a.action] + "<br><small>" + VIT[a.vitals] + "</small></td></tr>";
    });
    html += "</table>";
    if (w < 35) html += '<p class="warn">המודל מיועד ל-35 שבועות ומעלה.</p>';
    html += '<p class="warn">הספים להמלצות נגזרו מהמחשבון של Kaiser. הסיכון מחושב לפי המודל המפורסם ב-Pediatrics 2024.</p>';
    out.innerHTML = html;
  }
  ["sp-inc", "sp-w", "sp-d", "sp-t", "sp-u", "sp-rom", "sp-gbs", "sp-abx"].forEach((i) => $(i).addEventListener("input", renderSepsis));

  // ---------- SGA / LGA ----------
  function renderSga() {
    const out = $("sg-out");
    const sex = $("sg-sex").value, w = parseInt($("sg-w").value, 10), d = parseInt($("sg-d").value || "0", 10), g = parseFloat($("sg-g").value);
    if (!sex || isNaN(w) || isNaN(g)) { out.textContent = ""; return; }
    if (d < 0 || d > 6) { out.innerHTML = '<p class="err">ימים חייבים להיות בין 0 ל-6</p>'; return; }
    const r = NT.fentonSize(sex, w, d, g);
    if (r.error) { out.innerHTML = '<p class="err">' + r.error + "</p>"; return; }
    const T = { SGA: ["bad", "קטן לגיל ההריון (SGA)"], AGA: ["ok", "גודל תקין לגיל ההריון (AGA)"], LGA: ["mid", "גדול לגיל ההריון (LGA)"] }[r.cls];
    let html = '<div class="card ' + T[0] + '"><b>' + T[1] + '</b>Z-score: <span class="big">' + r.z.toFixed(2) + "</span><br>אחוזון: <span class=\"big\">" + (r.percentile < 0.1 ? "פחות מ-0.1" : r.percentile > 99.9 ? "מעל 99.9" : r.percentile.toFixed(1)) + "</span></div>";
    html += '<div class="card">למין ולשבוע הזה:<br>אחוזון 10: ' + Math.round(r.p10) + " גרם<br>חציון: " + Math.round(r.median) + " גרם<br>אחוזון 90: " + Math.round(r.p90) + " גרם</div>";
    if (r.beyond3) html += '<p class="warn">Z-score מעל ‎±3: הערך מקורב. בכלי המקורי נעשה תיקון נוסף בקצוות.</p>';
    if (w + d / 7 >= 37) html += '<p class="warn">מגיל 37 שבועות הנתונים הם קירוב של הכלי המקורי.</p>';
    out.innerHTML = html;
  }
  ["sg-sex", "sg-w", "sg-d", "sg-g"].forEach((i) => $(i).addEventListener("input", renderSga));
})();
