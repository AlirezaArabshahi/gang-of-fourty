
// import { animate, inView } from "motion";

// function initScrollAnimation() {
//   let hasStarted = false;

//   function startAnimation() {
//     if (hasStarted) return;
//     hasStarted = true;

//     inView(".card", (element) => {
//       animate(
//         element,
//         {
//           opacity: [0, 1],
//           y: [40, 0],
//         },
//         {
//           duration: 0.8,
//           ease: "easeOut",
//         }
//       );
//     });
//   }

//   window.addEventListener("scroll", startAnimation, {
//     once: true,
//     passive: true,
//   });
// }

// export default initScrollAnimation;

import { animate, inView } from 'motion';
 
// فقط یک‌بار صدا زده می‌شود. انیمیشن بعد از اولین اسکرول شروع می‌شود.
const initScrollAnimation = (): void => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 
    if (!reduceMotion) {
        window.addEventListener(
            'scroll',
            () => {
                inView('.card', (element: Element) => {
                    animate(
                        element,
                        { opacity: [0, 1], y: [40, 0] },
                        { duration: 0.8, ease: 'easeOut' }
                    );
                });
            },
            { once: true, passive: true }
        );
    }
};
 
export default initScrollAnimation;