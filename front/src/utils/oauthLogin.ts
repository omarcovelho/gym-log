import { getUserStats } from '@/api/user'
import { hasCompletedProfile } from '@/utils/profile'

export async function getPostLoginPath(): Promise<'/app' | '/app/stats'> {
  try {
    const stats = await getUserStats()
    return hasCompletedProfile(stats) ? '/app' : '/app/stats'
  } catch {
    return '/app/stats'
  }
}
