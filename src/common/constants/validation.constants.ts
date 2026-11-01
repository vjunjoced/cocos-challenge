export const VALIDATION_CODE = {
  NOT_ALLOWED: 'NOT_ALLOWED',
  NOT_TRADABLE: 'NOT_TRADABLE',
} as const;

export const VALIDATION_CODE_BY_CONSTRAINT: Record<string, string> = {
  whitelistValidation: VALIDATION_CODE.NOT_ALLOWED,
};
