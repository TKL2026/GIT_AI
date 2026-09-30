import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { billingApi, type CheckoutInput } from '../api/billing';

const PLANS_QUERY_KEY = ['billing', 'plans'];
const SUBSCRIPTION_QUERY_KEY = ['billing', 'subscription'];
const TRANSACTIONS_QUERY_KEY = ['billing', 'transactions'];

export function usePlans() {
  return useQuery({ queryKey: PLANS_QUERY_KEY, queryFn: billingApi.getPlans });
}

export function useSubscription(enabled = true) {
  return useQuery({ queryKey: SUBSCRIPTION_QUERY_KEY, queryFn: billingApi.getSubscription, enabled });
}

export function useTransactions(enabled = true) {
  return useQuery({ queryKey: TRANSACTIONS_QUERY_KEY, queryFn: billingApi.listTransactions, enabled });
}

/** Interroge le statut d'une transaction toutes les 3s tant qu'elle est
 * PENDING — le webhook CamPay arrive de façon asynchrone, indépendamment de
 * cet écran ; c'est la seule façon de refléter son résultat côté frontend
 * sans infrastructure temps réel (WebSocket/SSE). */
export function useTransactionStatus(externalReference: string | null) {
  return useQuery({
    queryKey: ['billing', 'transaction', externalReference],
    queryFn: () => billingApi.getTransaction(externalReference!),
    enabled: !!externalReference,
    refetchInterval: (query) => (query.state.data?.status === 'PENDING' ? 3000 : false),
  });
}

export function useCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CheckoutInput) => billingApi.checkout(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY });
    },
  });
}

export function invalidateBillingAfterPayment(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEY });
  queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY });
}
