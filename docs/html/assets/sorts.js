/* ==========================================================================
   sorts.js — index interactif des sorts (filtrage + tri)
   --------------------------------------------------------------------------
   Charge UNIQUEMENT par docs/html/sorts/index.html (en plus de ds.js).
   Lit les data-* portes par chaque <tr> du tableau #spell-table :
     data-id, data-name, data-level, data-school, data-casting, data-classes,
     data-ritual, data-concentration
   Peuple les selects de filtres depuis les donnees, cable recherche + filtres
   + tri par colonne, et met a jour le compteur #f-count. Aucune dependance.
   ========================================================================== */
(function () {
  "use strict";

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  ready(function () {
    var table = document.getElementById("spell-table");
    if (!table) return;
    var rows = Array.prototype.slice.call(table.tBodies[0].rows);

    var $search = document.getElementById("f-search");
    var $level = document.getElementById("f-level");
    var $school = document.getElementById("f-school");
    var $class = document.getElementById("f-class");
    var $conc = document.getElementById("f-conc");
    var $ritual = document.getElementById("f-ritual");
    var $count = document.getElementById("f-count");

    // -- Peupler les selects a partir des lignes --------------------------
    function uniqSorted(vals) {
      return Array.from(new Set(vals.filter(Boolean))).sort(function (a, b) {
        var na = parseFloat(a), nb = parseFloat(b);
        if (!isNaN(na) && !isNaN(nb)) return na - nb;
        return String(a).localeCompare(String(b), "fr");
      });
    }
    function fill(sel, vals, labelFn) {
      if (!sel) return;
      uniqSorted(vals).forEach(function (v) {
        var o = document.createElement("option");
        o.value = v;
        o.textContent = labelFn ? labelFn(v) : v;
        sel.appendChild(o);
      });
    }
    var allClasses = [];
    rows.forEach(function (r) {
      (r.getAttribute("data-classes") || "").split(",").forEach(function (c) {
        c = c.trim(); if (c) allClasses.push(c);
      });
    });
    fill($level, rows.map(function (r) { return r.getAttribute("data-level"); }),
      function (v) { return v === "0" ? "Sort mineur (0)" : "Niveau " + v; });
    fill($school, rows.map(function (r) { return r.getAttribute("data-school"); }),
      function (v) { return v.charAt(0).toUpperCase() + v.slice(1); });
    fill($class, allClasses, function (v) { return v.charAt(0).toUpperCase() + v.slice(1); });

    // -- Filtrage ---------------------------------------------------------
    function norm(s) {
      return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    }
    function apply() {
      var q = norm($search && $search.value);
      var lvl = $level && $level.value;
      var sch = $school && $school.value;
      var cls = $class && $class.value;
      var conc = $conc && $conc.checked;
      var rit = $ritual && $ritual.checked;
      var shown = 0;
      rows.forEach(function (r) {
        var ok = true;
        if (q && norm(r.getAttribute("data-name")).indexOf(q) === -1) ok = false;
        if (ok && lvl && r.getAttribute("data-level") !== lvl) ok = false;
        if (ok && sch && r.getAttribute("data-school") !== sch) ok = false;
        if (ok && cls) {
          var list = (r.getAttribute("data-classes") || "").split(",").map(function (x) { return x.trim(); });
          if (list.indexOf(cls) === -1) ok = false;
        }
        if (ok && conc && r.getAttribute("data-concentration") !== "true") ok = false;
        if (ok && rit && r.getAttribute("data-ritual") !== "true") ok = false;
        r.hidden = !ok;
        if (ok) shown++;
      });
      if ($count) $count.textContent = shown + " / " + rows.length + " sorts";
    }

    [$search, $level, $school, $class].forEach(function (el) {
      if (el) el.addEventListener("input", apply);
    });
    [$conc, $ritual].forEach(function (el) {
      if (el) el.addEventListener("change", apply);
    });

    // -- Tri par colonne (clic sur th[data-sort]) -------------------------
    var dir = {};
    Array.prototype.forEach.call(table.tHead.rows[0].cells, function (th, i) {
      var key = th.getAttribute("data-sort");
      if (!key) return;
      th.style.cursor = "pointer";
      th.title = "Trier";
      th.addEventListener("click", function () {
        dir[key] = !dir[key];
        var mul = dir[key] ? 1 : -1;
        rows.sort(function (a, b) {
          var va = a.getAttribute("data-" + key) || "";
          var vb = b.getAttribute("data-" + key) || "";
          var na = parseFloat(va), nb = parseFloat(vb);
          if (!isNaN(na) && !isNaN(nb)) return (na - nb) * mul;
          return va.localeCompare(vb, "fr") * mul;
        });
        var tb = table.tBodies[0];
        rows.forEach(function (r) { tb.appendChild(r); });
      });
    });

    apply();
  });
})();
