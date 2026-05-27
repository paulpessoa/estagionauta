import { checkProfileDefinition, runCheckProfile } from './check_profile.js';
import { checkCreditsDefinition, runCheckCredits } from './check_credits.js';
import { calculateRecessDefinition, runCalculateRecess } from './calculate_recess.js';
import { analyzeResumeDefinition, runAnalyzeResume } from './analyze_resume.js';

export const copilotTools = [
  checkProfileDefinition,
  checkCreditsDefinition,
  calculateRecessDefinition,
  analyzeResumeDefinition,
];

export async function executeCopilotTool(
  name: string,
  args: any,
  userId: string
): Promise<any> {
  console.log(`[CopilotToolCalling] Executing tool: ${name} with args:`, args);

  switch (name) {
    case 'check_profile':
      return await runCheckProfile(userId);
    case 'check_credits':
      return await runCheckCredits(userId);
    case 'calculate_recess':
      return await runCalculateRecess({
        startDate: args.startDate,
        endDate: args.endDate,
        salario: Number(args.salario),
      });
    case 'analyze_resume':
      return await runAnalyzeResume(userId, {
        resumeText: args.resumeText,
        jobDescription: args.jobDescription,
      });
    default:
      throw new Error(`Ferramenta desconhecida: ${name}`);
  }
}
