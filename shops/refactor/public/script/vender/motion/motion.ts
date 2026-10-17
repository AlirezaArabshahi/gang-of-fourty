
import { animate, inView } from "motion";

function initScrollAnimation() {
  let hasStarted = false;

  function startAnimation() {
    if (hasStarted) return;
    hasStarted = true;

    inView(".card", (element) => {
      animate(
        element,
        {
          opacity: [0, 1],
          y: [40, 0],
        },
        {
          duration: 0.8,
          ease: "easeOut",
        }
      );
    });
  }

  window.addEventListener("scroll", startAnimation, {
    once: true,
    passive: true,
  });
}

export default initScrollAnimation;
