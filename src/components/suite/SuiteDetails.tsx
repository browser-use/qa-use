'use client'

import { Play, Plus, Trash } from 'lucide-react'
import { Fragment, useCallback, useMemo, useState } from 'react'

import type { TSuite } from '@/app/suite/[suiteId]/loader'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

import { PageHeader } from '../shared/PageHeader'
import { SectionHeader } from '../shared/SectionHeader'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '../ui/select'
import { HistoryTab } from './HistoryTab'
import { TestsTab } from './TestsTab'

const NULL_CADENCE = '__null__'

/**
 * Renders the details of a given suite.
 */
export function SuiteDetails({
  suite,
  runSuite,
  deleteSuite,
  createTest,
  setCronCadence,
  setNotificationsEmailAddress,
}: {
  suite: TSuite
  runSuite: (formData: FormData) => Promise<void>
  deleteSuite: (formData: FormData) => Promise<void>
  createTest: (formData: FormData) => Promise<void>
  setCronCadence: (cadence: 'hourly' | 'daily' | null, formData: FormData) => Promise<void>
  setNotificationsEmailAddress: (formData: FormData) => Promise<void>
}) {
  const [_cadence, _setCadence] = useState<'hourly' | 'daily' | null>(suite.cronCadence)

  const cadence = useMemo(() => {
    if (_cadence == null) {
      return NULL_CADENCE
    }

    return _cadence
  }, [_cadence])

  const setCadence = useCallback((value: string) => {
    switch (value) {
      case NULL_CADENCE:
        _setCadence(null)
        break
      case 'hourly':
        _setCadence('hourly')
        break
      case 'daily':
        _setCadence('daily')
        break
      default:
        throw new Error(`Invalid cadence: ${value}`)
    }
  }, [])

  const handleChangeCadence = useMemo(() => setCronCadence.bind(null, _cadence), [_cadence, setCronCadence])

  return (
    <Fragment>
      <PageHeader title={suite.name} back={{ href: '/', label: 'All Suites' }} />

      {/* Body with Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
        <div className="col-span-1">
          <SectionHeader
            title="Tests"
            actions={[<CreateTestDialog key="create-test-dialog" suiteId={suite.id} createTest={createTest} />]}
          />

          <TestsTab suite={suite} suiteId={suite.id} />
        </div>

        <div className="col-span-1">
          <SectionHeader
            title="History"
            actions={[
              <form key="run-suite-form" action={runSuite}>
                <Button type="submit" variant="outline">
                  <Play className="w-4 h-4" />
                  Run Suite
                </Button>
              </form>,
            ]}
          />
          <HistoryTab suite={suite} />
        </div>
      </div>

      <div className="mt-9" />

      <SectionHeader
        title="Settings"
        actions={[
          <form key="delete-suite-form" action={deleteSuite}>
            <Button type="submit" variant="destructive">
              <Trash /> Delete Suite
            </Button>
          </form>,
        ]}
      />

      <div className="mt-3">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Cron</h3>

        <div className="flex flex-col  gap-2">
          <p className="text-sm text-gray-500">Run this suite on a cron schedule.</p>

          <div className="flex items-center gap-2">
            <Select value={cadence} onValueChange={setCadence}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Cadence" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Disabled</SelectLabel>
                  <SelectItem value={NULL_CADENCE}>Disabled</SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Enabled</SelectLabel>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <form action={handleChangeCadence}>
              <Button type="submit">Save</Button>
            </form>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Notifications</h3>

        <div className="flex flex-col  gap-2">
          <p className="text-sm text-gray-500">Send notifications to this email address.</p>

          <form action={setNotificationsEmailAddress} className="flex items-center gap-2">
            <Input
              type="email"
              name="email"
              placeholder="Email address"
              defaultValue={suite.notificationsEmailAddress ?? ''}
            />

            <Button type="submit">Save</Button>
          </form>
        </div>
      </div>
    </Fragment>
  )
}

function CreateTestDialog({ createTest }: { suiteId: number; createTest: (formData: FormData) => Promise<void> }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="ml-auto" variant="outline">
          <Plus className="w-4 h-4" />
          Create Test
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Test</DialogTitle>
          <DialogDescription>
            Add a new test to this suite. Provide a name and description of what should be tested.
          </DialogDescription>
        </DialogHeader>

        <form action={createTest} className="space-y-4">
          <div>
            <label htmlFor="label" className="block text-sm font-medium text-gray-700 mb-1">
              Test Name
            </label>
            <Input id="label" name="label" type="text" placeholder="e.g., Login functionality test" required />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="submit">Create Test</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
