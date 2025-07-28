import { Plus } from 'lucide-react'
import Link from 'next/link'
import { Fragment } from 'react'

import { PageHeader } from '@/components/shared/PageHeader'
import { SectionHeader } from '@/components/shared/SectionHeader'
import { formatDate } from '@/components/shared/utils'
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import { createSuiteAction } from './actions'
import { loader } from './loader'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const suites = await loader()

  return (
    <Fragment>
      <PageHeader
        title="All Suites"
        subtitle="QA Use"
        actions={[{ link: 'https://github.com/browser-use/qa-use', label: 'Star on GitHub' }]}
      />
      {/* Header */}

      {/* Suites List */}

      <SectionHeader title="Test Suites" actions={[<CreateSuiteDialog key="create-suite-dialog" />]} />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Tests</TableHead>
            <TableHead>CRON</TableHead>
            <TableHead>Last Run</TableHead>
            <TableHead>{/* Actions */}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suites.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="">
                No suites found...
              </TableCell>
            </TableRow>
          )}
          {suites.map((suite) => (
            <TableRow key={suite.id}>
              <TableCell className="font-medium">{suite.name}</TableCell>
              <TableCell>{formatDate(suite.createdAt)}</TableCell>
              <TableCell>{suite.tests.length}</TableCell>
              <TableCell>{getCronCadenceLabel(suite.cronCadence)}</TableCell>
              <TableCell>{suite.lastCronRunAt ? formatDate(suite.lastCronRunAt) : 'Never'}</TableCell>
              <TableCell className="text-right">
                <Link href={`/suite/${suite.id}`}>View</Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Fragment>
  )
}

function CreateSuiteDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="ml-auto">
          <Plus className="w-4 h-4" />
          Create Suite
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new test suite</DialogTitle>
          <DialogDescription>A test suite is a collection of tests that you can run together.</DialogDescription>

          <form action={createSuiteAction} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Suite Name
              </label>
              <Input id="name" name="name" type="text" placeholder="e.g., Login functionality test" required />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="submit">Create</Button>
            </div>
          </form>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}

function getCronCadenceLabel(cadence: 'hourly' | 'daily' | null) {
  if (cadence === 'hourly') {
    return 'Hourly'
  }

  if (cadence === 'daily') {
    return 'Daily'
  }

  return 'None'
}
