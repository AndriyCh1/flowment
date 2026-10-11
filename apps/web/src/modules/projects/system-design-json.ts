import { SystemDesignSchema, type SystemDesign } from '@flowment/domain';

export type SystemDesignParseResult =
  | { success: true; design: SystemDesign }
  | { success: false; errors: string[] };

export function formatSystemDesign(design: SystemDesign): string {
  return JSON.stringify(design, null, 2);
}

export function parseSystemDesign(text: string): SystemDesignParseResult {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { success: false, errors: [`Invalid JSON: ${reason}`] };
  }

  const result = SystemDesignSchema.safeParse(value);
  if (result.success) {
    return { success: true, design: result.data };
  }
  return {
    success: false,
    errors: result.error.issues.map((issue) =>
      issue.path.length > 0
        ? `${issue.path.join('.')}: ${issue.message}`
        : issue.message,
    ),
  };
}
