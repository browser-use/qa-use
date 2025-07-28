import * as React from 'react'

import type { TRunStatus } from '@/lib/db/schema'

type SuiteRun = {
  runId: number
  runName: string
  runStatus: TRunStatus
  runStartedAt: Date
  runFinishedAt: Date | null
}

type EmailTemplateProps = {
  suiteId: number
  suiteName: string

  suiteStartedAt: Date
  suiteFinishedAt: Date

  runs: SuiteRun[]
}

/**
 * Email template for sending out a notification when a suite fails.
 */
export function SuiteFailedEmail({ suiteName, suiteStartedAt, suiteFinishedAt, runs }: EmailTemplateProps) {
  return (
    <div>
      <h1>QA Use - Suite {suiteName} failed!</h1>

      <p>Suite started at {suiteStartedAt.toLocaleString()}</p>
      <p>Suite finished at {suiteFinishedAt.toLocaleString()}</p>

      <h2>Runs</h2>

      <ul>
        {runs.map((run) => (
          <li key={run.runId}>
            [{run.runStatus.toUpperCase()}] {run.runName}
          </li>
        ))}
      </ul>
    </div>
  )
}
