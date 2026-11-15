/* Mobile menu behaviour on top of the checkbox.
   The checkbox still opens and closes the menu when this file does not run.
   Nothing here calls the network. */
(function () {
  "use strict";

  function boot() {
    var toggle = document.getElementById("nav-toggle");
    var nav = document.getElementById("site-nav");
    if (!toggle || !nav) return;

    var mobileQuery = window.matchMedia("(max-width: 860px)");

    function closeMenu(restoreFocus) {
      if (!toggle.checked) return;
      toggle.checked = false;
      syncScroll();
      if (restoreFocus) toggle.focus();
    }

    function syncScroll() {
      var scrolls =
        mobileQuery.matches &&
        toggle.checked &&
        nav.scrollHeight > nav.clientHeight + 1;
      if (scrolls) nav.setAttribute("tabindex", "0");
      else nav.removeAttribute("tabindex");
    }

    toggle.addEventListener("change", syncScroll);
    window.addEventListener("resize", syncScroll);
    if (typeof mobileQuery.addEventListener === "function") {
      mobileQuery.addEventListener("change", syncScroll);
    }

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      var inside = nav.contains(document.activeElement) || document.activeElement === toggle;
      closeMenu(inside);
    });

    nav.addEventListener("click", function (event) {
      var target = event.target;
      if (target && target.closest && target.closest("a")) closeMenu(false);
    });

    document.addEventListener("click", function (event) {
      if (!toggle.checked) return;
      var header = document.querySelector(".site-header");
      if (header && header.contains(event.target)) return;
      closeMenu(false);
    });

    window.addEventListener("pagehide", function () {
      toggle.checked = false;
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
