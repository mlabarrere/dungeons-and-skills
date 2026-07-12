/* ==========================================================================
   ds.js — comportements partages des pages du Dungeons & Skills D&D
   --------------------------------------------------------------------------
   Aucun framework, aucun build. Chaque page charge ce script en fin de <body> :
     <script src="../assets/ds.js" defer></script>
   Fonctions :
   1. Fil d'Ariane : injecte depuis <body data-breadcrumb="Accueil|/index.html;
      Classes|/classes/index.html; Druide">  (paires "libelle|href" separees par ;
      le dernier segment sans href = page courante).
   2. Footer commun.
   3. Onglets accessibles : conteneur .tabs + panneaux .tabpanel[id] relies par
      <button data-tab="id-du-panneau">.
   4. Bouton impression : tout [data-print] appelle window.print().
   Les chemins data-breadcrumb sont resolus par rapport a la racine docs/html/,
   calculee via l'attribut data-root du <body> (ex. data-root="..").
   ========================================================================== */
(function () {
  "use strict";

  function resolveRoot() {
    var body = document.body;
    var root = body && body.getAttribute("data-root");
    return root ? root.replace(/\/+$/, "") : ".";
  }

  function buildBreadcrumb() {
    var body = document.body;
    var spec = body && body.getAttribute("data-breadcrumb");
    if (!spec) return;

    var root = resolveRoot();
    var nav = document.createElement("nav");
    nav.className = "breadcrumb";
    nav.setAttribute("aria-label", "Fil d'Ariane");

    var parts = spec.split(";").map(function (s) { return s.trim(); }).filter(Boolean);
    parts.forEach(function (part, i) {
      var seg = part.split("|");
      var libelle = seg[0].trim();
      var href = seg[1] ? seg[1].trim() : null;

      if (i > 0) {
        var sep = document.createElement("span");
        sep.className = "sep";
        sep.textContent = "/";
        nav.appendChild(sep);
      }

      if (href) {
        var a = document.createElement("a");
        a.href = href.charAt(0) === "/" ? root + href : href;
        a.textContent = libelle;
        nav.appendChild(a);
      } else {
        var span = document.createElement("span");
        span.textContent = libelle;
        span.setAttribute("aria-current", "page");
        nav.appendChild(span);
      }
    });

    var main = document.querySelector("main");
    if (main) main.insertBefore(nav, main.firstChild);
  }

  function buildFooter() {
    if (document.querySelector(".site-footer")) return; // deja present : ne pas dupliquer
    var root = resolveRoot();
    var footer = document.createElement("footer");
    footer.className = "site-footer";
    footer.innerHTML =
      'Dungeons & Skills — base documentaire HTML (source de verite). ' +
      'Aide personnelle de reference, usage prive de table. ' +
      '<a href="' + root + '/index.html">Accueil</a> · ' +
      '<a href="' + root + '/styleguide.html">Styleguide</a>';
    document.body.appendChild(footer);
  }

  function wireTabs() {
    var groups = document.querySelectorAll(".tabs");
    groups.forEach(function (tabs) {
      var buttons = tabs.querySelectorAll("[data-tab]");
      function select(id) {
        buttons.forEach(function (b) {
          var on = b.getAttribute("data-tab") === id;
          b.setAttribute("aria-selected", on ? "true" : "false");
          var panel = document.getElementById(b.getAttribute("data-tab"));
          if (panel) panel.hidden = !on;
        });
      }
      buttons.forEach(function (b) {
        b.setAttribute("role", "tab");
        b.addEventListener("click", function () { select(b.getAttribute("data-tab")); });
      });
      var first = buttons[0];
      if (first) select(first.getAttribute("data-tab"));
    });
  }

  function wirePrint() {
    document.querySelectorAll("[data-print]").forEach(function (btn) {
      btn.addEventListener("click", function () { window.print(); });
    });
  }

  function init() {
    buildBreadcrumb();
    buildFooter();
    wireTabs();
    wirePrint();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
