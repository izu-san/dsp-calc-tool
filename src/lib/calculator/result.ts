export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

export function wrapResult<T>(factory: () => T): Result<T> {
  try {
    return ok(factory());
  } catch (error) {
    if (error instanceof Error) {
      return err(error);
    }
    return err(new Error(String(error)));
  }
}

export function unwrapResult<T, E = Error>(result: Result<T, E>): T {
  if (result.ok) {
    return result.value;
  }
  if (result.error instanceof Error) {
    throw result.error;
  }
  throw new Error(String(result.error));
}
