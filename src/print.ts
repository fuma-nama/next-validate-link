import picocolors from 'picocolors';
import type { ValidateResult } from '@/validate';

/**
 * Print validation errors
 */
export function printErrors(results: ValidateResult[], throwError = false) {
  let totalErrors = 0;
  const logs: string[] = [];

  for (const result of results) {
    logs.push(
      picocolors.bold(picocolors.redBright(`Invalid URLs in ${result.file}:`)),
    );

    for (const error of result.errors) {
      const message =
        error.reason instanceof Error ? error.reason.message : error.reason;

      logs.push(
        `${picocolors.bold(error.url)}: ${message} at line ${error.line} column ${error.column}`,
      );
    }

    logs.push(picocolors.dim('------'));

    totalErrors += result.errors.length;
  }

  const summary = `${results.length} errored file, ${totalErrors} errors`;
  logs.push(
    picocolors.bold(
      totalErrors > 0
        ? picocolors.redBright(summary)
        : picocolors.greenBright(summary),
    ),
  );

  if (throwError && totalErrors > 0) {
    console.error(logs.join('\n'));
    process.exit(1);
  } else {
    console.log(logs.join('\n'));
  }
}
