import { Data } from "effect";

export class NotFoundError extends Data.TaggedError("NotFoundError")<{
  readonly resource: string;
  readonly id: string;
}> {}

export class ForbiddenError extends Data.TaggedError("ForbiddenError")<{
  readonly reason: string;
}> {}

export class TenantMismatchError extends Data.TaggedError("TenantMismatchError")<{
  readonly expected: string;
  readonly actual: string;
}> {}

export class DuplicateConnectionError extends Data.TaggedError("DuplicateConnectionError")<{
  readonly organizationId: string;
  readonly sourceAppId: string;
  readonly targetAppId: string;
}> {}

export class DuplicateInstallationRequestError extends Data.TaggedError(
  "DuplicateInstallationRequestError",
)<{
  readonly organizationId: string;
  readonly sourceAppId: string;
  readonly targetAppId: string;
}> {}

export class InvalidStateError extends Data.TaggedError("InvalidStateError")<{
  readonly resource: string;
  readonly currentStatus: string;
  readonly requiredStatus: string;
}> {}

export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  readonly message: string;
  readonly cause: unknown;
}> {}
