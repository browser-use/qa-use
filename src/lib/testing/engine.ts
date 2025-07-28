import z from 'zod/v4'

export const zResponse = z.object({
  status: z.union([z.literal('pass'), z.literal('failing')]),
  steps: z
    .array(
      z.object({
        id: z.string(),
        description: z.string(),
      }),
    )
    .nullable(),
  error: z.string().nullable(),
})

export type TaskResponse = z.infer<typeof zResponse>

export const RESPONSE_JSON_SCHEMA = z.toJSONSchema(zResponse)

/**
 * Get the task response from the output.
 */
export function getTaskResponse(output: string | null): TaskResponse {
  if (!output) {
    return {
      status: 'failing',
      steps: [],
      error: 'No output was provided!',
    }
  }

  try {
    const parsed = JSON.parse(output)
    const response = zResponse.safeParse(parsed)

    if (!response.success) {
      return {
        status: 'failing',
        steps: [],
        error: `Failed to parse task response: ${response.error.message}`,
      }
    }

    return response.data
  } catch {
    return {
      status: 'failing',
      steps: [],
      error: 'Failed to parse task response',
    }
  }
}

export type TestDefinition = {
  label: string

  /**
   * The success criteria for the final state of the application.
   */
  evaluation: string
}

export type TestSuiteDefinition = {
  label: string

  domain: string

  /**
   * The tests to run.
   */
  tests: TestDefinition[]
}

export const SYSTEM_PROMPT = `
You are a testing agent that validates whether an application works as expected.

You'll be given a task description, steps, and success criteria. You need to

1. Follow the steps in order exactly as they are given.
2. Fill in the missing steps if needed but not deviate from the original steps.
3. Evaluate whether you can perform all steps in the exact order they are given.
4. Evaluate the end state of the application against the success criteria.
5. Only evaluate the end state once all previous steps have successfully been performed.

# Running the Test

- Perform the steps in the exact order they are given.
- Do not search for potential fixes or workarounds.
- Keep explicit track (e.g. in a list) of the steps you have performed in your actions.


# Success and Failure Criteria for Steps

- If you cannot perform a step, the test is failing.
- If you can perform a step, but the next step is not possible, the test is failing.
- If you need to retry a step, the test is failing unless explicitly stated otherwise in the step.
- If you can perform all steps, but the end state does not match exactly the success criteria, the test is failing.

# Success and Failure Criteria for the Evaluation

You need to evaluate whether all requirements for the evaluation are met. Anything beyond the evaluation is not considered.

For example:

- If the screen needs to show a button with explicit text "Search", but the button is not visible, or shows "Find", the test is failing.
- If the screen needs to show at least one result, but no results are visible, the test is failing.
- If the screen needs to show no results and there's one, the test is failing.
- If the screen needs to show at least five results, but only shows four, the test is failing.
- If the screen needs to show a specific error message, but shows a different one, the test is failing.


# Response Format

Return a JSON object with the following format:

\`\`\`json
${JSON.stringify(RESPONSE_JSON_SCHEMA, null, 2)}
\`\`\`

Return \`{ status: "pass", steps: undefined, error: undefined }\` if you can successfully perform the task.

Return \`{ status: "failing", steps: [ { id: <number>, description: "<action that was taken>" } ], error: "<error message>" }\` if you cannot successfully perform the test. The steps array contains exactly the steps that were successfully performed and nothing more. If you cannot perform a step, the error message contains information about why the step failed. If the final state does not match the success criteria, the error message is a detailed short description explaining what is different on the actual application compared to the expected application state and success criteria.

Additionally:

- DO NOT INCLUDE ANY OTHER TEXT IN YOUR RESPONSE.
- CORRECTLY CHOOSE THE ID FOR EACH STEP.
- STEPS NEED TO BE RETURNED IN THE EXACT ORDER THEY WERE GIVEN.
- STRICTLY FOLLOW THE RESPONSE FORMAT DEFINED ABOVE!

# Prompt Format

You'll be given 

1. a high level description of a task you are validating (e.g. "validate that the user can create a new search"), 
2. a list of steps you need to take to get there,
3. a success criteria for the final state of the application (e.g. "the app is on the search results page and is showing results").

The task will be given in the following format:

\`\`\`
<test>
  The task description, steps you need to take to get there, and the success criteria for the final state of the application.
</test>
\`\`\`


# Example Task


\`\`\`
<test>
  Go to the example.com website
  Type in "London" in the search input
  Click the search button
  The app should show a list of results
</test>
\`\`\`

# Example Successful Response

\`\`\`
{ "status": "pass", "steps": null, "error": null }
\`\`\`

# Example Failed Response

\`\`\`
{ "status": "failing", "error": "The search page is not found" }
\`\`\`


`

function stringifyTest(test: TestDefinition) {
  return `
<test>
  ${test.evaluation}
</test>
  `.trim()
}

/**
 * Get the prompt for a test.
 */
export function getTaskPrompt(test: TestDefinition) {
  return `
${SYSTEM_PROMPT}

--- TASK STARTS HERE ---

${stringifyTest(test)}
`
}

/**
 * Lets you create a test definition.
 */
export function createTest({ label, evaluation }: { label: string; evaluation: string }): TestDefinition {
  return {
    label,
    evaluation,
  }
}
