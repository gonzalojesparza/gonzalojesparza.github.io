(function () {
  "use strict";

  var root = document.documentElement;
  var COOK_TIME_MS = 400;
  var VIEW_KEY = "kitchen-view";
  var motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var autoMenuQuery = window.matchMedia("(max-width: 700px), (prefers-reduced-motion: reduce)");

  function isModifiedClick(event) {
    return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
  }

  function cook(item, done) {
    if (motionQuery.matches) {
      done();
      return;
    }
    var pan = item.querySelector(".pan");
    var finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      done();
    }
    item.classList.remove("cooking");
    void item.offsetWidth;
    item.classList.add("cooking");
    if (pan) pan.addEventListener("animationend", finish, { once: true });
    setTimeout(finish, COOK_TIME_MS + 100);
  }

  function initGriddle() {
    document.querySelectorAll("a.food").forEach(function (link) {
      link.addEventListener("click", function (event) {
        if (isModifiedClick(event)) return;

        // New-tab links must open inside the click handler or popup blockers may stop them.
        if (link.target === "_blank") {
          cook(link, function () {
            link.classList.remove("cooking");
          });
          return;
        }

        event.preventDefault();
        cook(link, function () {
          window.location.href = link.href;
        });
      });
    });

    // Reset the lift state when returning via the back/forward cache.
    window.addEventListener("pageshow", function () {
      document.querySelectorAll(".food.cooking").forEach(function (el) {
        el.classList.remove("cooking");
      });
    });
  }

  function setView(view, remember) {
    root.dataset.view = view;
    if (remember) {
      try { localStorage.setItem(VIEW_KEY, view); } catch (e) {}
    }
  }

  function initViewToggle() {
    var toggle = document.querySelector(".view-toggle");
    if (!toggle) return;

    toggle.addEventListener("click", function () {
      var next = root.dataset.view === "menu" ? "griddle" : "menu";
      setView(next, true);
      var target = document.getElementById(next);
      if (target) target.scrollIntoView({ block: "nearest" });
    });

    autoMenuQuery.addEventListener("change", function (event) {
      var saved = null;
      try { saved = localStorage.getItem(VIEW_KEY); } catch (e) {}
      if (!saved) setView(event.matches ? "menu" : "griddle", false);
    });
  }

  function initYear() {
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  initGriddle();
  initViewToggle();
  initYear();
})();
