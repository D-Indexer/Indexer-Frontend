import { isFlagEnabled, type FlagName } from '@/config/flags'

/** React accessor for a feature flag (see `src/config/flags.ts`). */
export const useFlag = (name: FlagName): boolean => isFlagEnabled(name)
