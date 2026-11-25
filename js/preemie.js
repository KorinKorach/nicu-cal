// קבלת פג ליחידה. נוצר ונבנה במקור על ידי ד"ר מורן בסכס (מה שלומי). הותאם לאתר: משקלים בק"ג, תרופות לפי מחשבון התרופות שלנו.
(function () {
  const NT = window.NT, $ = (id) => document.getElementById(id);
  const cut2 = (x) => Math.floor(x * 100 + 1e-6) / 100;
  const mg = (x) => (Math.round(x * 1000) / 1000).toString();
  const ml = (x) => x.toFixed(2);
  const n = (x) => "<bdi>" + x + "</bdi>";
  const MG = 'מ"ג', ML = 'מ"ל';

  // ---------- שעון אפגר ----------
  (function () {
    const box = $("pr-apgar"), rows = [["pulse", "דופק"], ["breath", "נשימה"], ["tone", "טונוס שרירים"], ["color", "צבע עור"], ["touch", "תגובה למגע"]];
    const mins = [["m1", "דקה"], ["m5", "5 דקות"], ["m10", "10 דקות"]];
    let h = "";
    mins.forEach(function (m) {
      h += '<details class="dt" data-m="' + m[0] + '"><summary>' + m[1] + ' <span class="aptot"></span></summary>';
      rows.forEach(function (r) {
        h += '<div class="aprow"><span>' + r[1] + '</span><span class="apbtns">';
        [0, 1, 2].forEach(function (s) { h += '<button type="button" class="apbtn" data-r="' + r[0] + '" data-s="' + s + '">' + s + "</button>"; });
        h += "</span></div>";
      });
      h += '<div class="aprow aptotrow"><b>ציון</b><span class="aptv big">—</span></div></details>';
    });
    box.innerHTML = h;
    box.addEventListener("click", function (e) {
      const b = e.target.closest(".apbtn");
      if (!b) return;
      const sib = b.parentNode.querySelectorAll(".apbtn");
      const was = b.classList.contains("sel");
      sib.forEach(function (x) { x.classList.remove("sel"); });
      if (!was) b.classList.add("sel");
      const d = b.closest("details"), sel = d.querySelectorAll(".apbtn.sel");
      let t = 0; sel.forEach(function (x) { t += +x.dataset.s; });
      d.querySelector(".aptot").textContent = sel.length === 5 ? "(ציון " + t + ")" : "";
      d.querySelector(".aptv").textContent = sel.length === 5 ? t : "—";
    });
    let start = null, tick = null, fired = {}, ctx = null;
    const clock = $("pr-clock"), btn = $("pr-clockbtn"), msg = $("pr-beep");
    const fmt = (s) => String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
    function beep() {
      try {
        if (!ctx) return;
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.value = 800; g.gain.setValueAtTime(0.8, ctx.currentTime); g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25);
        o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.25);
      } catch (e) {}
    }
    function stop() { clearInterval(tick); tick = null; start = null; btn.textContent = "התחל"; }
    function step() {
      const s = Math.floor((Date.now() - start) / 1000);
      clock.textContent = fmt(s);
      [[60, "m1", "דקה"], [300, "m5", "5 דקות"], [600, "m10", "10 דקות"]].forEach(function (k) {
        if (s >= k[0] && !fired[k[1]]) {
          fired[k[1]] = 1; beep();
          msg.hidden = false; msg.textContent = "הגיע הזמן לציון אפגר " + k[2] + "!";
          box.querySelector('[data-m="' + k[1] + '"]').open = true;
        }
      });
      if (s >= 600) stop();
    }
    btn.addEventListener("click", function () {
      if (tick) {
        stop(); return;
      }
      try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === "suspended") ctx.resume(); } catch (e) {}
      fired = {}; msg.hidden = true; start = Date.now(); clock.textContent = "00:00"; btn.textContent = "עצור";
      tick = setInterval(step, 250);
    });
  })();

  // ---------- חיתוך חבל הטבור: סיבה רק כשלא בוצע ----------
  document.querySelectorAll('input[name="pr-cord"]').forEach(function (r) {
    r.addEventListener("change", function () { $("pr-cord-why").hidden = !$("pr-cord-no").checked; });
  });

  // ---------- חישובים לפי שבוע ומשקל ----------
  function wOf(id) {
    const v = $(id).value;
    if (v === "") return null;
    const kg = parseFloat(v);
    if (isNaN(kg)) return null;
    return kg;
  }
  function tubeSizes(kg, ga) {
    let t = null;
    if (kg !== null) t = kg <= 1.2 ? 2.5 : kg <= 2.2 ? 3 : 3.5;
    else if (ga) t = ga.w <= 28 ? 2.5 : ga.w <= 34 ? 3 : 3.5;
    if (t === null) return null;
    const all = [2, 2.5, 3, 3.5], i = all.indexOf(t), r = [];
    if (i > 0) r.push(all[i - 1]);
    r.push(t);
    if (i < all.length - 1) r.push(all[i + 1]);
    return r;
  }
  const openSteps = {};
  function render() {
    const ga = NT.parseGA($("pr-ga").value), est = wOf("pr-w");
    const errs = [];
    if (ga && ga.error) errs.push(ga.error);
    if (est !== null && est > 20) errs.push('המשקל מוזן בקילוגרמים (למשל 1.1), לא בגרמים');
    $("pr-err").innerHTML = errs.map((e) => '<p class="err">' + e + "</p>").join("");
    const gaOk = ga && !ga.error ? ga : null;
    const estKg = est !== null && est > 0 && est <= 20 ? est : null;

    // אינטובציה: לפי הערכת המשקל
    const sizes = tubeSizes(estKg, gaOk);
    $("pr-tubeline").textContent = sizes ? "להכין " + sizes.length + " טובוסים בגדלים: " + sizes.join(", ") + (estKg ? " (לפי הערכת משקל)" : "") : "להכין 4 טובוסים בגדלים: 2, 2.5, 3, 3.5";
    const nd = estKg ? (estKg * 2 + 6).toFixed(1) : "", od = estKg ? (estKg + 6).toFixed(1) : "";
    $("pr-depth").innerHTML = estKg
      ? "<div>עומק טובוס לאינטובציה דרך האף: <b>" + nd + "</b> ס\"מ</div><div>עומק טובוס לאינטובציה דרך הפה: <b>" + od + "</b> ס\"מ</div>" +
        '<details class="prsteps" data-k="depth"' + (openSteps.depth ? " open" : "") + "><summary>הצג את החישוב</summary>" +
        '<ol class="steps"><li>דרך האף: (משקל בק״ג × 2) + 6<br>(' + n(mg(estKg)) + " × " + n(2) + ") + " + n(6) + " = <b>" + n(nd) + "</b> ס\"מ</li>" +
        "<li>דרך הפה: משקל בק״ג + 6<br>" + n(mg(estKg)) + " + " + n(6) + " = <b>" + n(od) + "</b> ס\"מ</li></ol></details>"
      : "";
    const trs = $("pr-tubes").querySelectorAll("tr");
    const row = estKg ? (estKg < 0.8 ? 0 : estKg <= 1.2 ? 1 : estKg <= 2.2 ? 2 : 3) : -1;
    trs.forEach(function (tr, i) { if (i > 0) tr.classList.toggle("hit", i - 1 === row); });

    // תרופות: משקל הערכה. שבוע הריון נדרש לגנטמיצין
    const w = estKg, need = '<em>יש להזין משקל</em>';
    const g = Math.round((w || 0) * 1000);
    const D = {}; // תוצאה לכל תרופה: { name, lines:[html], steps }
    const L1 = (v, u) => "מינון ללא שטיפה: <b>" + v + "</b> " + u;
    const L2 = (v, u, d) => "להכנה בתוך 5 " + ML + " של " + (d || "סליין") + ": <b>" + v + "</b> " + u;
    const sur = w ? ml(cut2((200 * w) / 80)) : "";
    D.sur = { lines: w ? ["מינון: <b>" + sur + "</b> " + ML] : [need],
      steps: w ? '<ol class="steps"><li>200 מ"ג/ק"ג ÷ 80 מ"ג/מ"ל</li><li>(' + n(mg(w)) + " × " + n(200) + ") ÷ " + n(80) + " = " + n(sur) + " " + ML + "</li></ol>" : "" };
    const amp = w ? NT.ampicillin(g) : null;
    D.amp = amp && !amp.error ? { lines: [L1(mg(amp.dose), MG), L2(mg(amp.withExt), MG), "תדירות מתן: לפגים 2 מנות ביממה."], steps: NT.stepsHtml("amp", amp) } : { lines: [need], steps: "" };
    const gen = w && gaOk ? NT.gentamicin(g, gaOk.w) : null;
    if (gen && !gen.error) {
      D.gen = { lines: [L1(mg(gen.dose), MG), gen.mode === "pure" ? "תרופה טהורה (<bdi dir=ltr>PURE</bdi>) עם מאריך: <b>" + mg(gen.withExt) + "</b> " + MG : L2(mg(gen.withExt), MG),
        "תדירות מתן (בגיל 0 עד 7 ימים) לפי שבוע לידה:", "29 ומטה: פעם ב-48 שעות", "30 עד 34: פעם ב-36 שעות"], steps: NT.stepsHtml("gen", gen) };
    } else D.gen = { lines: [w ? "<em>יש להזין שבוע הריון</em>" : need], steps: "" };
    const f = w ? cut2(w) : 0;
    D.fen = { lines: w ? ["להכין <b>" + f.toFixed(2) + "</b> מיקרוגרם מהולים למתן בפוש איטי"] : [need],
      steps: w ? '<ol class="steps"><li>מינון: 1 מיקרוגרם/ק"ג × ' + n(mg(w)) + ' = <b>' + n(f.toFixed(2)) + ' מיקרוגרם</b></li><li>יש לשאוב 0.1 מ״ל של התרופה (שהם 5 מיקרוגרם), ולהשלים עד 1 מ״ל עם <bdi dir="ltr">NACL 0.9%</bdi></li><li>לאחר המיהול יהיו במזרק 5 מיקרוגרם ב-1 מ״ל</li><li>ולתת לפי המינון הנדרש למשקל (<b>' + n(f.toFixed(2)) + "</b> מיקרוגרם)</li></ol>" : "" };
    const caf = w ? NT.caffeine(g, 20) : null;
    D.caf = caf && !caf.error ? { lines: [L1(mg(caf.dose), MG), L2(mg(caf.withExt), MG, "גלוקוז 5%")], steps: NT.stepsHtml("caf", caf) } : { lines: [need], steps: "" };
    const caf2 = w ? NT.caffeine(g, 10) : null;
    D.caf2 = caf2 && !caf2.error ? { lines: [L1(mg(caf2.dose), MG), L2(mg(caf2.withExt), MG, "גלוקוז 5%")], steps: NT.stepsHtml("caf", caf2) } : { lines: [need], steps: "" };
    Object.keys(D).forEach(function (k) {
      const d = D[k], on = document.querySelector('#preemie [data-d="' + k + '"]').checked;
      $("pr-res-" + k).innerHTML = !on ? "" : '<div class="card">' + d.lines.map((l) => "<div>" + l + "</div>").join("") +
        (d.steps ? '<details class="prsteps" data-k="' + k + '"' + (openSteps[k] ? " open" : "") + "><summary>הצג את החישוב</summary>" + d.steps + "</details>" : "") + "</div>";
    });
    // הזנה
    const li = (t, a, b, u) => "<li>" + t + (w ? " (" + parseFloat((a * w).toFixed(2)) + "-" + parseFloat((b * w).toFixed(2)) + " " + u + ")" : "") + "</li>";
    $("pr-nut").innerHTML =
      "<li>ריכוז גלוקוז מומלץ 5-10% בהתאם לרמת הגלוקוז בדם</li>" +
      li('<bdi dir="ltr">GIR</bdi> מומלץ 4-7 מ״ג/ק״ג/דקה', 4, 7, "מ״ג/דקה") +
      li("חלבון 1.5-2.5 גר׳/ק״ג/יממה", 1.5, 2.5, "גרם/יממה") +
      li("שומן 1-2 גר׳/ק״ג/יממה", 1, 2, "גרם/יממה") +
      li("קלוריות 45-55 קק״ל/ק״ג/יממה", 45, 55, "קק״ל/יממה") +
      "<li>נפח מומלץ:</li>";
    const vr = w ? (g < 1000 ? 0 : g <= 1500 ? 1 : 2) : -1;
    $("pr-vol").querySelectorAll("tr").forEach(function (tr, i) { if (i > 0) tr.classList.toggle("hit", i - 1 === vr); });
  }
  ["pr-ga", "pr-w"].forEach((i) => $(i).addEventListener("input", render));
  document.querySelectorAll("#preemie [data-d]").forEach((c) => c.addEventListener("change", render));
  document.querySelectorAll(".prres").forEach((r) => r.addEventListener("toggle", function (e) { if (e.target.dataset.k) openSteps[e.target.dataset.k] = e.target.open; }, true));
  $("pr-depth").addEventListener("toggle", function (e) { if (e.target.dataset.k) openSteps[e.target.dataset.k] = e.target.open; }, true);
  $("pr-calc-open").addEventListener("click", function () { $("calc").hidden = false; });
  $("pr-eqsel").addEventListener("change", function () {
    ["room", "vent", "int"].forEach((k) => ($("pr-eq-" + k).hidden = $("pr-eqsel").value !== k));
  });
  render();
})();
