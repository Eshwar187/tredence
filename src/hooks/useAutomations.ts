import { useEffect, useState } from 'react';
import { getAutomations } from '../api/mockApi';
import type { AutomationAction } from '../types/workflow';

export function useAutomations() {
  const [actions, setActions] = useState<AutomationAction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadAutomations() {
      setIsLoading(true);
      try {
        const result = await getAutomations();
        if (isMounted) {
          setActions(result);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadAutomations();

    return () => {
      isMounted = false;
    };
  }, []);

  return { actions, isLoading };
}
