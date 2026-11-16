(function () {
  const $ = (id) => document.getElementById(id);
  const wd = (o) => o.weeks + " שבועות ו-" + o.days + " ימים";
  const err = (m) => '<p class="err">' + m + "</p>";

  // שבוע+יום בשדה אחד: 36+3, 36.3, 36 3/7, או 36
  function parseGA(s) {
    s = (s || "").trim();
    if (!s) return null;
    const m = s.match(/^(\d{1,2})(?:\s*[+.,]\s*(\d)|\s+(\d)\s*\/\s*7)?$/);
    if (!m) return { error: "יש להזין שבוע ויום, למשל 36+3 או 36.3" };
    const w = parseInt(m[1], 10), d = parseInt(m[2] !== undefined ? m[2] : m[3] !== undefined ? m[3] : "0", 10);
    if (d > 6) return { error: "הימים חייבים להיות בין 0 ל-6" };
    return { w: w, d: d };
  }

  function show(tab) {
    document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("on", p.id === tab));
    window.scrollTo(0, 0);
  }
  // חץ חזרה לדף הבית בראש כל מחשבון
  document.querySelectorAll(".panel:not(#home)").forEach(function (p) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "back";
    b.dataset.tab = "home";
    b.setAttribute("aria-label", "חזרה לדף הבית");
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
    p.insertBefore(b, p.firstChild);
  });
  document.querySelectorAll("[data-tab]").forEach((el) => el.addEventListener("click", () => show(el.dataset.tab)));

  // ---------- גיל מתוקן ----------
  function renderAge() {
    const out = $("age-out"), ga = parseGA($("age-ga").value), h = parseFloat($("age-h").value);
    if (!ga || isNaN(h)) { out.textContent = ""; return; }
    if (ga.error) { out.innerHTML = err(ga.error); return; }
    const r = NT.correctedAge(ga.w, ga.d, h);
    if (r.error) { out.innerHTML = err(r.error); return; }
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
  ["age-ga", "age-h"].forEach((i) => $(i).addEventListener("input", renderAge));

  // ---------- PKU ----------
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

  // סרגל כללי: zones=[[עד, צבע],...] לפי pos (0..1), marker=0..1, labels=[[pos,טקסט]]
  function gaugeHtml(zones, marker, labels) {
    let prev = 0, bar = "";
    zones.forEach(function (z) { bar += '<i style="width:' + (z[0] - prev) * 100 + '%;background:' + z[1] + '"></i>'; prev = z[0]; });
    let lab = "";
    labels.forEach(function (l) { lab += '<span style="right:' + l[0] * 100 + '%">' + l[1] + "</span>"; });
    const mk = marker === null ? "" : '<div class="gmark" style="right:calc(' + marker * 100 + '% - 1px)"></div>';
    return '<div class="gauge"><div class="gbar">' + bar + mk + '</div><div class="glab">' + lab + "</div></div>";
  }
  const clamp01 = (x) => Math.max(0, Math.min(1, x));

  // ---------- SGA / LGA ----------
  function renderSga() {
    const out = $("sg-out"), sex = $("sg-sex").value, ga = parseGA($("sg-ga").value), g = parseFloat($("sg-g").value);
    if (!sex || !ga || isNaN(g)) { out.textContent = ""; return; }
    if (ga.error) { out.innerHTML = err(ga.error); return; }
    const r = NT.fentonSize(sex, ga.w, ga.d, g);
    if (r.error) { out.innerHTML = err(r.error); return; }
    const T = { SGA: ["bad", "קטן לגיל ההריון (SGA)"], AGA: ["ok", "גודל תקין לגיל ההריון (AGA)"], LGA: ["mid", "גדול לגיל ההריון (LGA)"] }[r.cls];
    const pct = r.percentile < 0.1 ? "פחות מ-0.1" : r.percentile > 99.9 ? "מעל 99.9" : r.percentile.toFixed(1);
    const zp = (z) => clamp01((z + 3) / 6);
    const sgGauge = gaugeHtml([[zp(-1.2816), "#DC2626"], [zp(1.2816), "#16A34A"], [1, "#D97706"]], zp(r.z), [[zp(-1.2816), "10"], [zp(1.2816), "90"]]);
    let html = '<div class="card ' + T[0] + '"><b>' + T[1] + '</b>' + sgGauge + 'אחוזון: <span class="big">' + pct + '</span><br>Z-score: <span class="big">' + r.z.toFixed(2) + "</span></div>";
    html += '<div class="card">למין ולשבוע הזה:<br>אחוזון 10: ' + Math.round(r.p10) + " גרם<br>חציון: " + Math.round(r.median) + " גרם<br>אחוזון 90: " + Math.round(r.p90) + " גרם</div>";
    if (r.beyond3) html += '<p class="warn">Z-score מעל ‎±3: הערך מקורב. בכלי המקורי נעשה תיקון נוסף בקצוות.</p>';
    out.innerHTML = html;
  }
  ["sg-sex", "sg-ga", "sg-g"].forEach((i) => $(i).addEventListener("input", renderSga));

  // ---------- צהבת ----------
  const num1 = (x) => (Math.round(x * 10) / 10).toString();
  function biliGauge(r, v) {
    const max = r.exchange + 3;
    const pct = (x) => Math.max(0, Math.min(100, (x / max) * 100));
    const stops = [[r.photo, "#16A34A"], [r.exchange, "#D97706"], [max, "#DC2626"]];
    let prev = 0, bar = "";
    stops.forEach(function (s) { bar += '<i style="width:' + (pct(s[0]) - pct(prev)) + '%;background:' + s[1] + '"></i>'; prev = s[0]; });
    let lab = "";
    [r.photo, r.exchange].forEach(function (m) { lab += '<span style="right:' + pct(m) + '%">' + num1(m) + "</span>"; });
    const mk = v !== null && !isNaN(v) ? '<div class="gmark" style="right:calc(' + pct(v) + '% - 1px)"></div>' : "";
    return '<div class="gauge"><div class="gbar">' + bar + mk + '</div><div class="glab">' + lab + "</div></div>";
  }
  function biliCard(title, r, v) {
    let cls = "", status = "";
    if (v !== null && !isNaN(v)) {
      if (v >= r.exchange) { cls = "bad"; status = "בילירובין בסף חילוף דם או מעליו"; }
      else if (v >= r.photo) { cls = "mid"; status = "בילירובין בסף פוטותרפיה או מעליו"; }
      else { cls = "ok"; status = "מתחת לסף פוטותרפיה"; }
    }
    return '<div class="card ' + cls + '"><b>' + title + "</b>" + (status ? "<b>" + status + "</b>" : "") +
      biliGauge(r, v) +
      'פוטותרפיה: <span class="big">' + num1(r.photo) + "</span> mg/dL<br>" +
      'חילוף דם: <span class="big">' + num1(r.exchange) + "</span> mg/dL</div>";
  }
  function renderBili() {
    const out = $("bili-out"), ga = parseGA($("bili-ga").value), h = parseFloat($("bili-h").value);
    const rf = $("bili-rf").checked, vRaw = $("bili-v").value, v = vRaw === "" ? null : parseFloat(vRaw);
    if (!ga || isNaN(h)) { out.textContent = ""; return; }
    if (ga.error) { out.innerHTML = err(ga.error); return; }
    let html = "";
    if (ga.w >= 35) {
      const r = NT.biliAAP(ga.w, h, rf);
      if (r.error) { out.innerHTML = err(r.error); return; }
      html = biliCard("AAP 2022 (35 שבועות ומעלה)", r, v);
    } else {
      const r = NT.biliPreterm(ga.w, ga.d, h, rf);
      if (r.error) { out.innerHTML = err(r.error); return; }
      html = biliCard("Stanford Premie BiliRecs (פגים), גיל מצטבר " + wd(r.pma), r, v);
      r.warnings.forEach((x) => (html += '<p class="warn">' + x + "</p>"));
      if (r.pma.weeks >= 35) html += biliCard("להשוואה: AAP 2022 כאילו נולד בשבוע 35", NT.biliAAP(35, h, rf), v);
    }
    out.innerHTML = html;
  }
  ["bili-ga", "bili-h", "bili-rf", "bili-v"].forEach((i) => $(i).addEventListener("input", renderBili));

  // ---------- זיהום ----------
  const SP_INCIDENCE = 0.5; // קבוע: ארה"ב, CDC
  const ACT = { none: "ללא תרבית וללא אנטיביוטיקה", culture: "בדיקת דם לתרבית", abx: "אנטיביוטיקה אמפירית", "consider-abx": "לשקול התחלת אנטיביוטיקה אמפירית" };
  const VIT = { routine: "מדדים חיוניים שגרתיים", q4h: "מדדים חיוניים כל 4 שעות למשך 24 שעות", nicu: "מדדים חיוניים לפי נוהל היחידה" };
  function renderSepsis() {
    const out = $("sp-out"), ga = parseGA($("sp-ga").value);
    let t = parseFloat($("sp-t").value); const rom = parseFloat($("sp-rom").value);
    const gbs = $("sp-gbs").value, abx = $("sp-abx").value;
    if (!ga || isNaN(t) || isNaN(rom) || !gbs || !abx) { out.textContent = ""; return; }
    if (ga.error) { out.innerHTML = err(ga.error); return; }
    if (ga.w < 34) { out.textContent = ""; return; }
    t = t * 9 / 5 + 32; // המודל בפרנהייט
    const r = NT.sepsisRisk({ incidencePer1000: SP_INCIDENCE, gaWeeks: ga.w, gaDays: ga.d, tempF: t, romHours: rom, gbs: gbs, abx: abx });
    if (r.error) { out.innerHTML = err(r.error); return; }
    const f2 = (x) => (Math.round(x * 100) / 100).toFixed(2);
    let html = '<div class="card"><b>סיכון בלידה (לאלף)</b><span class="big">' + f2(r.atBirth) + "</span></div>";
    const lp = (x) => clamp01((Math.log10(Math.max(x, 0.03)) - Math.log10(0.03)) / (Math.log10(30) - Math.log10(0.03)));
    [["well", "תקין"], ["equivocal", "גבולי"], ["ill", "מחלה קלינית"]].forEach(function (s) {
      const a2 = NT.sepsisAdvice(s[0], r[s[0]], r.atBirth);
      const cls = r[s[0]] >= 3 ? "bad" : r[s[0]] >= 1 ? "mid" : "ok";
      const gg = gaugeHtml([[lp(1), "#16A34A"], [lp(3), "#D97706"], [1, "#DC2626"]], lp(r[s[0]]), [[lp(1), "1"], [lp(3), "3"]]);
      html += '<div class="card ' + cls + '"><b>מצב התינוק: ' + s[1] + '</b>סיכון: <span class="big">' + f2(r[s[0]]) + "</span> לאלף" + gg + ACT[a2.action] + "<br><small>" + VIT[a2.vitals] + "</small></div>";
    });
    out.innerHTML = html;
  }
  ["sp-ga", "sp-t", "sp-rom", "sp-gbs", "sp-abx"].forEach((i) => $(i).addEventListener("input", renderSepsis));
  function spGaWarn() {
    const ga = parseGA($("sp-ga").value), el = $("sp-gawarn");
    let m = "", cls = "warn";
    const low = !!(ga && !ga.error && ga.w < 34);
    if (ga && !ga.error) {
      if (low) { m = "המודל לא מיועד למתחת ל-34 שבועות"; cls = "warn red"; }
      else if (ga.w === 34) { m = "המודל נבדק על 35 שבועות ומעלה"; cls = "warn amber"; }
    }
    el.textContent = m;
    el.className = cls;
    el.hidden = !m;
    ["sp-t", "sp-rom", "sp-gbs", "sp-abx"].forEach(function (id) {
      $(id).disabled = low;
      $(id).closest("label").classList.toggle("off", low);
    });
    if (low) $("sp-out").textContent = "";
  }
  $("sp-ga").addEventListener("input", spGaWarn);

  // ---------- שמירת הגיל בין לשוניות ----------
  const SHARED_GA = ["age-ga", "bili-ga", "sg-ga", "sp-ga"], SHARED_H = ["age-h", "bili-h"];
  function syncFrom(srcId) {
    if (!$("age-keep").checked) return;
    const group = SHARED_GA.indexOf(srcId) >= 0 ? SHARED_GA : SHARED_H.indexOf(srcId) >= 0 ? SHARED_H : null;
    if (!group) return;
    const v = $(srcId).value;
    group.forEach(function (id) {
      if (id !== srcId && $(id).value !== v) { $(id).value = v; $(id).dispatchEvent(new Event("input")); }
    });
  }
  SHARED_GA.concat(SHARED_H).forEach((id) => $(id).addEventListener("input", () => syncFrom(id)));
  $("age-keep").addEventListener("change", function () {
    document.querySelectorAll(".keepnote").forEach((n) => (n.hidden = !$("age-keep").checked));
    if ($("age-keep").checked) { syncFrom("age-ga"); syncFrom("age-h"); }
  });

  // ---------- תרופות IV ----------
  const mg = (x) => (Math.round(x * 1000) / 1000).toString();
  const ml = (x) => x.toFixed(2);
  let showSteps = false;
  function stepsHtml(drug, r) {
    const kg = mg(r.kg);
    let h = '<ol class="steps"><li>מינון לתינוק: ' + mg(r.perKg) + " × " + kg + " = <b>" + mg(r.dose) + ' מ"ג</b></li>';
    if (drug === "gen" && r.mode === "pure") {
      h += '<li>מוסיפים 3 מ"ג למאריך (1 מ"ל): ' + mg(r.dose) + " + 3 = <b>" + mg(r.withExt) + ' מ"ג</b></li>';
      h += "<li>שואבים תרופה טהורה (PURE): " + mg(r.withExt) + ' ÷ 3 = <b>' + ml(r.draw) + ' מ"ל</b></li>';
      h += "<li>נותנים לתינוק: " + mg(r.dose) + ' ÷ 3 = <b>' + ml(r.give) + ' מ"ל</b></li>';
    } else {
      h += "<li>מינון עם מאריך: " + mg(r.dose) + " × 5 ÷ 4 = <b>" + mg(r.withExt) + ' מ"ג</b></li>';
      if (drug === "amp") {
        h += '<li>מדללים את הבקבוקון (1000 מ"ג) ב-5 מ"ל סליין: 200 מ"ג למ"ל</li>';
        h += "<li>שואבים תרופה: " + mg(r.withExt) + ' ÷ 200 = <b>' + ml(r.draw) + ' מ"ל</b></li>';
      } else {
        h += '<li>שואבים תרופה (3 מ"ג למ"ל): ' + mg(r.withExt) + ' ÷ 3 = <b>' + ml(r.draw) + ' מ"ל</b></li>';
      }
      h += '<li>משלימים בסליין: 5 − ' + ml(r.draw) + ' = <b>' + ml(r.saline) + ' מ"ל</b> (סה"כ 5 מ"ל)</li>';
      h += '<li>נותנים לתינוק: <b>4 מ"ל</b> (' + mg(r.dose) + ' מ"ג)</li>';
    }
    return h + "</ol>";
  }
  function renderDrugs() {
    const out = $("dr-out"), drug = $("dr-drug").value, g = parseFloat($("dr-w").value);
    $("dr-ga-row").hidden = drug !== "gen";
    if (!drug || isNaN(g)) { out.textContent = ""; return; }
    let r;
    if (drug === "amp") r = NT.ampicillin(g);
    else {
      const ga = parseGA($("dr-ga").value);
      if (!ga) { out.textContent = ""; return; }
      if (ga.error) { out.innerHTML = err(ga.error); return; }
      r = NT.gentamicin(g, ga.w);
    }
    if (r.error) { out.innerHTML = err(r.error); return; }
    const pure = drug === "gen" && r.mode === "pure";
    const row = (k, v) => '<div class="rrow"><span>' + k + "</span><b>" + v + "</b></div>";
    let h = '<div class="card"><b class="ctitle">' + (drug === "amp" ? "אמפיצילין" : "גנטמיצין") + " – משקל " + mg(r.kg) + ' ק"ג</b>';
    h += row("מינון ללא מאריך", mg(r.dose) + ' מ"ג');
    h += row("מינון עם מאריך", mg(r.withExt) + ' מ"ג');
    h += row("שואבים מהתרופה", ml(r.draw) + ' מ"ל');
    h += row("משלימים בסליין", pure ? "ללא סליין (טהור)" : ml(r.saline) + ' מ"ל');
    if (pure) h += row("נותנים לתינוק", ml(r.give) + ' מ"ל');
    h += '<button type="button" class="calcbtn" id="dr-toggle" aria-expanded="' + showSteps + '"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h2M12 11h2M8 15h2M12 15h2M8 18h2M12 18h4"/></svg><span>' + (showSteps ? "הסתר את החישוב" : "הצג את החישוב") + "</span></button>";
    h += '<div id="dr-steps"' + (showSteps ? "" : " hidden") + ">" + stepsHtml(drug, r) + "</div></div>";
    if (drug === "gen") h += '<p class="warn">המינון לפי שבוע לידה, לתינוק בגיל 0 עד 7 ימים בלבד.</p>';
    h += '<p class="warn">יש לוודא תמיד מול ההוראה הרפואית.</p>';
    out.innerHTML = h;
  }
  $("dr-out").addEventListener("click", function (e) {
    if (e.target.closest("#dr-toggle")) { showSteps = !showSteps; renderDrugs(); }
  });
  ["dr-drug", "dr-w", "dr-ga"].forEach((i) => $(i).addEventListener("input", renderDrugs));
})();
