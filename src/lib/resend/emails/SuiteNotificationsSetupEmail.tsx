import * as React from 'react'

type SuiteNotificationsSetupEmailProps = {
  suiteId: number
  suiteName: string
  suiteNotificationsEmailAddress: string | null
}

/**
 * Email template for sending out a notification when a suite fails.
 */
export function SuiteNotificationsSetupEmail({
  suiteName,
  suiteNotificationsEmailAddress,
}: SuiteNotificationsSetupEmailProps) {
  return (
    <div>
      <h1>Suite Notifications Setup - {suiteName}</h1>

      <p>QA Use will send you an email if the suite fails to {suiteNotificationsEmailAddress}!</p>
    </div>
  )
}
