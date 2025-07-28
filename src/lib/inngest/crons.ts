import { eq, isNotNull } from 'drizzle-orm'
import { DateTime } from 'luxon'

import { db } from '@/lib/db/db'
import * as schema from '@/lib/db/schema'

import { ExhaustiveSwitchCheck } from '../types'
import { inngest } from './client'

export const testCron = inngest.createFunction(
  {
    id: 'test/cron',
    name: 'test/cron',
  },
  {
    // NOTE: Every 5 minutes
    cron: '*/5 * * * *',
  },

  async ({ step }) => {
    const suites = await db.query.suite.findMany({
      where: isNotNull(schema.suite.cronCadence),
      with: {
        tests: true,
      },
    })

    for (const suite of suites) {
      if (suite.cronCadence == null) {
        // NOTE: This should never happen because of the filter above, but we'll handle it just in case.
        continue
      }

      const now = DateTime.now()
      const lastCronRunAt = suite.lastCronRunAt

      if (lastCronRunAt != null) {
        const lastCronRunAtDate = DateTime.fromJSDate(lastCronRunAt)
        const cadence = suite.cronCadence

        let nextRunAt: DateTime
        switch (cadence) {
          case 'hourly':
            nextRunAt = lastCronRunAtDate.plus({ hours: 1 })
            break
          case 'daily':
            nextRunAt = lastCronRunAtDate.plus({ days: 1 })
            break
          default:
            throw new ExhaustiveSwitchCheck(cadence)
        }

        if (nextRunAt > now) {
          continue
        }
      }

      if (lastCronRunAt == null) {
        const suiteRunId = await db.transaction(async (tx) => {
          const [newSuiteRun] = await tx
            .insert(schema.suiteRun)
            .values({
              suiteId: suite.id,
              status: 'pending',
            })
            .returning()

          for (const test of suite.tests) {
            await tx
              .insert(schema.testRun)
              .values({
                testId: test.id,
                suiteRunId: newSuiteRun.id,
                status: 'pending',
              })
              .returning()
          }

          await tx.update(schema.suite).set({ lastCronRunAt: new Date() }).where(eq(schema.suite.id, suite.id))

          return newSuiteRun.id
        })

        await step.sendEvent(`start-test-suite-run:${suite.id}`, {
          name: 'test-suite/run',
          data: { suiteRunId },
        })
      }
    }
  },
)
