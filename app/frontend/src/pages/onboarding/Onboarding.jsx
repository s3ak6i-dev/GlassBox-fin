import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { orgApi } from '../../api/org.js'
import Step1Org from './Step1Org.jsx'
import Step2Vendors from './Step2Vendors.jsx'
import Step3Agent from './Step3Agent.jsx'
import Step4Ruleset from './Step4Ruleset.jsx'
import Step5FirstTrace from './Step5FirstTrace.jsx'

export default function Onboarding() {
  const { token, refreshOrg } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [data, setData] = useState({
    vendors: [],
    agent: null,         // { id, instrumentation_key, name }
    ruleset: null,
  })

  const patch = (p) => setData(d => ({ ...d, ...p }))
  const next = () => setStep(s => Math.min(s + 1, 4))
  const back = () => setStep(s => Math.max(s - 1, 0))

  async function finish() {
    await orgApi.update(token, { onboarded: true })
    await refreshOrg()
    navigate('/app')
  }

  const common = { data, patch, next, back }

  return (
    <>
      {step === 0 && <Step1Org {...common} />}
      {step === 1 && <Step2Vendors {...common} />}
      {step === 2 && <Step3Agent {...common} />}
      {step === 3 && <Step4Ruleset {...common} />}
      {step === 4 && <Step5FirstTrace {...common} finish={finish} />}
    </>
  )
}
