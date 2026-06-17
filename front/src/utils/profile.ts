import type { UserStats } from '@/api/user'

export function hasCompletedProfile(
  stats?: Pick<UserStats, 'height' | 'weight'> | null,
): boolean {
  return stats != null && stats.height != null && stats.weight != null
}
