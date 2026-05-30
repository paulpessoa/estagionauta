import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

export default function ReferralRedirect() {
  const { referralCode } = useParams<{ referralCode: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    if (referralCode) {
      navigate(`/cadastro?ref=${referralCode}`, { replace: true })
    } else {
      navigate('/cadastro', { replace: true })
    }
  }, [referralCode, navigate])

  return null
}
