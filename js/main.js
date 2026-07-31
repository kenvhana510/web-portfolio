(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // --- Mobile nav toggle ---
  var toggle = document.querySelector(".nav-toggle");
  var mobileNav = document.querySelector(".mobile-nav");

  if (toggle && mobileNav) {
    toggle.addEventListener("click", function () {
      var isOpen = mobileNav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mobileNav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // --- Active nav link ---
  var currentPage = document.body.getAttribute("data-page");
  if (currentPage) {
    document.querySelectorAll("[data-nav-link]").forEach(function (link) {
      if (link.getAttribute("data-nav-link") === currentPage) {
        link.setAttribute("aria-current", "page");
      }
    });
  }

  // --- Scroll reveal ---
  var observer = null;

  if (!prefersReducedMotion && "IntersectionObserver" in window) {
    observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
  }

  function initReveal() {
    var revealEls = document.querySelectorAll(".reveal:not(.is-visible)");

    revealEls.forEach(function (el, i) {
      if (!observer) {
        el.classList.add("is-visible");
        return;
      }
      el.style.setProperty("--stagger-i", i % 4);
      observer.observe(el);
    });
  }

  window.__initReveal = initReveal;
  initReveal();
})();
