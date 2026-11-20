(function () {
  "use strict";

  // Current year in footer
  var yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  // Reveal-on-scroll
  var revealEls = document.querySelectorAll("[data-reveal]");
  if (!("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  } else {
    var observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    revealEls.forEach(function (el) {
      observer.observe(el);
    });
  }

  var carousel = document.querySelector("[data-carousel]");
  if (!carousel) return;

  var viewport = carousel.querySelector(".carousel__viewport");
  var track = carousel.querySelector(".carousel__track");
  var prev = carousel.querySelector("[data-carousel-prev]");
  var next = carousel.querySelector("[data-carousel-next]");
  var dotsEl = carousel.querySelector("[data-carousel-dots]");
  var status = carousel.querySelector("[data-carousel-status]");
  var slides = track ? Array.prototype.slice.call(track.children) : [];

  if (!viewport || !track || !dotsEl || slides.length === 0) return;

  var current = -1;
  var ticking = false;
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function scrollBehavior() {
    return reducedMotion.matches ? "auto" : "smooth";
  }

  function slideStep() {
    if (slides.length < 2) return 0;
    var first = slides[0].getBoundingClientRect();
    var second = slides[1].getBoundingClientRect();
    return second.left - first.left;
  }

  function maxScroll() {
    return Math.max(0, track.scrollWidth - viewport.clientWidth);
  }

  function pageCount() {
    var step = slideStep();
    if (step <= 0) return 1;
    return Math.min(slides.length, Math.ceil(maxScroll() / step) + 1);
  }

  function pageLeft(index) {
    var step = slideStep();
    if (step <= 0) return 0;
    return Math.min(index * step, maxScroll());
  }

  function setCurrent(index, force) {
    var count = pageCount();
    var bounded = Math.max(0, Math.min(index, count - 1));

    if (!force && bounded === current && dotsEl.children.length === count) return;

    current = bounded;

    Array.prototype.forEach.call(dotsEl.children, function (dot, dotIndex) {
      if (dotIndex === bounded) {
        dot.setAttribute("aria-current", "true");
      } else {
        dot.removeAttribute("aria-current");
      }
    });

    if (status) {
      status.textContent = "View " + (bounded + 1) + " of " + count;
    }
  }

  function goTo(index) {
    var count = pageCount();
    var bounded = (index + count) % count;
    viewport.scrollTo({ left: pageLeft(bounded), behavior: scrollBehavior() });
    setCurrent(bounded, true);
  }

  function nearestPage() {
    var step = slideStep();
    if (step <= 0) return 0;
    return Math.max(0, Math.min(pageCount() - 1, Math.round(viewport.scrollLeft / step)));
  }

  function buildDots() {
    dotsEl.textContent = "";
    var count = pageCount();

    for (var index = 0; index < count; index += 1) {
      (function (page) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.className = "carousel__dot";
        dot.setAttribute("aria-label", "Go to view " + (page + 1));
        dot.addEventListener("click", function () {
          goTo(page);
        });
        dotsEl.appendChild(dot);
      })(index);
    }

    current = -1;
    setCurrent(nearestPage(), true);
  }

  buildDots();

  viewport.addEventListener(
    "scroll",
    function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        setCurrent(nearestPage());
        ticking = false;
      });
    },
    { passive: true }
  );

  if (prev) {
    prev.addEventListener("click", function () {
      goTo(current - 1);
    });
  }

  if (next) {
    next.addEventListener("click", function () {
      goTo(current + 1);
    });
  }

  viewport.addEventListener("keydown", function (event) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(current - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(current + 1);
    }
  });

  window.addEventListener("resize", function () {
    buildDots();
  });
})();
