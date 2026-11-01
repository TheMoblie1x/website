import { useEffect, useState } from 'react';
import { getSubscription, listPlans, PlanLimits, Subscription } from '../firebase/directory';

/** The company's subscription and the limits of its plan (null while loading or when none is set). */
export function usePlanInfo(companyId: string | undefined): { sub: Subscription | null; limits: PlanLimits | null } {
  const [state, setState] = useState<{ sub: Subscription | null; limits: PlanLimits | null }>({ sub: null, limits: null });
  useEffect(() => {
    if (!companyId) return;
    let cancelled = false;
    Promise.all([getSubscription(companyId), listPlans()])
      .then(([sub, plans]) => {
        if (cancelled) return;
        const plan = sub ? plans.find((p) => p.id === sub.planId) : undefined;
        setState({ sub, limits: plan?.limits ?? null });
      })
      .catch(() => undefined); // limits are a guard rail; if they cannot be read, do not block the user
    return () => {
      cancelled = true;
    };
  }, [companyId]);
  return state;
}
