export type SubmissionLock = { current: boolean };

export async function runSingleSubmission({
  lock,
  submit,
  onStart,
  onSuccess,
  onError,
  onSettled,
}: {
  lock: SubmissionLock;
  submit: () => Promise<unknown>;
  onStart: () => void;
  onSuccess: () => void;
  onError: (cause: unknown) => void;
  onSettled: () => void;
}) {
  if (lock.current) return false;
  lock.current = true;
  onStart();
  try {
    await submit();
    onSuccess();
    return true;
  } catch (cause) {
    onError(cause);
    return false;
  } finally {
    lock.current = false;
    onSettled();
  }
}

/**
 * For irreversible actions: retain the lock after success until the caller's
 * authoritative entity transition resets it. Failures unlock only after the
 * error callback has updated the UI.
 */
export async function runStickyAction({
  lock,
  submit,
  onStart,
  onSuccess,
  onError,
}: {
  lock: SubmissionLock;
  submit: () => Promise<unknown>;
  onStart: () => void;
  onSuccess: () => void;
  onError: (cause: unknown) => void;
}) {
  if (lock.current) return false;
  lock.current = true;
  onStart();
  try {
    await submit();
    onSuccess();
    return true;
  } catch (cause) {
    try {
      onError(cause);
    } finally {
      lock.current = false;
    }
    return false;
  }
}