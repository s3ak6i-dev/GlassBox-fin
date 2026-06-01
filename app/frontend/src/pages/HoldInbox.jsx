import PageStub from '../components/ui/PageStub.jsx'

export default function HoldInbox() {
  return (
    <PageStub
      title="Hold Inbox"
      sub="Agent executions paused awaiting human approval"
      icon="⏸"
      note="Real-time approve/deny flow lands in Session 6. When an agent hits a CRITICAL guardrail with pause policy, the hold appears here and the agent waits for your decision."
    />
  )
}
