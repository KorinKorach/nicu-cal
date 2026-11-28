// הכנת ציוד לפעולות. להוספת פעולה חדשה: מוסיפים אובייקט לרשימה PROCS.
(function () {
  var PROCS = [
    {
      title: "הכנת עמדה לקבלה: חדרים 2 ו-3",
      items: [
        "אינקובטור פתוח עם חימום (מוגדר על סרבו / <bdi dir=ltr>PRE</bdi>)",
        "כבל לסרבו מותאם לאינקובטור",
        "מדבקות למוניטור",
        "סנסור סטורציה (כחול או אפור - תלוי בסוג הכבל)",
        "מנג'טה ללחץ דם",
        { h: "בנוסף לחדר 2 (יילוד נשימתי)" },
        "כיפת חמצן",
        "צינור חמצן",
        "מד חמצן",
        { h: "רצוי" },
        "מד חום",
        "דבק משי",
        "טיטול ומשחת החתלה"
      ],
      img: "equipment/station.jpg?v=1795312771",
      alt: "עמדת קבלה מוכנה"
    },
    {
      title: "פתיחת וריד פריפרי",
      notes: [{ pre: "בקבלה של יילוד לבירור זיהומי, יש להוסיף גם את הציוד מהפעולה: ", link: "בירור זיהומי בקבלה", to: "בירור זיהומי בקבלה" }],
      items: [
        "כפפות סטריליות",
        "גזות סטריליות עם תמיסת חיטוי (כלורהקסידין 2%)",
        "צנתר ורידי",
        "סט הארכה עם מחברים",
        "אמפולת סליין",
        "מזרק 3 מ\"ל",
        "מזרק 1 מ\"ל",
        "מחט ירוקה",
        "שקופיות לקיבוע (<bdi dir=ltr>Tegaderm</bdi>) × 2"
      ],
      sterile: true,
      img: "equipment/iv.jpg",
      alt: "הציוד לפתיחת וריד פריפרי מסודר על העגלה"
    },
    {
      title: "בירור זיהומי בקבלה",
      items: [
        "כפפות סטריליות",
        "גזות סטריליות עם תמיסת חיטוי (אלכוספט)",
        "בקבוקון תרבית דם (<bdi dir=ltr>BACTEC</bdi>)",
        "מחט ירוקה × 2",
        "מזרק 3 מ\"ל",
        "מזרק לגזים",
        "מבחנה סגולה לספירה",
        "טופס בדיקות מיקרוביולוגיות (כחול) - לתרבית",
        "טופס בדיקות המטולוגיות (ירוק) - לספירה"
      ],
      sterile: true,
      img: "equipment/workup.jpg",
      alt: "הציוד לבירור זיהומי בקבלה מסודר על העגלה"
    },
    {
      title: "הכנת נוזלים",
      items: [
        "כפפות סטריליות",
        "גזות סטריליות עם תמיסת חיטוי (כלורהקסידין 0.5%)",
        "שקית נוזלים (לפי הוראה רפואית)",
        "בירטה (מיכל מדורג)",
        "סט עירוי עם מחברים וברזים",
        "פילטר לעירוי תוך-ורידי"
      ],
      sterile: true,
      img: "equipment/fluids.jpg?v=1795312771",
      alt: "הציוד להכנת נוזלים מסודר על העגלה"
    },
    {
      title: "הכנסת זונדה",
      items: [
        "זונדה (צינור הזנה)",
        "דבק משי או שקופית לקיבוע (<bdi dir=ltr>Tegaderm</bdi>)",
        "כפפות"
      ],
      depthCalc: true,
      img: "equipment/tube.jpg",
      alt: "הציוד להכנסת זונדה מסודר על העגלה"
    },
    {
      title: "לבוש סטרילי",
      items: [
        "חלוק סטרילי",
        "כובע",
        "מסכה",
        "כפפות סטריליות"
      ],
      img: "equipment/gown.jpg",
      alt: "הציוד להכנת לבוש סטרילי מסודר על העגלה"
    },
    {
      title: "הכנסת PICC LINE",
      items: [
        "שדה סטרילי × 2",
        "שדה סטרילי עם חור דביק (לבקשת הרופאה)",
        "ערכת קטטר טבורי לפגיה",
        "צנתר ורידי (20 ס\"מ / 8 ס\"מ)",
        "טרנסאילומינטור",
        "כיסוי סטרילי למתמר",
        "שקופית לקיבוע (<bdi dir=ltr>Tegaderm</bdi>) מסוג \"דובי\"",
        "ביונקטור",
        "מזרק 3 מ\"ל × 2",
        "מחט ירוקה",
        "פדים סטריליים עם תמיסת חיטוי (כלורהקסידין 2% / 1%)"
      ],
      notes: [{ pre: "בנוסף, יש להכין ", link: "לבוש סטרילי", post: " למבצעי הפעולה", to: "לבוש סטרילי" }],
      sterile: "יש לפתוח את הציוד על שדה סטרילי",
      img: "equipment/picc.jpg",
      alt: "הציוד להכנסת PICC LINE מסודר על העגלה"
    },
    {
      title: "ביצוע LP (ניקור מותני)",
      items: [
        "מבחנה סטרילית שקופה × 4",
        "פדים סטריליים עם תמיסת חיטוי (כלורהקסידין 2%)",
        "פדים סטריליים יבשים",
        "מחט כנפיים (\"פרפרית\") ולהב או מחט כחולה",
        "שקופית לקיבוע (<bdi dir=ltr>Tegaderm</bdi>)",
        "טפסי מעבדה: תרבית, כימיה, ספירה ושמירה"
      ],
      notes: [{ pre: "בנוסף, יש להכין ", link: "לבוש סטרילי", post: " למבצעי הפעולה", to: "לבוש סטרילי" }],
      sterile: true,
      img: "equipment/lp.jpg",
      alt: "הציוד לביצוע LP מסודר על העגלה"
    }
  ];
  var sel = document.getElementById("eq-sel"), out = document.getElementById("eq-out");
  if (!sel) return;
  PROCS.forEach(function (p, i) {
    var o = document.createElement("option");
    o.value = i;
    o.textContent = p.title;
    sel.appendChild(o);
  });
  function render(p) {
    out.textContent = "";
    if (!p) return;
    var ul = document.createElement("div");
    ul.className = "eqitems";
    if (p.sterile) {
      var gn = document.createElement("p");
      gn.className = "eqsterile";
      gn.textContent = typeof p.sterile === "string" ? p.sterile : "יש לפתוח את הציוד על מגש סטרילי";
      out.appendChild(gn);
    }
    if (p.depthCalc) {
      var lk = document.createElement("button");
      lk.type = "button";
      lk.className = "nowbtn eqcalc";
      lk.textContent = "חישוב עומק זונדה בפגים";
      var box = document.createElement("div");
      box.className = "eqcbox";
      box.hidden = true;
      box.innerHTML = '<label>משקל היילוד (בק"ג, למשל 2.2) <input id="eq-w" type="number" inputmode="decimal" step="0.001" min="0"></label><div id="eq-depth" class="out"></div><p class="eqfm" dir="ltr">2 × (6 + (2 × משקל היילוד)) = עומק בס"מ</p>';
      lk.addEventListener("click", function (e) {
        e.preventDefault();
        box.hidden = !box.hidden;
        var w = document.getElementById("eq-w");
        if (!box.hidden) {
          var bw = document.getElementById("baby-w");
          if (!w.value && bw && bw.value) { w.value = bw.value; w.dispatchEvent(new Event("input")); }
          w.focus();
        }
      });
      out.appendChild(lk);
      out.appendChild(box);
      var wi = box.querySelector("#eq-w"), od = box.querySelector("#eq-depth");
      wi.addEventListener("input", function () {
        var kg = parseFloat(wi.value);
        if (isNaN(kg)) { od.textContent = ""; return; }
        if (kg <= 0 || kg > 20) { od.innerHTML = '<p class="err">המשקל מוזן בקילוגרמים (למשל 3.3)</p>'; return; }
        var d = 2 * (6 + 2 * kg), r = Math.round(d * 10) / 10;
        od.innerHTML = '<div class="card"><b>עומק הזונדה</b><span class="big">' + r + ' ס"מ</span><br><span dir="ltr">2 × (6 + (2 × ' + kg + ')) = ' + r + '</span></div>';
      });
    }
    p.items.forEach(function (t) {
      if (typeof t === "object") {
        var hd = document.createElement("p");
        hd.className = "eqhead";
        hd.textContent = t.h;
        ul.appendChild(hd);
        return;
      }
      var l = document.createElement("label");
      l.className = "chk eqi";
      var c = document.createElement("input");
      c.type = "checkbox";
      l.appendChild(c);
      var sp = document.createElement("span");
      sp.innerHTML = " " + t;
      l.appendChild(sp);
      ul.appendChild(l);
    });
    out.appendChild(ul);
    var done = document.createElement("p");
    done.className = "eqdone";
    done.hidden = true;
    done.textContent = "כל הציוד מוכן ✓";
    out.appendChild(done);
    var b = document.createElement("button");
    b.type = "button";
    b.className = "nowbtn";
    b.textContent = "ניקוי סימונים";
    out.appendChild(b);
    (p.notes || []).forEach(function (n) {
      var nt = document.createElement("p");
      nt.className = "eqnote2";
      nt.appendChild(document.createTextNode(n.pre));
      var a = document.createElement("a");
      a.href = "#";
      a.textContent = n.link;
      a.addEventListener("click", function (e) {
        e.preventDefault();
        PROCS.forEach(function (q, k) { if (q.title === n.to) { sel.value = k; sel.dispatchEvent(new Event("change")); window.scrollTo(0, 0); } });
      });
      nt.appendChild(a);
      if (n.post) nt.appendChild(document.createTextNode(n.post));
      out.appendChild(nt);
    });
    if (p.img) {
      var h = document.createElement("p");
      h.className = "eqcap";
      h.textContent = "כך נראה הציוד מסודר:";
      out.appendChild(h);
      var im = document.createElement("img");
      im.className = "eqimg";
      im.src = p.img;
      im.alt = p.alt || p.title;
      im.addEventListener("click", function () { openZoom(im.src, im.alt); });
      out.appendChild(im);    }
    function upd() { done.hidden = ul.querySelectorAll("input:checked").length !== ul.querySelectorAll("input").length; }
    ul.addEventListener("change", upd);
    b.addEventListener("click", function () {
      ul.querySelectorAll("input").forEach(function (c) { c.checked = false; });
      upd();
    });
  }
  // הגדלת תמונה: חלון מסך מלא עם גלילה וכפתור סגירה
  var zoomEl = null, zoomImg = null;
  function closeZoom() { if (zoomEl) { zoomEl.hidden = true; document.body.style.overflow = ""; } }
  function openZoom(src, alt) {
    if (!zoomEl) {
      zoomEl = document.createElement("div");
      zoomEl.id = "eqzoom";
      var x = document.createElement("button");
      x.type = "button"; x.id = "eqzoomx"; x.textContent = "✕ סגירה";
      x.addEventListener("click", closeZoom);
      zoomImg = document.createElement("img");
      zoomEl.appendChild(x); zoomEl.appendChild(zoomImg);
      zoomEl.addEventListener("click", function (e) { if (e.target === zoomEl) closeZoom(); });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeZoom(); });
      document.body.appendChild(zoomEl);
    }
    zoomImg.src = src; zoomImg.alt = alt || "";
    zoomEl.hidden = false; zoomEl.scrollTop = 0; zoomEl.scrollLeft = 0;
    document.body.style.overflow = "hidden";
  }
  var note = document.querySelector(".eqnote");
  sel.addEventListener("change", function () {
    render(sel.value === "" ? null : PROCS[+sel.value]);
    if (note) note.hidden = sel.value !== "";
  });
})();
