'use server'

import { desc, eq } from 'drizzle-orm'

import { db } from '@/lib/db/db'
import * as schema from '@/lib/db/schema'

export async function loader(suiteId: number) {
  const suite = await db.query.suite.findFirst({
    where: eq(schema.suite.id, suiteId),
    with: {
      tests: {
        orderBy: [schema.test.createdAt],
      },
      runs: {
        with: {
          testRuns: {
            with: {
              test: true,
            },
          },
        },
        orderBy: [desc(schema.suiteRun.createdAt)],
      },
    },
  })

  if (!suite) {
    return null
  }

  return suite
}

export type TSuite = NonNullable<Awaited<ReturnType<typeof loader>>>
