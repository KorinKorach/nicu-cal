// הכנת ציוד לפעולות. להוספת פעולה חדשה: מוסיפים אובייקט לרשימה PROCS.
(function () {
  var PROCS = [
    {
      title: "הכנת נוזלים",
      items: [
        "שקית נוזל לעירוי (לפי הוראה רפואית)",
        "בירטה (מיכל מדורג)",
        "סט עירוי עם מחברים וברזים",
        "פילטר לעירוי תוך-ורידי",
        "כפפות סטריליות",
        "גזות סטריליות עם תמיסת חיטוי (כלורהקסידין)"
      ],
      img: "equipment/fluids.jpg?v=1795271090",
      alt: "הציוד להכנת נוזלים מסודר על העגלה"
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
    p.items.forEach(function (t) {
      var l = document.createElement("label");
      l.className = "chk eqi";
      var c = document.createElement("input");
      c.type = "checkbox";
      l.appendChild(c);
      l.appendChild(document.createTextNode(" " + t));
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
    if (p.img) {
      var h = document.createElement("p");
      h.className = "eqcap";
      h.textContent = "כך נראה הציוד מסודר:";
      out.appendChild(h);
      var im = document.createElement("img");
      im.className = "eqimg";
      im.src = p.img;
      im.alt = p.alt || p.title;
      out.appendChild(im);
    }
    function upd() { done.hidden = ul.querySelectorAll("input:checked").length !== ul.querySelectorAll("input").length; }
    ul.addEventListener("change", upd);
    b.addEventListener("click", function () {
      ul.querySelectorAll("input").forEach(function (c) { c.checked = false; });
      upd();
    });
  }
  var note = document.querySelector(".eqnote");
  sel.addEventListener("change", function () {
    render(sel.value === "" ? null : PROCS[+sel.value]);
    if (note) note.hidden = sel.value !== "";
  });
})();
