
import { el } from '../utils/utils.js';

// const showError = (
//   track: HTMLElement,
//   msg: string
// ): void => {
//   track.textContent = '';

//   const errorItem = el('li', 'error-msg', msg);
//   errorItem.setAttribute('role', 'alert');

//   track.append(errorItem);
// };

// const makeSkeleton = (): HTMLLIElement => {
//   const li = el('li', 'card skeleton');
//   li.setAttribute('aria-hidden', 'true');

//   const top = el('div', 'card-top');
//   const media = el('div', 'sk-media');
//   const body = el('div', 'card-body');
//   const line1 = el('div', 'sk-line');
//   const line2 = el('div', 'sk-line sk-line--short');

//   body.append(line1, line2);
//   li.append(top, media, body);

//   return li;
// };

// const renderSkeletons = (container:HTMLElement, count:number = 4):void =>
//     container.append(
//         ...Array.from({ length: count }, () => makeSkeleton())
//         setBusy(container, true);
//     );


// const setBusy = (container: HTMLElement, busy: boolean): void => {
//     container.setAttribute('aria-busy', String(busy));
// };

// export { showError, renderSkeletons,setBusy };

type MessageRole = 'status' | 'alert';

// کاروسل‌ها داخل HTML دو نشانهٔ ثابت دارند (li.track-edge با data-edge="start" و "end")
// که هدف لینک‌های #…-start و #…-end هستند. محتوای JavaScript همیشه «بین» این دو می‌نشیند.
const isEdge = (node: Element): boolean => node.classList.contains('track-edge');

const setBusy = (container: HTMLElement, busy: boolean): void => {
    container.setAttribute('aria-busy', String(busy));
};

const fillContainer = (container: HTMLElement, nodes: Node[]): void => {
    Array.from(container.children)
        .filter((child) => !isEdge(child))
        .forEach((child) => child.remove());

    const end = container.querySelector<HTMLElement>(':scope > [data-edge="end"]');

    if (end) {
        end.before(...nodes);
    } else {
        container.append(...nodes);
    }
};

// قبلاً showError بود ولی برای پیام «در حال بارگیری» هم استفاده می‌شد
const showError = (
    container: HTMLElement,
    msg: string,
    role: MessageRole = 'status'
): void => {
    const item = el(container.matches('ul, ol') ? 'li' : 'p', 'error-msg', msg);
    item.setAttribute('role', role);

    fillContainer(container, [item]);
    setBusy(container, false);
};

const showLoading = (container: HTMLElement): void => {
    showError(container, 'در حال بارگیری ...');
    setBusy(container, true);
};

const makeSkeleton = (): HTMLLIElement => {
    const li = el('li', 'card skeleton');
    li.setAttribute('aria-hidden', 'true');

    const top = el('div', 'card-top');
    const media = el('div', 'sk-media');
    const body = el('div', 'card-body');
    const line1 = el('div', 'sk-line');
    const line2 = el('div', 'sk-line sk-line--short');

    body.append(line1, line2);
    li.append(top, media, body);

    return li;
};

// اسکلتون‌ها تا رسیدن داده دیده می‌شوند (قبلاً هیچ‌وقت صدا زده نمی‌شد یا فوراً پاک می‌شد)
const renderSkeletons = (container: HTMLElement, count: number = 4): void => {
    fillContainer(container, Array.from({ length: count }, makeSkeleton));
    setBusy(container, true);
};

export { showError, showLoading, renderSkeletons, fillContainer, setBusy };
