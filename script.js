const navbar = document.querySelector("#navbar");
const topBtn = document.querySelector("#topBtn");
const introVideo = document.querySelector("#introVideo");
const videoScene = document.querySelector(".video-scene");
const videoCaption = document.querySelector(".video-caption");
const soundStart = document.querySelector(".sound-start");
const aboutSection = document.querySelector("#about");
const scrollIndicator = document.querySelector(".scroll-indicator");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let autoScrollFrame = null;
let autoScrolling = false;
let countersStarted = false;

const easeInOutCinematic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const updateChrome = () => {
  const scrolled = window.scrollY > 24;
  navbar.classList.toggle("scrolled", scrolled);
  topBtn.classList.toggle("show", window.scrollY > 600);
};

const stopAutoScroll = () => {
  if (!autoScrolling) return;
  autoScrolling = false;
  cancelAnimationFrame(autoScrollFrame);
};

const cinematicScrollTo = (target, duration = 2600) => {
  if (!target || reducedMotion) {
    target?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
    return;
  }

  const startY = window.scrollY;
  const endY = target.getBoundingClientRect().top + startY;
  const distance = endY - startY;
  const startedAt = performance.now();

  autoScrolling = true;

  const step = (now) => {
    if (!autoScrolling) return;

    const progress = Math.min((now - startedAt) / duration, 1);
    window.scrollTo(0, startY + distance * easeInOutCinematic(progress));

    if (progress < 1) {
      autoScrollFrame = requestAnimationFrame(step);
    } else {
      autoScrolling = false;
    }
  };

  autoScrollFrame = requestAnimationFrame(step);
};

const revealSequence = () => {
  document.querySelectorAll(".reveal-sequence").forEach((item) => {
    const delay = Number(item.dataset.delay || 0);
    window.setTimeout(() => item.classList.add("show"), reducedMotion ? 0 : delay);
  });
};

const restartIntroVideo = () => {
  if (!introVideo) return;

  try {
    introVideo.currentTime = 0;
  } catch {
    introVideo.load();
  }
};

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      entry.target.classList.add("show");

      if (entry.target.classList.contains("stat-box")) {
        startCounters();
      }
    });
  },
  {
    threshold: 0.18,
    rootMargin: "0px 0px -8% 0px",
  }
);

const startCounters = () => {
  if (countersStarted) return;
  countersStarted = true;

  document.querySelectorAll(".counter").forEach((counter) => {
    const target = Number(counter.dataset.target || 0);
    const duration = reducedMotion ? 1 : 1600;
    const startedAt = performance.now();

    const update = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      counter.textContent = Math.round(target * easeInOutCinematic(progress)).toLocaleString("en-IN");

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };

    requestAnimationFrame(update);
  });
};

document.querySelectorAll(".reveal").forEach((item, index) => {
  item.style.transitionDelay = `${Math.min(index % 4, 3) * 120}ms`;
  revealObserver.observe(item);
});

window.addEventListener("scroll", updateChrome, { passive: true });

scrollIndicator.addEventListener("click", () => cinematicScrollTo(aboutSection, 2200));

topBtn.addEventListener("click", () => {
  stopAutoScroll();
  window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
});

document.querySelector(".contact-form").addEventListener("submit", (event) => {
  event.preventDefault();

  const form = event.currentTarget;
  const [name, business, email, message] = Array.from(form.elements)
    .filter((field) => field.matches?.("input, textarea"))
    .map((field) => field.value.trim());
  const status = form.querySelector(".form-status");
  const subject = `Website enquiry from ${name}`;
  const body = [
    "New website enquiry from portfolio:",
    "",
    `Name: ${name}`,
    `Business: ${business}`,
    `Email: ${email}`,
    "",
    "Project details:",
    message,
  ].join("\n");

  window.location.href = `mailto:sanjivani.jadhav.cs@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  status.textContent = "Opening your email app with the enquiry details...";
});

if (introVideo) {
  introVideo.muted = true;
  introVideo.addEventListener("play", revealSequence, { once: true });
  introVideo.addEventListener("loadedmetadata", restartIntroVideo, { once: true });

  restartIntroVideo();
  introVideo.play().then(revealSequence).catch(() => {
    introVideo.controls = true;
    revealSequence();
  });

  const playIntroWithSound = async (event) => {
    event?.stopPropagation();

    introVideo.pause();
    introVideo.removeAttribute("muted");
    introVideo.muted = false;
    introVideo.defaultMuted = false;
    introVideo.volume = 1;
    restartIntroVideo();

    try {
      await introVideo.play();
      videoScene?.classList.add("sound-enabled");
      if (videoCaption) {
        videoCaption.innerHTML = '<span class="live-dot"></span> Audio playing';
      }
    } catch {
      introVideo.controls = true;
      if (videoCaption) {
        videoCaption.innerHTML = '<span class="live-dot"></span> Press play for sound';
      }
    }
  };

  soundStart?.addEventListener("click", playIntroWithSound);
  videoCaption?.addEventListener("click", playIntroWithSound);
} else {
  revealSequence();
}

updateChrome();
