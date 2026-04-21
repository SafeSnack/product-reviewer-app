import { useEffect, useState } from 'react';
import { getHelpedProductCount } from '../core/submissions.js';

export function App() {
  const [helped, setHelped] = useState(0);

  useEffect(() => {
    let alive = true;
    const refresh = (): void => {
      void getHelpedProductCount().then((n) => {
        if (alive) {
          setHelped(n);
        }
      });
    };
    refresh();
    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      const listener = (
        changes: Record<string, chrome.storage.StorageChange>,
        area: chrome.storage.AreaName,
      ): void => {
        if (area === 'local' && changes.submissions) {
          refresh();
        }
      };
      chrome.storage.onChanged.addListener(listener);
      return () => {
        alive = false;
        chrome.storage.onChanged.removeListener(listener);
      };
    }
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="p-4 text-sm">
      <div>SafeSnack</div>
      <p className="mt-2 text-xs text-gray-600">Always verify packaging.</p>
      <p className="mt-3 text-sm text-gray-800">
        {`You've helped improve ${helped} product${helped === 1 ? '' : 's'}.`}
      </p>
    </div>
  );
}
