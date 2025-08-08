'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect, RedirectType } from 'next/navigation'
import { z } from 'zod/v4'

import { db } from '@/lib/db/db'
import * as schema from '@/lib/db/schema'
import { inngest } from '@/lib/inngest/client'
import { resend } from '@/lib/resend/client'
import { SuiteNotificationsSetupEmail } from '@/lib/resend/emails/SuiteNotificationsSetupEmail'

export async function runSuiteAction(suiteId: number, _: FormData) {
  // NOTE: First we create a new suite run and all related test runs.

  const suiteRunId = await db.transaction(async (tx) => {
    const suite = await db.query.suite.findFirst({
      where: eq(schema.suite.id, suiteId),
      with: {
        tests: {
          with: {
            steps: true,
          },
        },
      },
    })

    if (!suite) {
      throw new Error(`Suite not found: ${suiteId}`)
    }

    const [newSuiteRun] = await tx
      .insert(schema.suiteRun)
      .values({
        suiteId: suite.id,
        status: 'pending',
      })
      .returning()

    for (const test of suite.tests) {
      // NOTE: We skip test runs with no steps because they won't do anything.
      if (test.steps.length === 0) {
        continue
      }

      const [newTestRun] = await tx
        .insert(schema.testRun)
        .values({
          testId: test.id,
          suiteRunId: newSuiteRun.id,
          status: 'pending',
        })
        .returning()

      for (const step of test.steps) {
        await tx.insert(schema.testRunStep).values({
          testRunId: newTestRun.id,
          stepId: step.id,
          status: 'pending',
        })
      }
    }

    return newSuiteRun.id
  })

  try {
    await inngest.send({
      name: 'test-suite/run',
      data: {
        suiteRunId,
      },
    })

    revalidatePath(`/suite/${suiteId}`)
  } catch (error) {
    console.error('Failed to trigger suite run:', error)
  }

  redirect(`/suite/${suiteId}/run/${suiteRunId}`, RedirectType.push)
}

const zCreateTest = z.object({
  label: z.string().min(1),
  suiteId: z.number(),
})

export async function createTestAction(suiteId: number, formData: FormData) {
  const data = zCreateTest.parse({
    label: formData.get('label') as string,
    task: formData.get('task') as string,
    suiteId,
  })

  const [newTest] = await db
    .insert(schema.test)
    .values({
      label: data.label,
      evaluation: '',
      suiteId: data.suiteId,
    })
    .returning()

  revalidatePath(`/suite/${suiteId}`)
  redirect(`/suite/${suiteId}/test/${newTest.id}/edit`, RedirectType.push)
}

export async function deleteSuiteAction(suiteId: number) {
  await db.delete(schema.suite).where(eq(schema.suite.id, suiteId))

  revalidatePath('/')
  redirect('/', RedirectType.push)
}

const zSetCronCadence = z.object({
  cadence: z.enum(['hourly', 'daily']).nullable(),
  suiteId: z.number(),
})

/**
 * Sets the cron cadence for a suite.
 */
export async function setCronCadenceAction(suiteId: number, cadence: 'hourly' | 'daily' | null, _: FormData) {
  const data = zSetCronCadence.parse({
    cadence,
    suiteId,
  })

  await db
    .update(schema.suite)
    .set({
      cronCadence: data.cadence,
    })
    .where(eq(schema.suite.id, data.suiteId))

  revalidatePath(`/suite/${data.suiteId}`)
  redirect(`/suite/${data.suiteId}`, RedirectType.push)
}

const zSetNotificationsEmailAddress = z.object({
  email: z.email(),
  suiteId: z.number(),
})

/**
 * Sets the notifications email address for a suite.
 */
export async function setNotificationsEmailAddressAction(suiteId: number, formData: FormData) {
  const data = zSetNotificationsEmailAddress.parse({
    email: formData.get('email') as string,
    suiteId,
  })

  const fromEmail = process.env.RESEND_FROM_EMAIL
  if (resend == null || !fromEmail) {
    throw new Error('Resend is not configured!')
  }

  const dbSuite = await db.query.suite.findFirst({
    where: eq(schema.suite.id, data.suiteId),
  })

  if (!dbSuite) {
    throw new Error(`Suite not found: ${data.suiteId}`)
  }

  const res = await resend.emails.send({
    from: fromEmail,
    to: data.email,
    subject: `Suite Notifications Setup - ${data.suiteId}`,
    react: (
      <SuiteNotificationsSetupEmail
        suiteId={data.suiteId}
        suiteName={dbSuite.name}
        suiteNotificationsEmailAddress={dbSuite.notificationsEmailAddress}
      />
    ),
  })

  if (res.error) {
    console.error(res)
    throw new Error(`Failed to send email: ${JSON.stringify(res.error)}`)
  }

  await db
    .update(schema.suite)
    .set({
      notificationsEmailAddress: data.email,
    })
    .where(eq(schema.suite.id, data.suiteId))

  revalidatePath(`/suite/${data.suiteId}`)
  redirect(`/suite/${data.suiteId}`, RedirectType.push)
}

export async function duplicateTestAction(suiteId: number, testId: number, _form: FormData) {
  const test = await db.query.test.findFirst({
    where: eq(schema.test.id, testId),
    with: {
      steps: true,
    },
  })

  if (!test) {
    throw new Error(`Test not found: ${testId}`)
  }

  const _ = await db.transaction(async (tx) => {
    const [newTest] = await tx
      .insert(schema.test)
      .values({
        label: `${test.label} (Copy)`,
        evaluation: test.evaluation,
        suiteId: suiteId,
      })
      .returning()

    await tx.insert(schema.testStep).values(
      test.steps.map((step) => ({
        testId: newTest.id,
        description: step.description,
        order: step.order,
      })),
    )

    return newTest
  })

  revalidatePath(`/suite/${suiteId}`)
}
