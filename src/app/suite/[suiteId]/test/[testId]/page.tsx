import { notFound } from 'next/navigation'

import { TestDetails } from '@/components/test/TestDetails'

import { deleteTestAction, runTestAction, saveTestAction } from './actions'
import { loader } from './loader'

export const dynamic = 'force-dynamic'

export default async function TestPage({ params }: { params: Promise<{ suiteId: string; testId: string }> }) {
  const { suiteId, testId } = await params
  const suiteIdNum = parseInt(suiteId, 10)
  const testIdNum = parseInt(testId, 10)

  if (isNaN(suiteIdNum) || isNaN(testIdNum)) {
    notFound()
  }

  const test = await loader(testIdNum)

  if (!test) {
    notFound()
  }

  const runTest = runTestAction.bind(null, testIdNum)
  const deleteTest = deleteTestAction.bind(null, testIdNum)
  const saveTest = saveTestAction.bind(null, testIdNum)

  return <TestDetails test={test} runTest={runTest} deleteTest={deleteTest} saveTest={saveTest} />
}
