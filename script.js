(() => {
  "use strict";

  document.documentElement.classList.add("js");

  const gate = document.getElementById("invitation-gate");
  const openButton = document.getElementById("open-invitation");
  const invitation = document.getElementById("invitation");
  const invitationTitle = document.getElementById("invitation-title");
  const music = document.getElementById("wedding-music");
  const musicToggle = document.getElementById("music-toggle");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const forceWelcome = new URLSearchParams(window.location.search).has("welcome");
  let opened = false;
  let resumeMusic = false;

  function updateMusicButton() {
    if (!music || !musicToggle) return;
    const paused = music.paused;
    musicToggle.classList.toggle("is-muted", paused);
    musicToggle.setAttribute("aria-label", paused ? "Play background music" : "Pause background music");
    const label = musicToggle.querySelector("span");
    if (label) label.textContent = paused ? "Play song" : "Pause song";
  }

  function showInvitation({ animate = true, focus = true } = {}) {
    if (opened || !invitation) return;
    opened = true;
    invitation.hidden = false;
    invitation.setAttribute("aria-hidden", "false");
    document.body.classList.remove("is-locked");

    const finish = () => {
      invitation.classList.add("is-revealed");
      if (gate) gate.hidden = true;
      if (focus) invitationTitle?.focus({ preventScroll: true });
    };

    if (animate && !reduceMotion && gate) {
      gate.setAttribute("aria-hidden", "true");
      gate.classList.add("is-opening");
      invitation.classList.add("is-revealed");
      window.setTimeout(finish, 1150);
    } else {
      finish();
    }

    try { sessionStorage.setItem("shida-ansab-opened", "true"); } catch (_) {}
  }

  openButton?.addEventListener("click", () => showInvitation());

  document.querySelector(".skip-link")?.addEventListener("click", (event) => {
    if (opened) return;
    event.preventDefault();
    showInvitation({ animate: false, focus: false });
    document.getElementById("events")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  });

  musicToggle?.addEventListener("click", () => {
    if (!music) return;
    if (music.paused) {
      music.volume = 0.48;
      music.play().then(updateMusicButton).catch(updateMusicButton);
    } else {
      music.pause();
    }
    updateMusicButton();
  });

  music?.addEventListener("play", updateMusicButton);
  music?.addEventListener("pause", updateMusicButton);

  document.addEventListener("visibilitychange", () => {
    if (!music) return;
    if (document.hidden) {
      resumeMusic = !music.paused;
      if (resumeMusic) music.pause();
    } else if (resumeMusic) {
      resumeMusic = false;
      music.play().then(updateMusicButton).catch(updateMusicButton);
    }
  });

  const revealItems = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8%" });
    revealItems.forEach((item) => observer.observe(item));
  }

  const days = document.getElementById("countdown-days");
  const countdownLabel = document.getElementById("countdown-label");
  if (days && countdownLabel) {
    const target = new Date("2026-10-10T16:00:00+05:30").getTime();
    const distance = target - Date.now();
    if (distance > 0) {
      const count = Math.ceil(distance / 86400000);
      days.textContent = String(count);
      countdownLabel.textContent = count === 1 ? "day to go" : "days to go";
    } else {
      days.textContent = "∞";
      countdownLabel.textContent = "memories begin";
    }
  }

  const mobileNav = document.querySelector(".mobile-nav");
  if (mobileNav) {
    const updateMobileNav = () => mobileNav.classList.toggle("is-visible", window.scrollY > 360);
    window.addEventListener("scroll", updateMobileNav, { passive: true });
    updateMobileNav();
  }

  let visited = false;
  try { visited = sessionStorage.getItem("shida-ansab-opened") === "true"; } catch (_) {}
  const hasDeepLink = window.location.hash && window.location.hash !== "#top";
  if ((visited && !forceWelcome) || hasDeepLink) {
    showInvitation({ animate: false, focus: false });
    if (hasDeepLink) {
      window.requestAnimationFrame(() => document.querySelector(window.location.hash)?.scrollIntoView());
    }
  }
})();
