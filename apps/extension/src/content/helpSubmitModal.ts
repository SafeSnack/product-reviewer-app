import type { DetectionResult } from '@safesnack/shared-types';
import { queueSubmission } from '../core/submissions.js';
import { sendMessage } from '../core/messaging.js';
import type { LookupResponse } from '../core/messaging.js';

const OVERLAY_ATTR = 'data-safesnack-help-overlay';

/** True when automated check is Unknown-shaped (user may paste better ingredient text). */
export function shouldOfferIngredientHelp(r: DetectionResult): boolean {
  if (!r.ingredientsFound) {
    return true;
  }
  if (r.confidence < 0.5) {
    return true;
  }
  return false;
}

/**
 * Opens a lightweight modal (Shadow DOM) to paste ingredients and queue a local submission.
 * @returns disposer — removes overlay if still mounted.
 */
export function openHelpSubmitModal(opts: {
  productKey: string;
  productName: string;
  onAfterQueue: (detection: DetectionResult) => void | Promise<void>;
}): () => void {
  const existing = document.querySelector(`[${OVERLAY_ATTR}]`);
  existing?.remove();

  const overlay = document.createElement('div');
  overlay.setAttribute(OVERLAY_ATTR, 'true');
  overlay.style.cssText = [
    'position:fixed',
    'inset:0',
    'z-index:2147483647',
    'background:rgba(15,23,42,0.45)',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'padding:16px',
    'box-sizing:border-box',
  ].join(';');

  const host = document.createElement('div');
  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
    .panel {
      width: min(420px, 100%);
      max-height: min(90vh, 560px);
      overflow: auto;
      background: #fff;
      color: #111827;
      border-radius: 10px;
      padding: 16px;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.45;
      box-shadow: 0 20px 50px rgba(0,0,0,0.25);
    }
    h2 { margin: 0 0 10px 0; font-size: 16px; }
    label { display: block; margin: 10px 0 4px 0; font-weight: 600; }
    .name { margin: 0 0 8px 0; color: #374151; word-break: break-word; }
    textarea {
      width: 100%;
      min-height: 120px;
      box-sizing: border-box;
      padding: 8px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font: inherit;
      resize: vertical;
    }
    .actions { margin-top: 14px; display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; }
    button {
      font: inherit;
      padding: 8px 14px;
      border-radius: 6px;
      cursor: pointer;
      border: 1px solid #d1d5db;
      background: #f9fafb;
    }
    button.primary {
      background: #2563eb;
      color: #fff;
      border-color: #1d4ed8;
    }
    button:disabled { opacity: 0.55; cursor: not-allowed; }
    .err { color: #b91c1c; margin-top: 8px; font-size: 13px; }
    .hint { font-size: 12px; color: #6b7280; margin-top: 6px; }
  `;

  const panel = document.createElement('div');
  panel.className = 'panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-labelledby', 'safesnack-help-title');

  const h = document.createElement('h2');
  h.id = 'safesnack-help-title';
  h.appendChild(document.createTextNode('Help us — ingredients'));

  const nameP = document.createElement('p');
  nameP.className = 'name';
  nameP.appendChild(document.createTextNode(opts.productName));

  const lab = document.createElement('label');
  lab.setAttribute('for', 'safesnack-help-ing');
  lab.appendChild(document.createTextNode('Ingredient list'));

  const ta = document.createElement('textarea');
  ta.id = 'safesnack-help-ing';
  ta.setAttribute('aria-label', 'Ingredient list to paste');
  ta.setAttribute('autocomplete', 'off');

  const hint = document.createElement('p');
  hint.className = 'hint';
  hint.appendChild(
    document.createTextNode(
      'Paste text from packaging. Always verify packaging — submissions are local only in MVP.',
    ),
  );

  const err = document.createElement('p');
  err.className = 'err';
  err.style.display = 'none';

  const actions = document.createElement('div');
  actions.className = 'actions';

  const btnCancel = document.createElement('button');
  btnCancel.type = 'button';
  btnCancel.appendChild(document.createTextNode('Cancel'));

  const btnOk = document.createElement('button');
  btnOk.type = 'button';
  btnOk.className = 'primary';
  btnOk.appendChild(document.createTextNode('Submit'));
  btnOk.disabled = true;

  const close = (): void => {
    if (overlay.isConnected) {
      overlay.remove();
    }
  };

  const syncOk = (): void => {
    btnOk.disabled = ta.value.trim().length < 3;
  };
  ta.addEventListener('input', syncOk);

  btnCancel.addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      close();
    }
  });

  btnOk.addEventListener('click', () => {
    void (async () => {
      const text = ta.value.trim();
      if (text.length < 3) {
        return;
      }
      btnOk.disabled = true;
      err.style.display = 'none';
      try {
        await queueSubmission({
          productKey: opts.productKey,
          productName: opts.productName,
          ingredientsText: text,
        });
        const res = await sendMessage<LookupResponse>({
          type: 'LOOKUP_PRODUCT',
          productKey: opts.productKey,
          productName: opts.productName,
          ingredientsFromDom: text,
        });
        if (res.type !== 'LOOKUP_RESULT' || !res.result) {
          err.textContent = 'Could not refresh detection. Try again.';
          err.style.display = 'block';
          btnOk.disabled = false;
          return;
        }
        await opts.onAfterQueue(res.result);
        close();
      } catch {
        err.textContent = 'Submit failed. Check extension permissions and try again.';
        err.style.display = 'block';
        btnOk.disabled = false;
      }
    })();
  });

  actions.appendChild(btnCancel);
  actions.appendChild(btnOk);

  panel.appendChild(h);
  panel.appendChild(nameP);
  panel.appendChild(lab);
  panel.appendChild(ta);
  panel.appendChild(hint);
  panel.appendChild(err);
  panel.appendChild(actions);

  shadow.appendChild(style);
  shadow.appendChild(panel);
  overlay.appendChild(host);
  document.body.appendChild(overlay);

  globalThis.requestAnimationFrame(() => {
    ta.focus();
  });

  const onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      close();
      document.removeEventListener('keydown', onKey);
    }
  };
  document.addEventListener('keydown', onKey);

  return () => {
    document.removeEventListener('keydown', onKey);
    close();
  };
}
