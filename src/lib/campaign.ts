import { useEffect } from 'react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/apiClient'

// Campaign links like https://estagionauta.com.br/?cupom=UFPE30&utm_source=ufpe
// keep the coupon until the visitor logs in, then redeem it automatically.
const STORAGE_KEY = 'estagionauta_campaign'

interface Campaign {
  coupon?: string
  source?: string
}

function readCampaign(): Campaign {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function writeCampaign(campaign: Campaign) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(campaign))
  } catch {
    // Storage unavailable (private mode): campaign tracking is best-effort
  }
}

/** Funnel event in Microsoft Clarity (no-op until the user accepts analytics cookies). */
export function trackEvent(name: string) {
  window.clarity?.('event', name)
}

/** Reads ?cupom= / ?utm_source= from the URL once per page load. */
export function captureCampaign() {
  const params = new URLSearchParams(window.location.search)
  const coupon = params.get('cupom')?.trim().toUpperCase()
  const source = params.get('utm_source')?.trim().toLowerCase() || coupon?.toLowerCase()
  if (!coupon && !source) return

  writeCampaign({ ...readCampaign(), ...(coupon && { coupon }), ...(source && { source }) })
}

/** Tags the Clarity session with the channel and redeems a pending coupon after login. */
export function useCampaign(userId: string | undefined) {
  useEffect(() => {
    const { coupon, source } = readCampaign()
    if (source) window.clarity?.('set', 'canal', source)
    if (!userId || !coupon) return

    writeCampaign({ source })
    apiClient
      .post<{ success: boolean; message?: string }>('/api/credits/redeem', { code: coupon })
      .then((result) => {
        trackEvent('cupom_resgatado')
        toast.success(result.message || `Cupom ${coupon} resgatado!`)
      })
      .catch(() => {
        // Already redeemed, expired or invalid: nothing for the user to do
      })
  }, [userId])
}
