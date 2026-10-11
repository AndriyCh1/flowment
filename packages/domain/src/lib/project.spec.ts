import { ProjectNameSchema } from './project.js';

describe('ProjectNameSchema', () => {
  it('trims the name', () => {
    expect(ProjectNameSchema.parse('  CSV import ')).toBe('CSV import');
  });

  it.each(['', '   '])('rejects blank name %j', (name) => {
    const result = ProjectNameSchema.safeParse(name);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('Enter a project name');
  });
});
