/**
 * Shared application constants. Extend this module for feature flags and environment-specific values.
 */

export const systemMessageAuthor = "Philosophical Zombie";

export const TaskStatusTypes = {
  PENDING: "PENDING",
  CHAINED: "CHAINED",
} as const;

export type TaskStatusType =
  (typeof TaskStatusTypes)[keyof typeof TaskStatusTypes];
