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

  // התראת "לשונית לא מתאימה" רק אחרי שהוזנו שתי ספרות של השבוע
  function twoDigits(id) { return /^\d{2}/.test($(id).value.trim()); }

  function show(tab) {
    document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("on", p.id === tab));
    window.scrollTo(0, 0);
  }
  // פתיחה ישירה ללשונית לפי כתובת (למשל index.html#pbili)
  const hashTab = location.hash.slice(1);
  if (hashTab && document.getElementById(hashTab) && document.getElementById(hashTab).classList.contains("panel")) show(hashTab);
  // בחירת מחשבון מתוך פרטי היילוד: משכפל את אריחי הבית
  let babyFlow = false;
  document.querySelectorAll("#home .tile:not(.alt):not(.nopick)").forEach(function (t) {
    const c = t.cloneNode(true);
    c.className = "chip";
    $("pick-grid").appendChild(c);
  });
  // חץ חזרה בראש כל מחשבון: לדף הבית, או לפרטי היילוד אם הגענו משם
  document.querySelectorAll(".panel:not(#home)").forEach(function (p) {
    const row = document.createElement("div");
    row.className = "toprow";
    const b = document.createElement("button");
    b.type = "button";
    b.className = "back";
    b.setAttribute("aria-label", "חזרה");
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
    b.addEventListener("click", function () {
      if (p.id === "pick") show("baby");
      else if (p.id === "baby") { babyFlow = false; syncFlow(); show("home"); }
      else show(babyFlow ? "pick" : "home");
      syncFlow();
    });
    row.appendChild(b);
    if (p.id !== "baby" && p.id !== "pick") {
      const c = document.createElement("button");
      c.type = "button";
      c.className = "nowbtn clrhome";
      c.textContent = "נקה פרטים ועבור לדף הבית";
      c.addEventListener("click", function () { clearBaby(); babyFlow = false; syncFlow(); show("home"); });
      row.appendChild(c);
    }
    p.insertBefore(row, p.firstChild);
  });
  function syncFlow() { document.body.classList.toggle("babyflow", babyFlow); }
  document.querySelectorAll("[data-tab]").forEach((el) => el.addEventListener("click", function () {
    if (el.closest("#pick")) babyFlow = true;
    else if (el.closest("#home")) babyFlow = false;
    syncFlow();
    show(el.dataset.tab);
  }));

  // ---------- גיל מתוקן ----------
  function renderAge() {
    const out = $("age-out"), ga = parseGA($("age-ga").value), h = parseFloat($("age-h").value);
    if (!ga || isNaN(h)) { out.textContent = ""; return; }
    if (ga.error) { out.innerHTML = err(ga.error); return; }
    const r = NT.correctedAge(ga.w, ga.d, h);
    if (r.error) { out.innerHTML = err(r.error); return; }
    let html = '<div class="card"><b>גיל הריון מצטבר (<bdi dir=ltr>PMA</bdi>)</b><span class="big">' + wd(r.pma) + "</span></div>";
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
    const out = $("sg-out"), sex = $("sg-sex").value, ga = parseGA($("sg-ga").value), kgIn = parseFloat($("sg-g").value), g = kgIn * 1000;
    if (!sex || !ga || isNaN(g)) { out.textContent = ""; return; }
    if (kgIn > 20) { out.innerHTML = err("המשקל מוזן בקילוגרמים (למשל 3.3), לא בגרמים"); return; }
    if (ga.error) { out.innerHTML = err(ga.error); return; }
    const r = NT.fentonSize(sex, ga.w, ga.d, g);
    if (r.error) { out.innerHTML = err(r.error); return; }
    const T = { SGA: ["bad", "קטן לגיל ההריון (<bdi dir=ltr>SGA</bdi>)"], AGA: ["ok", "גודל תקין לגיל ההריון (<bdi dir=ltr>AGA</bdi>)"], LGA: ["mid", "גדול לגיל ההריון (<bdi dir=ltr>LGA</bdi>)"] }[r.cls];
    const pct = r.percentile < 0.1 ? "פחות מ-0.1" : r.percentile > 99.9 ? "מעל 99.9" : r.percentile.toFixed(1);
    const zp = (z) => clamp01((z + 3) / 6);
    const sgGauge = gaugeHtml([[zp(-1.2816), "#DC2626"], [zp(1.2816), "#16A34A"], [1, "#D97706"]], zp(r.z), [[zp(-1.2816), "10"], [zp(1.2816), "90"]]);
    let html = '<div class="card ' + T[0] + '"><b>' + T[1] + '</b>' + sgGauge + 'אחוזון: <span class="big">' + pct + '</span><br>Z-score: <span class="big">' + r.z.toFixed(2) + "</span></div>";
    html += '<div class="card">למין ולשבוע הזה:<br>אחוזון 10: ' + (r.p10 / 1000).toFixed(2) + ' ק"ג<br>חציון: ' + (r.median / 1000).toFixed(2) + ' ק"ג<br>אחוזון 90: ' + (r.p90 / 1000).toFixed(2) + ' ק"ג</div>';
    if (r.beyond3) html += '<p class="warn"><bdi dir=ltr>Z-score</bdi> מעל ‎±3: הערך מקורב. בכלי המקורי נעשה תיקון נוסף בקצוות.</p>';
    out.innerHTML = html;
  }
  ["sg-sex", "sg-ga", "sg-g"].forEach((i) => $(i).addEventListener("input", renderSga));

  // ---------- אחוזון היקף ראש ----------
  function renderHc() {
    const out = $("hc-out"), sex = $("hc-sex").value, ga = parseGA($("hc-ga").value), c = parseFloat($("hc-c").value);
    if (!sex || !ga || isNaN(c)) { out.textContent = ""; return; }
    if (c > 60) { out.innerHTML = err("היקף הראש מוזן בסנטימטרים (למשל 33.5)"); return; }
    if (ga.error) { out.innerHTML = err(ga.error); return; }
    const r = NT.fentonHead(sex, ga.w, ga.d, c);
    if (r.error) { out.innerHTML = err(r.error); return; }
    const T = { SMALL: ["bad", "היקף ראש קטן לגיל ההריון"], NORMAL: ["ok", "היקף ראש תקין לגיל ההריון"], LARGE: ["mid", "היקף ראש גדול לגיל ההריון"] }[r.cls];
    const pct = r.percentile < 0.1 ? "פחות מ-0.1" : r.percentile > 99.9 ? "מעל 99.9" : r.percentile.toFixed(1);
    const zp = (z) => clamp01((z + 3) / 6);
    const g = gaugeHtml([[zp(-1.2816), "#DC2626"], [zp(1.2816), "#16A34A"], [1, "#D97706"]], zp(r.z), [[zp(-1.2816), "10"], [zp(1.2816), "90"]]);
    let html = '<div class="card ' + T[0] + '"><b>' + T[1] + '</b>' + g + 'אחוזון: <span class="big">' + pct + '</span><br>Z-score: <span class="big">' + r.z.toFixed(2) + "</span></div>";
    html += '<div class="card">למין ולשבוע הזה:<br>אחוזון 10: ' + r.p10.toFixed(1) + ' ס"מ<br>חציון: ' + r.median.toFixed(1) + ' ס"מ<br>אחוזון 90: ' + r.p90.toFixed(1) + ' ס"מ</div>';
    out.innerHTML = html;
  }
  ["hc-sex", "hc-ga", "hc-c"].forEach((i) => $(i).addEventListener("input", renderHc));

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
  function plateauNote(r, h) {
    if (r.photoFrom === undefined || !(h >= 0)) return "";
    if (r.pma) return h >= r.photoFrom ? '<p class="plateau"><b class="ptitle">הסף בפלאטו</b>בפגים, על פי <bdi dir=ltr>Stanford</bdi>, הסף מגיע לפלאטו כשגיל ההריון המצטבר הוא 35 שבועות. במקרה זה, הסף קבוע החל מגיל ' + r.photoFrom + " שעות ואינו עולה עוד (להמשך, ניתן להסתמך על הכלי <bdi dir=ltr>AAP 2022</bdi>)</p>" : "";
    const n = [];
    if (h >= r.photoFrom) n.push("סף הפוטותרפיה: קבוע מגיל " + r.photoFrom + " שעות ואינו עולה עוד");
    if (h >= r.exchFrom) n.push("סף חילוף הדם: קבוע מגיל " + r.exchFrom + " שעות ואינו עולה עוד");
    return n.length ? '<p class="plateau"><b class="ptitle">הסף בפלאטו</b>' + n.join("<br>") + "</p>" : "";
  }
  function biliCard(title, r, v, h) {
    let cls = "", status = "";
    if (v !== null && !isNaN(v)) {
      if (v >= r.exchange) { cls = "bad"; status = "בילירובין בסף חילוף דם או מעליו"; }
      else if (!r.pma && !r.nice && v >= r.exchange - 2) { cls = "bad"; status = "בילירובין בסף הסלמת טיפול או מעליו"; }
      else if (v >= r.photo) { cls = "mid"; status = "בילירובין בסף פוטותרפיה או מעליו"; }
      else { cls = "ok"; status = "מתחת לסף פוטותרפיה"; }
    }
    return '<div class="card ' + cls + '"><b>' + title + "</b>" + (status ? "<b>" + status + "</b>" : "") +
      biliGauge(r, v) +
      'פוטותרפיה: <span class="big">' + num1(r.photo) + "</span> mg/dL<br>" +
      (!r.pma && !r.nice ? 'הסלמת טיפול: <span class="big">' + num1(r.exchange - 2) + "</span> mg/dL<br>" : "") +
      'חילוף דם: <span class="big">' + num1(r.exchange) + "</span> mg/dL" + plateauNote(r, h) + (r.extra || '') + (r.note ? '<p class="plateau">' + r.note + "</p>" : "") + "</div>";
  }
  function renderBili() {
    const out = $("bili-out"), ga = parseGA($("bili-ga").value), h = parseFloat($("bili-h").value);
    const rf = $("bili-rf").checked, vRaw = $("bili-v").value, v = vRaw === "" ? null : parseFloat(vRaw);
    const preWarn = ga && !ga.error && twoDigits("bili-ga") && ga.w < 35 ? '<p class="warn"><b>שימו לב: זו לשונית צהבת לשבוע 35 ומעלה.</b> לפגים (שבוע 24 עד 34) יש לעבור למחשבון "צהבת בפגים".<br><button type="button" class="nowbtn" id="bili-gopre" style="margin:8px 0 0">מעבר למחשבון צהבת בפגים</button></p>' : "";
    $("bili-prewarn").innerHTML = preWarn;
    if (!ga || isNaN(h)) { out.textContent = ""; return; }
    if (ga.error) { out.innerHTML = err(ga.error); return; }
    let html = "";
    if (ga.w >= 35) {
      const r = NT.biliAAP(ga.w, h, rf);
      if (r.error) { out.innerHTML = err(r.error); return; }
      html = biliCard("<bdi dir=ltr>AAP 2022</bdi> (35 שבועות ומעלה)", r, v, h);
    } else {
      const r = NT.biliPreterm(ga.w, ga.d, h, rf);
      if (r.error) { out.innerHTML = err(r.error); return; }
      html = biliCard("<bdi dir=ltr>Stanford Premie BiliRecs</bdi> (פגים), גיל מצטבר " + wd(r.pma), r, v, h);
      r.warnings.forEach((x) => (html += '<p class="warn">' + x + "</p>"));
    }
    out.innerHTML = html;
  }
  $("bili-prewarn").addEventListener("click", function (e) {
    if (e.target.closest("#bili-gopre")) {
      show("pbili");
      ["ga", "h", "v"].forEach(function (k) { $("pbili-" + k).value = $("bili-" + k).value; });
      $("pbili-ga").dispatchEvent(new Event("input", { bubbles: true }));
    }
  });
  ["bili-ga", "bili-h", "bili-rf", "bili-v"].forEach((i) => $(i).addEventListener("input", renderBili));

  // ---------- צהבת בפגים (NICE) ----------
  function renderPbili() {
    const out = $("pbili-out"), ga = parseGA($("pbili-ga").value), h = parseFloat($("pbili-h").value);
    const vRaw = $("pbili-v").value, v = vRaw === "" ? null : parseFloat(vRaw);
    $("pbili-prewarn").innerHTML = ga && !ga.error && twoDigits("pbili-ga") && ga.w >= 35 ? '<p class="warn"><b>שימו לב: זו לשונית צהבת לשבועות 24 עד 34.</b> לשבוע 35 ומעלה יש לעבור למחשבון "צהבת ביילודים".</p>' : ga && !ga.error && twoDigits("pbili-ga") && ga.w < 24 ? '<p class="warn"><b>שימו לב: זו לשונית צהבת לשבועות 24 עד 34.</b></p>' : "";
    if (!ga || isNaN(h)) { out.textContent = ""; return; }
    if (ga.error) { out.innerHTML = err(ga.error); return; }
    const r = NT.biliNICE(ga.w, h);
    if (r.error) { out.innerHTML = r.silent ? "" : err(r.error); return; }
    $("pbili-curves").href = "curves.html#" + r.week;
    r.nice = true;
    let html = biliCard("עקומות <bdi dir=ltr>NICE</bdi>, שבוע " + r.week, r, v, h);
    if (r.beyond) html += '<p class="warn">העקומות מגיעות עד גיל 14 ימים.</p>';
    out.innerHTML = html;
  }
  ["pbili-ga", "pbili-h", "pbili-v"].forEach((i) => $(i).addEventListener("input", renderPbili));

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
      html += '<div class="card ' + cls + '"><b>מצב היילוד: ' + s[1] + '</b>סיכון: <span class="big">' + f2(r[s[0]]) + "</span> לאלף" + gg + ACT[a2.action] + "<br><small>" + VIT[a2.vitals] + "</small></div>";
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

  // ---------- פרטי יילוד לכל החישובים ----------
  const BABY_MAP = {
    "baby-ga": ["age-ga", "bili-ga", "pbili-ga", "sg-ga", "hc-ga", "sp-ga", "dr-ga", "pr-ga"],
    "baby-birth": ["age-birth", "bili-birth", "pbili-birth", "pku-birth"],
    "baby-w": ["sg-g", "dr-w", "pr-w"],
    "baby-sex": ["sg-sex", "hc-sex"],
  };
  function babyPush(src) {
    const v = $(src).value;
    BABY_MAP[src].forEach(function (id) { $(id).value = v; $(id).dispatchEvent(new Event("input", { bubbles: true })); });
  }
  Object.keys(BABY_MAP).forEach((id) => $(id).addEventListener("input", () => babyPush(id)));
  function clearBaby() {
    Object.keys(BABY_MAP).forEach(function (id) {
      $(id).value = ""; babyPush(id);
    });
    ["age-h", "bili-h", "pbili-h", "age-until", "bili-until", "pbili-until", "bili-v", "pbili-v"].forEach(function (id) { $(id).value = ""; $(id).dispatchEvent(new Event("input", { bubbles: true })); });
  }
  $("baby-clear").addEventListener("click", clearBaby);

  // ---------- תרופות IV ----------
  const mg = (x) => (Math.round(x * 1000) / 1000).toString();
  const ml = (x) => x.toFixed(2);
  let showSteps = false, manualWE = "";
  function stepsHtml(drug, r) {
    const n = (x) => "<bdi>" + x + "</bdi>"; // כל מספר נשאר שלם גם בכיוון מימין לשמאל
    const ans = (x, u) => "<b>" + n(x) + " " + u + "</b>";
    const MG = 'מ"ג', ML = 'מ"ל';
    let h = '<ol class="steps">';
    if (r.manual) h += '<li>מינון עם מאריך לפי הוראה רפואית: <b>' + n(mg(r.withExt)) + " " + MG + "</b></li>";
    else h += '<li>מינון ליילוד: ' + n(mg(r.perKg)) + " × " + n(mg(r.kg)) + " = " + ans(mg(r.dose), MG) + "</li>";
    if (drug === "gen" && r.mode === "pure") {
      if (!r.manual) h += '<li>מוסיפים 3 מ"ג למאריך (1 מ"ל): ' + n(mg(r.dose)) + " + " + n(3) + " = " + ans(mg(r.withExt), MG) + "</li>";
      h += "<li>שואבים תרופה טהורה (<bdi dir=ltr>PURE</bdi>): " + n(mg(r.withExt)) + " ÷ " + n(3) + " = " + ans(ml(r.draw), ML) + "</li>";
      if (r.manual) h += "<li>נותנים ליילוד: (" + n(mg(r.withExt)) + " − " + n(3) + ") ÷ " + n(3) + " = " + ans(ml(r.give), ML) + "</li>";
      else h += "<li>נותנים ליילוד: " + n(mg(r.dose)) + " ÷ " + n(3) + " = " + ans(ml(r.give), ML) + "</li>";
    } else {
      if (!r.manual) h += "<li>מינון עם מאריך: " + n(mg(r.dose)) + " × " + n(5) + " ÷ " + n(4) + " = " + ans(mg(r.withExt), MG) + "</li>";
      if (drug === "amp") {
        h += '<li>מדללים את הבקבוקון (1000 מ"ג) ב-5 מ"ל מים להזרקה: 200 מ"ג למ"ל</li>';
        h += "<li>שואבים תרופה: " + n(mg(r.withExt)) + " ÷ " + n(200) + " = " + ans(ml(r.draw), ML) + "</li>";
      } else if (drug === "cef") {
        h += '<li>מדללים את הבקבוקון (1000 מ"ג) ב-4 מ"ל מים להזרקה: נפח סופי 4.5 מ"ל (1000 מ"ג ב-4.5 מ"ל)</li>';
        h += "<li>שואבים תרופה: " + n(mg(r.withExt)) + " × " + n(4.5) + " ÷ " + n(1000) + " = " + ans(ml(r.draw), ML) + "</li>";
      } else if (drug === "caf") {
        h += '<li>אמפולה: 25 מ"ג למ"ל</li>';
        h += "<li>שואבים תרופה: " + n(mg(r.withExt)) + " ÷ " + n(25) + " = " + ans(ml(r.draw), ML) + "</li>";
      } else {
        h += '<li>שואבים תרופה (3 מ"ג למ"ל): ' + n(mg(r.withExt)) + " ÷ " + n(3) + " = " + ans(ml(r.draw), ML) + "</li>";
      }
      h += "<li>משלימים ב" + (drug === "caf" ? "גלוקוז 5%" : "סליין") + ": " + n(5) + " − " + n(ml(r.draw)) + " = " + ans(ml(r.saline), ML) + ' (סה"כ 5 מ"ל)</li>';
      h += '<li>נותנים ליילוד: <b>4 מ"ל</b> (' + n(mg(r.dose)) + ' מ"ג)</li>';
    }
    return h + "</ol>";
  }
  NT.parseGA = parseGA; NT.stepsHtml = stepsHtml;
  function renderDrugs() {
    const out = $("dr-out"), drug = $("dr-drug").value, kgIn = parseFloat($("dr-w").value), g = Math.round(kgIn * 1000);
    $("dr-ga-row").hidden = drug !== "gen";
    $("dr-dose-row").hidden = drug !== "caf";
    if (!drug || isNaN(g)) { out.textContent = ""; return; }
    if (kgIn > 20) { out.innerHTML = err("המשקל מוזן בקילוגרמים (למשל 3.3), לא בגרמים"); return; }
    let r;
    if (drug === "amp") r = NT.ampicillin(g);
    else if (drug === "cef") r = NT.cefotaxime(g);
    else if (drug === "caf") {
      const pk = parseFloat($("dr-dose").value);
      if (isNaN(pk)) { out.textContent = ""; return; }
      r = NT.caffeine(g, pk);
    } else {
      const ga = parseGA($("dr-ga").value);
      if (!ga) { out.textContent = ""; return; }
      if (ga.error) { out.innerHTML = err(ga.error); return; }
      r = NT.gentamicin(g, ga.w);
    }
    if (r.error) { out.innerHTML = err(r.error); return; }
    const base = r, mv = parseFloat(manualWE);
    let manErr = "";
    if (mv > 0) { const m = NT.applyManual(drug, r, mv); if (m.error) manErr = m.error; else r = m; }
    const pure = drug === "gen" && r.mode === "pure";
    const row = (k, v) => '<div class="rrow"><span>' + k + "</span><b>" + v + "</b></div>";
    let h = '<div class="card"><b class="ctitle">' + ({ amp: "אמפיצילין", cef: "צפוטקסים (קלפורן)", gen: "גנטמיצין", caf: "קפאין ציטרט" }[drug]) + " – משקל " + mg(r.kg) + ' ק"ג</b>';
    h += row("מינון ללא מאריך", mg(base.dose) + ' מ"ג');
    h += row("מינון עם מאריך", mg(base.withExt) + ' מ"ג');
    h += '<div class="rrow manrow"><label for="dr-manual">מינון עם מאריך לפי הוראה רפואית</label><span class="manin"><input id="dr-manual" type="text" inputmode="decimal" autocomplete="off" value="' + manualWE + '"> מ"ג</span></div>';
    if (manErr) h += '<p class="err">' + manErr + "</p>";
    h += row(r.manual ? "שואבים מהתרופה (לפי ההוראה)" : "שואבים מהתרופה", ml(r.draw) + ' מ"ל');
    h += row(drug === "caf" ? "משלימים בגלוקוז 5%" : "משלימים בסליין", pure ? "ללא סליין (<bdi dir=ltr>PURE</bdi>)" : ml(r.saline) + ' מ"ל');
    if (pure) h += row("נותנים ליילוד", ml(r.give) + ' מ"ל');
    h += '<div class="calcrow"><button type="button" class="calcbtn" id="dr-toggle" aria-expanded="' + showSteps + '"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h2M12 11h2M8 15h2M12 15h2M8 18h2M12 18h4"/></svg><span>' + (showSteps ? "הסתר את החישוב" : "הצג את החישוב") + '</span></button><button type="button" class="calcbtn" id="dr-calc-open" aria-label="מחשבון"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/></svg><span>מחשבון</span></button></div>';
    h += '<div id="dr-steps"' + (showSteps ? "" : " hidden") + ">" + stepsHtml(drug, r) + "</div></div>";
    h += '<p class="warn" style="text-align:center">המחשבון נועד לוודא חישובים שנעשו באופן עצמאי ולא מחליף אותם. יש להשוות תמיד מול ההוראה הרפואית.</p>';
    const hadFocus = document.activeElement && document.activeElement.id === "dr-manual";
    out.innerHTML = h;
    if (hadFocus) { const i = $("dr-manual"); i.focus(); try { i.setSelectionRange(i.value.length, i.value.length); } catch (e) {} }
  }
  $("dr-out").addEventListener("input", function (e) {
    if (e.target.id === "dr-manual") { manualWE = e.target.value.replace(",", "."); renderDrugs(); }
  });
  $("dr-out").addEventListener("click", function (e) {
    if (e.target.closest("#dr-toggle")) { showSteps = !showSteps; renderDrugs(); }
    if (e.target.closest("#dr-calc-open")) { $("calc").hidden = false; }
  });
  ["dr-drug", "dr-w", "dr-ga", "dr-dose"].forEach((i) => $(i).addEventListener("input", function () { manualWE = ""; renderDrugs(); }));

  // ---------- מחשבון רגיל ----------
  (function () {
    let cur = "0", acc = null, op = null, fresh = true;
    const disp = $("calc-disp");
    const num = (x) => String(Math.round(x * 1e9) / 1e9);
    const apply = () => {
      const a = acc, b = parseFloat(cur);
      acc = op === "+" ? a + b : op === "−" ? a - b : op === "×" ? a * b : op === "÷" ? (b === 0 ? NaN : a / b) : b;
    };
    function press(k) {
      if (cur === "שגיאה" && k !== "C") return;
      if (/^\d$/.test(k)) { cur = fresh || cur === "0" ? k : cur + k; fresh = false; }
      else if (k === ".") { if (fresh) { cur = "0."; fresh = false; } else if (cur.indexOf(".") < 0) cur += "."; }
      else if (k === "C") { cur = "0"; acc = null; op = null; fresh = true; }
      else if (k === "⌫") { cur = cur.length > 1 && !fresh ? cur.slice(0, -1) : "0"; }
      else if (k === "=") { if (op !== null) { apply(); cur = isFinite(acc) ? num(acc) : "שגיאה"; acc = null; op = null; fresh = true; } }
      else {
        if (op !== null && !fresh) { apply(); cur = isFinite(acc) ? num(acc) : "שגיאה"; if (cur === "שגיאה") { acc = null; op = null; fresh = true; disp.textContent = cur; return; } acc = parseFloat(cur); }
        else acc = parseFloat(cur);
        op = k; fresh = true;
      }
      disp.textContent = cur;
    }
    $("calc-keys").addEventListener("click", function (e) { const b = e.target.closest("button"); if (b) press(b.textContent.trim()); });
    $("calc-close").addEventListener("click", () => ($("calc").hidden = true));
    $("calc").addEventListener("click", (e) => { if (e.target === $("calc")) $("calc").hidden = true; });
  })();

  // ---------- חישוב גיל לפי תאריך ושעה ----------
  const pad = (n) => String(n).padStart(2, "0");
  function nowLocal() {
    const d = new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes());
  }
  function dtCalc(p, hoursId) {
    const b = $(p + "-birth").value, u = $(p + "-until").value, out = $(p + "-dtout");
    if (!b) { out.textContent = ""; return; }
    const t0 = new Date(b).getTime(), t1 = u ? new Date(u).getTime() : Date.now();
    if (t1 < t0) { out.innerHTML = '<span class="err">התאריך הרצוי הוא לפני הלידה</span>'; return; }
    const hrs = Math.floor((t1 - t0) / 3600000);
    out.textContent = "גיל: " + hrs + " שעות (" + Math.floor(hrs / 24) + " ימים ו-" + (hrs % 24) + " שעות)" + (u ? "" : ", עד עכשיו");
    $(hoursId).value = hrs;
    $(hoursId).dispatchEvent(new Event("input", { bubbles: true }));
  }
  [["age", "age-h"], ["bili", "bili-h"], ["pbili", "pbili-h"]].forEach(function (x) {
    ["-birth", "-until"].forEach((s) => $(x[0] + s).addEventListener("input", () => dtCalc(x[0], x[1])));
  });
  document.querySelectorAll(".nowbtn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const t = $(btn.dataset.now);
      t.value = nowLocal();
      t.dispatchEvent(new Event("input", { bubbles: true }));
    });
  });
  // שמירת הנתונים של צהבת בפגים בזמן מעבר לדף העקומות וחזרה
  (function () {
    const ids = ["pbili-ga", "pbili-h", "pbili-birth", "pbili-until", "pbili-v"];
    $("pbili-curves").addEventListener("click", function () {
      try { sessionStorage.setItem("nc_pbili", JSON.stringify(ids.map((i) => $(i).value))); } catch (e) {}
    });
    try {
      const saved = sessionStorage.getItem("nc_pbili");
      if (saved && location.hash === "#pbili") {
        const vals = JSON.parse(saved);
        setTimeout(function () {
          ids.forEach(function (i, k) { $(i).value = vals[k] || ""; });
          ["pbili-birth", "pbili-ga", "pbili-h", "pbili-v"].forEach((i) => $(i).dispatchEvent(new Event("input", { bubbles: true })));
        }, 0);
      }
      sessionStorage.removeItem("nc_pbili");
    } catch (e) {}
  })();
})();
