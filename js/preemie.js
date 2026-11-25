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
      h += "</details>";
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
        if (Math.floor((Date.now() - start) / 1000) < 600 && !confirm("לעצור את הטיימר לפני 10 דקות?")) return;
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
  function render() {
    const ga = NT.parseGA($("pr-ga").value), est = wOf("pr-w"), bw = wOf("pr-bw");
    const errs = [];
    if (ga && ga.error) errs.push(ga.error);
    if (est !== null && est > 20) errs.push('המשקל מוזן בקילוגרמים (למשל 1.1), לא בגרמים');
    if (bw !== null && bw > 20) errs.push('המשקל מוזן בקילוגרמים (למשל 1.1), לא בגרמים');
    $("pr-err").innerHTML = errs.map((e) => '<p class="err">' + e + "</p>").join("");
    const gaOk = ga && !ga.error ? ga : null;
    const estKg = est !== null && est > 0 && est <= 20 ? est : null;
    const bwKg = bw !== null && bw > 0 && bw <= 20 ? bw : null;

    // אינטובציה: לפי הערכת המשקל
    const sizes = tubeSizes(estKg, gaOk);
    $("pr-tubeline").textContent = sizes ? "להכין " + sizes.length + " טובוסים בגדלים: " + sizes.join(", ") + (estKg ? " (לפי הערכת משקל)" : "") : "להכין 4 טובוסים בגדלים: 2, 2.5, 3, 3.5";
    $("pr-depth").innerHTML = estKg
      ? "עומק טובוס לאינטובציה דרך האף (לפי הערכת משקל): <b>" + (estKg * 2 + 6).toFixed(1) + "</b> <small>(משקל בק״ג × 2) + 6</small><br>עומק טובוס לאינטובציה דרך הפה (לפי הערכת משקל): <b>" + (estKg + 6).toFixed(1) + "</b> <small>משקל בק״ג + 6</small>"
      : "";
    const trs = $("pr-tubes").querySelectorAll("tr");
    const row = estKg ? (estKg < 0.8 ? 0 : estKg <= 1.2 ? 1 : estKg <= 2.2 ? 2 : 3) : -1;
    trs.forEach(function (tr, i) { if (i > 0) tr.classList.toggle("hit", i - 1 === row); });

    // קבלה למחלקה: משקל לידה אם הוזן, אחרת הערכה
    const w = bwKg || estKg, src = bwKg ? "משקל לידה" : "הערכת משקל";
    const need = '<em>יש להזין משקל</em>';
    const g = Math.round((w || 0) * 1000);
    // סורפקטנט: 200 מ"ג/ק"ג, 80 מ"ג/מ"ל
    $("pr-sur").innerHTML = w ? 'סורפקטנט - מינון <b>' + ml(cut2((200 * w) / 80)) + "</b> " + ML + ' <small>(200 מ"ג/ק"ג ÷ 80 מ"ג/מ"ל: 200 × ' + n(mg(w)) + " ÷ 80)</small>" : "סורפקטנט - " + need;
    // אמפיצילין, גנטמיצין, קפאין: לפי מחשבון התרופות
    const amp = w ? NT.ampicillin(g) : null;
    $("pr-amp").innerHTML = amp && !amp.error ? "אמפיצילין - מינון <b>" + mg(amp.dose) + "</b> " + MG + "<br>להכנה בתוך 5 " + ML + " של סליין - <b>" + mg(amp.withExt) + "</b> " + MG : "אמפיצילין - " + need;
    $("pr-amp-s").innerHTML = amp && !amp.error ? NT.stepsHtml("amp", amp) : "";
    let gen = null;
    if (w && gaOk) gen = NT.gentamicin(g, gaOk.w);
    if (gen && !gen.error) {
      const fr = gaOk.w <= 29 ? "פעם ב-48 שעות" : gaOk.w <= 34 ? "פעם ב-36 שעות" : "";
      $("pr-gen").innerHTML = "גארמיצין - מינון <b>" + mg(gen.dose) + "</b> " + MG + (gen.mode === "pure" ? "<br>תרופה טהורה (<bdi dir=ltr>PURE</bdi>) עם מאריך: <b>" + mg(gen.withExt) + "</b> " + MG : "<br>להכנה בתוך 5 " + ML + " של סליין - <b>" + mg(gen.withExt) + "</b> " + MG) + (fr ? " <small>(" + fr + ")</small>" : "");
      $("pr-gen-s").innerHTML = NT.stepsHtml("gen", gen);
    } else {
      $("pr-gen").innerHTML = "גארמיצין - " + (w ? "<em>יש להזין שבוע הריון</em>" : need);
      $("pr-gen-s").innerHTML = "";
    }
    // פנטניל: 1 מיקרוגרם/ק"ג
    if (w) {
      const f = cut2(w);
      $("pr-fen").innerHTML = "פנטניל - להכין <b>" + f.toFixed(2) + "</b> מיקרוגרם מהולים למתן בפוש איטי";
      $("pr-fen-s").innerHTML = '<ol class="steps"><li>מינון: 1 מיקרוגרם/ק"ג × ' + n(mg(w)) + ' = <b>' + n(f.toFixed(2)) + ' מיקרוגרם</b></li><li>יש לשאוב 0.1 מ״ל של התרופה (שהם 5 מיקרוגרם), ולהשלים עד 1 מ״ל עם <bdi dir="ltr">NACL 0.9%</bdi></li><li>לאחר המיהול יהיו במזרק 5 מיקרוגרם ב-1 מ״ל</li><li>ולתת לפי המינון הנדרש למשקל (<b>' + n(f.toFixed(2)) + '</b> מיקרוגרם)</li></ol>';
    } else { $("pr-fen").innerHTML = "פנטניל - " + need; $("pr-fen-s").innerHTML = ""; }
    // קפאין בקבלה: העמסה 20 מ"ג/ק"ג, ואחרי 24 שעות 10 מ"ג/ק"ג
    const caf = w ? NT.caffeine(g, 20) : null;
    $("pr-caf").innerHTML = caf && !caf.error ? "קפאין בקבלה - מינון <b>" + mg(caf.dose) + "</b> " + MG + "<br>עם מאריך: <b>" + mg(caf.withExt) + "</b> " + MG : "קפאין בקבלה - " + need;
    $("pr-caf-s").innerHTML = caf && !caf.error ? NT.stepsHtml("caf", caf) : "";
    $("pr-caf2").innerHTML = w ? 'לא לשכוח לתת קפאין אחרי 24 שעות - מינון <b>' + mg(10 * w) + "</b> " + MG + ' <small>(10 מ"ג/ק"ג × ' + n(mg(w)) + ")</small>" : "לא לשכוח לתת קפאין אחרי 24 שעות - " + need;

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
    checkTemp();
  }
  // חום: אם עברה רבע שעה משעת הקבלה והמדידה לא סומנה, השורה מודגשת
  function checkTemp() {
    const t = $("pr-time").value, row = $("pr-temp");
    let late = false;
    if (t && !row.querySelector("input").checked) {
      const p = t.split(":"), d = new Date();
      d.setHours(+p[0], +p[1], 0, 0);
      late = Date.now() > d.getTime() + 15 * 60000;
    }
    row.classList.toggle("late", late);
  }
  ["pr-ga", "pr-w", "pr-bw"].forEach((i) => $(i).addEventListener("input", render));
  $("pr-time").addEventListener("input", checkTemp);
  $("pr-temp").addEventListener("change", checkTemp);
  setInterval(checkTemp, 60000);
  render();
})();
