(() => {
  "use strict";

  document.documentElement.classList.add("js");

  const gate = document.getElementById("invitation-gate");
  const openButton = document.getElementById("open-invitation");
  const gateCard = gate?.querySelector(".gate-card");
  const invitation = document.getElementById("invitation");
  const invitationTitle = document.getElementById("invitation-title");
  const audio = document.getElementById("wedding-music");
  const musicToggle = document.getElementById("music-toggle");
  const skipLink = document.querySelector(".skip-link");
  const mainContent = document.getElementById("main-content");
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  let invitationOpened = false;

  function updateMusicState() {
    if (!musicToggle || !audio) return;
    const isOff = audio.paused || audio.muted;
    musicToggle.classList.toggle("is-muted", isOff);
    musicToggle.setAttribute(
      "aria-label",
      isOff ? "Play background music" : "Mute background music"
    );
  }

  function startMusic() {
    if (!audio) return;
    audio.volume = 0.55;
    audio.play().then(updateMusicState).catch(updateMusicState);
  }

  function revealInvitation({ focusHeading = true, playMusic = true, animate = true } = {}) {
    if (invitationOpened || !invitation) return;
    invitationOpened = true;

    const useTransition = animate && !reduceMotion && gate && gateCard;

    invitation.hidden = false;
    invitation.setAttribute("aria-hidden", "false");

    if (musicToggle) musicToggle.hidden = false;

    if (playMusic) startMusic();
    else updateMusicState();

    const finishReveal = () => {
      invitation.classList.add("is-revealed");
      if (gate) gate.hidden = true;
      document.body.classList.remove("is-locked");
      if (focusHeading && invitationTitle) invitationTitle.focus({ preventScroll: true });
    };

    if (!useTransition) {
      invitation.classList.add("is-revealed");
      finishReveal();
      return;
    }

    // Open doors and fade card simultaneously
    gate.setAttribute("aria-hidden", "true");
    gate.classList.add("is-door-opening");
    invitation.classList.add("is-revealed");

    window.setTimeout(finishReveal, 1950);
  }

  openButton?.addEventListener("click", () => revealInvitation());

  skipLink?.addEventListener("click", (event) => {
    if (invitationOpened) return;
    event.preventDefault();
    revealInvitation({ focusHeading: false, playMusic: false, animate: false });
    window.setTimeout(() => {
      mainContent?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      mainContent?.focus({ preventScroll: true });
    }, 0);
  });

  let wasPlayingBeforeHidden = false;

  musicToggle?.addEventListener("click", () => {
    if (!audio) return;
    if (audio.paused || audio.muted) {
      audio.muted = false;
      wasPlayingBeforeHidden = false;
      audio.play().then(updateMusicState).catch(updateMusicState);
    } else {
      audio.pause();
      wasPlayingBeforeHidden = false;
      updateMusicState();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (!audio || !invitationOpened) return;
    if (document.hidden) {
      if (!audio.paused && !audio.muted) {
        wasPlayingBeforeHidden = true;
        audio.pause();
      }
    } else {
      if (wasPlayingBeforeHidden) {
        wasPlayingBeforeHidden = false;
        audio.play().then(updateMusicState).catch(updateMusicState);
      }
    }
  });

  audio?.addEventListener("play", updateMusicState);
  audio?.addEventListener("pause", updateMusicState);

  const revealItems = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealItems.forEach((item) => observer.observe(item));
  }

  const scrollCue = document.querySelector(".scroll-cue");
  if (scrollCue) {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        scrollCue.classList.add("is-scrolled");
      } else {
        scrollCue.classList.remove("is-scrolled");
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
  }

  // Live Countdown Timer to Nikah (10 October 2026, 04:00 PM IST)
  const daysEl = document.getElementById("countdown-days");
  const hoursEl = document.getElementById("countdown-hours");
  const minutesEl = document.getElementById("countdown-minutes");
  const secondsEl = document.getElementById("countdown-seconds");

  if (daysEl && hoursEl && minutesEl && secondsEl) {
    const targetDate = new Date("2026-10-10T16:00:00+05:30").getTime();

    function updateCountdown() {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        daysEl.textContent = "0";
        hoursEl.textContent = "0";
        minutesEl.textContent = "0";
        secondsEl.textContent = "0";
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      daysEl.textContent = days;
      hoursEl.textContent = hours < 10 ? `0${hours}` : hours;
      minutesEl.textContent = minutes < 10 ? `0${minutes}` : minutes;
      secondsEl.textContent = seconds < 10 ? `0${seconds}` : seconds;
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  if (window.location.hash && window.location.hash !== "#top") {
    revealInvitation({ focusHeading: false, playMusic: false, animate: false });
    window.requestAnimationFrame(() => {
      document.querySelector(window.location.hash)?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start"
      });
    });
  }
})();
