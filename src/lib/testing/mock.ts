import type { TestDefinition, TestSuiteDefinition } from '@/lib/testing/engine'
import { createTest } from '@/lib/testing/engine'

export const DOCS_PASSING_SEARCH_TEST: TestDefinition = createTest({
  label: 'Passing BrowserUse Docs Search',
  evaluation: `
Go to docs.browser-use.com
Click on Cloud API V1 documentation.
Select Run Task Documentation.
The page needs to show POST request that lets you run a task using the Cloud API.
`.trim(),
})

/**
 * A test example that fails because the evaluation is not met.
 */
export const DOCS_FAILING_EVAL_SEARCH_TEST: TestDefinition = createTest({
  label: 'Failing Evaluation BrowserUse Docs Search',
  evaluation: `
Go to docs.browser-use.com
Click on Cloud API V1 documentation.
Select Run Task Documentation.
The page needs to show a cooking recipe for "Pasta Carbonara".
`.trim(),
})

/**
 * A test example that fails because the test step cannot be completed.
 */
export const DOCS_FAILING_TEST_SEARCH_TEST: TestDefinition = createTest({
  label: 'Failing Test BrowserUse Docs Search',
  evaluation: `
Go to docs.browser-use.com
Click on Cloud API V2 documentation.
Select "Create AGI Agent" documentation.
The page needs to show detailed guide on how to create an AGI Agent using the Cloud API.
`.trim(),
})

export const BROWSERUSE_DOCS_TEST_SUITE: TestSuiteDefinition = {
  label: 'BrowserUse Docs',
  domain: 'docs.browser-use.com',
  tests: [
    //
    DOCS_PASSING_SEARCH_TEST,
    DOCS_FAILING_EVAL_SEARCH_TEST,
    DOCS_FAILING_TEST_SEARCH_TEST,
  ],
}
