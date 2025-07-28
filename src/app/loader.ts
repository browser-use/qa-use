import { desc } from 'drizzle-orm'

import { db } from '@/lib/db/db'
import * as schema from '@/lib/db/schema'
import type { TestSuiteDefinition } from '@/lib/testing/engine'
import { BROWSERUSE_DOCS_TEST_SUITE } from '@/lib/testing/mock'

const MOCK_SUITE: TestSuiteDefinition = BROWSERUSE_DOCS_TEST_SUITE

export async function loader() {
  const suites = await db.query.suite.findMany({
    orderBy: [desc(schema.suite.createdAt)],
    with: { tests: { columns: { id: true } } },
  })

  if (suites.length === 0) {
    // Insert the suite
    const suite = await db.transaction(async (tx) => {
      const [s] = await tx.insert(schema.suite).values({ name: MOCK_SUITE.label }).returning()

      if (!s) {
        throw new Error('Failed to insert suite')
      }

      // Insert tests and steps

      const tests = await tx
        .insert(schema.test)
        .values(
          MOCK_SUITE.tests.map((test) => ({
            label: test.label,
            evaluation: test.evaluation,
            suiteId: s.id,
          })),
        )
        .returning({ id: schema.test.id })

      return { ...s, tests }
    })

    return [suite]
  }

  return suites
}

export type TPageData = Awaited<ReturnType<typeof loader>>
