'use client'

import { CheckCircle, Monitor } from 'lucide-react'
import { Fragment, useMemo } from 'react'

import type { TTestRun } from '@/app/suite/[suiteId]/test/[testId]/run/[testRunId]/loader'
import { Polling } from '@/components/Polling'
import { PageHeader } from '@/components/shared/PageHeader'
import { RunStatusBadge } from '@/components/shared/RunStatusBadge'
import { SectionHeader } from '@/components/shared/SectionHeader'
import { formatDate } from '@/components/shared/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { TRunStatus } from '@/lib/db/schema'

export function TestRunDetails({ run }: { run: TTestRun }) {
  const { test, error, status, publicShareUrl, liveUrl } = run

  const actions = useMemo(() => {
    const actions = [{ link: `/suite/${run.test.suiteId}/test/${run.test.id}`, label: 'View Test' }]

    if (publicShareUrl) {
      actions.push({ link: publicShareUrl, label: 'View Agent' })
    }

    return actions
  }, [run.test.suiteId, run.test.id, publicShareUrl])

  const back = useMemo(() => {
    if (run.suiteRunId) {
      return { href: `/suite/${run.test.suiteId}/run/${run.suiteRunId}`, label: 'Back to Suite Run' }
    }

    return { href: `/suite/${run.test.suiteId}/test/${run.test.id}`, label: 'Back to Test' }
  }, [run.suiteRunId, run.test.suiteId, run.test.id])

  return (
    <Fragment>
      {/* Header */}

      <PageHeader title={test.label} subtitle={formatDate(test.createdAt)} back={back} actions={actions} />

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="col-span-1">
          <div>
            <SectionHeader
              title="Evaluation"
              actions={[
                //
                <RunStatusBadge key="test-runs-status-badge" status={run.status} />,
              ]}
            />

            <pre className="w-full whitespace-pre-wrap p-5 bg-gray-50 rounded-md border border-gray-300">
              {test.evaluation}
            </pre>
          </div>

          <div className="mt-5">
            <SectionHeader title="Steps" actions={[]} />

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Step</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>URL</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {run.runSteps.map((step) => (
                  <TableRow key={step.id}>
                    <TableCell>{step.index}</TableCell>
                    <TableCell>{step.description}</TableCell>
                    <TableCell>{step.url}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-5">
            <SectionHeader
              title="Result"
              actions={[<RunStatusBadge key="test-runs-status-badge" status={run.status} />]}
            />

            {run.status === 'passed' && <p className="text-green-700">Test passed</p>}

            {error && <p className="text-red-700">{error}</p>}
          </div>
        </div>

        {/* Preview */}

        <div className="col-span-1 flex flex-col">
          <SectionHeader title="Live Preview" actions={[]} />

          <LivePreview liveUrl={liveUrl} status={status} sharedUrl={publicShareUrl} />
        </div>
      </div>

      <Polling poll={status === 'running' || status === 'pending'} />
    </Fragment>
  )
}

export function LivePreview({
  liveUrl,
  status,
  sharedUrl,
}: {
  liveUrl: string | null | undefined
  status: TRunStatus
  sharedUrl: string | null | undefined
}) {
  return (
    <div
      className="w-full flex flex-col items-center justify-center relative overflow-hidden border border-gray-300 rounded-xs"
      style={{ aspectRatio: '1280/1050', minHeight: '400px' }}
    >
      {status === 'running' && liveUrl ? (
        <iframe src={liveUrl} className="w-full h-full border-0" title="Live test preview" allow="fullscreen" />
      ) : status === 'pending' || status === 'running' ? (
        <TestRunPlaceholder />
      ) : (
        <TestFinishedPlaceholder sharedUrl={sharedUrl} />
      )}
    </div>
  )
}

function TestRunPlaceholder() {
  return (
    <Fragment>
      <Monitor className="w-12 h-12 mb-4 text-gray-300" />
      <div className="text-center">
        <p className="font-medium mb-2">Live preview not available</p>
        <p className="text-sm">Preview will appear when test is running</p>
      </div>
    </Fragment>
  )
}

function TestFinishedPlaceholder({ sharedUrl }: { sharedUrl: string | null | undefined }) {
  return (
    <Fragment>
      <CheckCircle className="w-12 h-12 mb-4 text-gray-300" />
      <div className="text-center">
        <p className="font-medium mb-2">Test completed</p>

        {sharedUrl && (
          <a href={sharedUrl} className="text-blue-500 hover:text-blue-700" target="_blank">
            View Agent Run
          </a>
        )}
      </div>
    </Fragment>
  )
}
