// Customer-facing text for depositPayment.failureReason (BK-31).
const FAILURE_MESSAGES: Record<string, string> = {
  cancelled: 'You dismissed the M-Pesa prompt.',
  insufficient_funds: "Your M-Pesa balance wasn't enough for the deposit.",
  wrong_pin: 'The M-Pesa PIN entered was incorrect.',
  timeout: 'The M-Pesa prompt timed out before a PIN was entered.',
  busy: 'Another M-Pesa transaction was in progress. Wait a moment and try again.',
  provider_error: "M-Pesa couldn't complete the payment.",
  failed: "The payment didn't go through.",
};

export function depositFailureMessage(reason: string | null | undefined): string {
  return (reason && FAILURE_MESSAGES[reason]) || FAILURE_MESSAGES.failed;
}
