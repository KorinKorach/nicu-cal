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
    let base = 0, start = null, tick = null, fired = {}, ctx = null;
    const clock = $("pr-clock"), msg = $("pr-beep");
    const bS = $("pr-c-start"), bP = $("pr-c-stop"), bX = $("pr-c-reset");
    const fmt = (s) => String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
    const secs = () => Math.floor((base + (start ? Date.now() - start : 0)) / 1000);
    function beep() {
      try {
        if (!ctx) return;
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.value = 800; g.gain.setValueAtTime(0.8, ctx.currentTime); g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25);
        o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.25);
      } catch (e) {}
    }
    // מצבים: idle (אפס), run, paused
    function ui() {
      const st = tick ? "run" : base > 0 ? "paused" : "idle";
      bS.disabled = st !== "idle"; bP.disabled = st === "idle"; bP.textContent = st === "paused" ? "המשך" : "עצור";
      bX.disabled = st === "idle";
    }
    function halt() { clearInterval(tick); tick = null; if (start) base += Date.now() - start; start = null; ui(); }
    function step() {
      const s = secs();
      clock.textContent = fmt(s);
      [[60, "m1", "דקה"], [300, "m5", "5 דקות"], [600, "m10", "10 דקות"]].forEach(function (k) {
        if (s >= k[0] && !fired[k[1]]) {
          fired[k[1]] = 1; beep();
          msg.hidden = false; msg.textContent = "הגיע הזמן לציון אפגר " + k[2] + "!";
          box.querySelector('[data-m="' + k[1] + '"]').open = true;
        }
      });
      if (s >= 600) halt();
    }
    function run() {
      try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === "suspended") ctx.resume(); } catch (e) {}
      start = Date.now(); tick = setInterval(step, 250); ui();
    }
    bS.addEventListener("click", function () { base = 0; fired = {}; msg.hidden = true; clock.textContent = "00:00"; run(); });
    bP.addEventListener("click", function () { if (tick) { halt(); clock.textContent = fmt(secs()); } else run(); });
    bX.addEventListener("click", function () { halt(); base = 0; fired = {}; msg.hidden = true; clock.textContent = "00:00"; ui(); });
    ui();
    NT.apgar = {
      get: function () { return { elapsed: base + (start ? Date.now() - start : 0), running: !!tick, fired: fired, at: Date.now() }; },
      set: function (st) {
        halt(); msg.hidden = true; fired = Object.assign({}, st.fired || {});
        base = (st.elapsed || 0) + (st.running ? Date.now() - (st.at || Date.now()) : 0);
        if (st.running) { if (base >= 600000) { base = 600000; fired = { m1: 1, m5: 1, m10: 1 }; } else run(); }
        clock.textContent = fmt(secs()); ui();
      },
      reset: function () { halt(); base = 0; fired = {}; msg.hidden = true; clock.textContent = "00:00"; ui(); }
    };
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

  // ---------- שמירה אוטומטית ולידות קודמות (מקומי במכשיר, 24 שעות) ----------
  (function () {
    const KEY = "nc_preemie_v1", TTL = 24 * 3600 * 1000, root = $("preemie");
    let store = { cur: null, recs: {} }, restoring = false, timer = null;
    try { const x = JSON.parse(localStorage.getItem(KEY)); if (x && x.recs) store = x; } catch (e) {}
    const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} };
    function purge() {
      const now = Date.now();
      Object.keys(store.recs).forEach((id) => { if (now - store.recs[id].u > TTL) delete store.recs[id]; });
      if (!store.recs[store.cur]) store.cur = null;
    }
    const boxes = () => [...root.querySelectorAll('input[type=checkbox],input[type=radio]')];
    function snapshot() {
      return {
        f: boxes().map((x) => (x.checked ? 1 : 0)),
        t: [$("pr-ga").value, $("pr-w").value],
        cw: root.querySelector("#pr-cord-why input").value,
        sel: ["pr-ster", "pr-mabx", "pr-eqsel"].map((id) => $(id).value),
        ap: [...root.querySelectorAll(".apbtn")].map((b) => (b.classList.contains("sel") ? 1 : 0)),
        tm: NT.apgar.get(),
      };
    }
    const isEmpty = (d) => !d.t[0] && !d.t[1] && !d.cw && d.sel.every((v) => !v) && !d.f.includes(1) && !d.ap.includes(1) && !d.tm.elapsed && !d.tm.running;
    function clearForm() {
      restoring = true;
      boxes().forEach((x) => (x.checked = false));
      ["pr-ga", "pr-w"].forEach((id) => ($(id).value = ""));
      root.querySelector("#pr-cord-why input").value = "";
      ["pr-ster", "pr-mabx", "pr-eqsel"].forEach((id) => ($(id).value = ""));
      $("pr-eqsel").dispatchEvent(new Event("change"));
      $("pr-cord-why").hidden = true;
      root.querySelectorAll(".apbtn.sel").forEach((b) => b.classList.remove("sel"));
      root.querySelectorAll(".aptv").forEach((e) => (e.textContent = "—"));
      root.querySelectorAll(".aptot").forEach((e) => (e.textContent = ""));
      NT.apgar.reset();
      render();
      restoring = false;
    }
    function apply(d) {
      clearForm();
      restoring = true;
      const bx = boxes();
      d.f.forEach((v, i) => { if (bx[i]) bx[i].checked = !!v; });
      $("pr-ga").value = d.t[0]; $("pr-w").value = d.t[1];
      root.querySelector("#pr-cord-why input").value = d.cw || "";
      $("pr-cord-why").hidden = !$("pr-cord-no").checked;
      ["pr-ster", "pr-mabx", "pr-eqsel"].forEach((id, i) => ($(id).value = d.sel[i] || ""));
      $("pr-eqsel").dispatchEvent(new Event("change"));
      root.querySelectorAll(".apbtn").forEach((b, i) => { if (d.ap[i]) b.click(); });
      NT.apgar.set(d.tm);
      render();
      restoring = false;
    }
    function save() {
      if (restoring) return;
      const d = snapshot();
      if (isEmpty(d)) { if (store.cur) { delete store.recs[store.cur]; store.cur = null; persist(); list(); } return; }
      if (!store.cur) { store.cur = "r" + Date.now(); store.recs[store.cur] = { c: Date.now() }; }
      const r = store.recs[store.cur]; r.d = d; r.u = Date.now();
      persist(); list();
    }
    const later = () => { clearTimeout(timer); timer = setTimeout(save, 300); };
    function list() {
      purge();
      const ids = Object.keys(store.recs).filter((id) => id !== store.cur).sort((a, b) => store.recs[b].c - store.recs[a].c);
      $("pr-prev").hidden = !ids.length;
      $("pr-prevlist").innerHTML = ids.map(function (id) {
        const r = store.recs[id], tm = new Date(r.c).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
        return '<div class="prrec"><button type="button" class="nowbtn" data-open="' + id + '"><bdi>' + (r.d.t[0] || "—") + "</bdi> · <bdi>" + (r.d.t[1] || "—") + '</bdi> ק"ג · <bdi>' + tm + '</bdi></button><button type="button" class="nowbtn" data-del="' + id + '" aria-label="מחיקה">✕</button></div>';
      }).join("");
    }
    root.addEventListener("input", later);
    root.addEventListener("change", later);
    root.addEventListener("click", later);
    setInterval(function () { if (NT.apgar.get().running) save(); }, 2000);
    $("pr-new").addEventListener("click", function () {
      clearTimeout(timer); save();
      store.cur = null; persist();
      clearForm(); list();
    });
    $("pr-clear").addEventListener("click", function () {
      clearTimeout(timer);
      if (store.cur) delete store.recs[store.cur];
      store.cur = null; persist();
      clearForm(); list();
    });
    $("pr-prevlist").addEventListener("click", function (e) {
      const o = e.target.closest("[data-open]"), x = e.target.closest("[data-del]");
      if (o) {
        clearTimeout(timer); save();
        const id = o.dataset.open;
        if (!store.recs[id]) return;
        store.cur = id; persist(); apply(store.recs[id].d); list(); window.scrollTo(0, 0);
      } else if (x) { delete store.recs[x.dataset.del]; persist(); list(); }
    });
    purge();
    if (store.cur && store.recs[store.cur]) apply(store.recs[store.cur].d);
    persist(); list();
  })();
})();
