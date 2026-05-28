import { checkProfileDefinition, runCheckProfile } from './check_profile.js';
import { checkCreditsDefinition, runCheckCredits } from './check_credits.js';
import { calculateRecessDefinition, runCalculateRecess } from './calculate_recess.js';
import { analyzeResumeDefinition, runAnalyzeResume } from './analyze_resume.js';
import { updateProfileDefinition, runUpdateProfile } from './update_profile.js';
import { checkCandidaturesDefinition, runCheckCandidatures } from './check_candidatures.js';
import { saveResumeDefinition, runSaveResume } from './save_resume.js';
import { addCandidaturaDefinition, runAddCandidatura } from './add_candidatura.js';

export const roverTools = [
  checkProfileDefinition,
  checkCreditsDefinition,
  calculateRecessDefinition,
  analyzeResumeDefinition,
  updateProfileDefinition,
  checkCandidaturesDefinition,
  saveResumeDefinition,
  addCandidaturaDefinition,
];

export async function executeRoverTool(
  name: string,
  args: any,
  userId: string
): Promise<any> {
  console.log(`[RoverToolCalling] Executing tool: ${name} with args:`, args);

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
    case 'update_profile':
      return await runUpdateProfile(userId, args);
    case 'check_candidatures':
      return await runCheckCandidatures(userId);
    case 'save_resume':
      return await runSaveResume(userId, args);
    case 'add_candidatura':
      return await runAddCandidatura(userId, args);
    default:
      throw new Error(`Ferramenta desconhecida: ${name}`);
  }
}

