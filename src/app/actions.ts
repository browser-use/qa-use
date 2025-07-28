'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import z from 'zod/v4'

import { db } from '@/lib/db/db'
import * as schema from '@/lib/db/schema'

const zCreateSuite = z.object({
  name: z.string().min(1),
})

export async function createSuiteAction(form: FormData): Promise<void> {
  const { name } = zCreateSuite.parse({
    name: form.get('name'),
  })

  // Create the suite
  const [newSuite] = await db
    .insert(schema.suite)
    .values({
      name,
    })
    .returning()

  revalidatePath('/')
  redirect(`/suite/${newSuite.id}`)
}
