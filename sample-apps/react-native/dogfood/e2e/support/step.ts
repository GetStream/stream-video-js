import { allure } from 'jest-allure2-reporter/api';

/**
 * A GIVEN / WHEN / THEN step, reported as an Allure step.
 * A failure is reported with the step it happened in.
 */
export const step = (name: string, body: () => PromiseLike<unknown>) =>
  allure.step(name, async () => {
    try {
      await body();
    } catch (error) {
      if (error instanceof Error) {
        error.message = `[${name}] ${error.message}`;
      }
      throw error;
    }
  });

/** Links the running test to its case in the Allure TestOps project (`allure_project_id`). */
export const allureId = (id: number) => allure.label('AS_ID', String(id));
