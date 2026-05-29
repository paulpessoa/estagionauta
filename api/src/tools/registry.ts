import { checkProfileDefinition, runCheckProfile } from './check_profile.js';
import { checkCreditsDefinition, runCheckCredits } from './check_credits.js';
import { calculateRecessDefinition, runCalculateRecess } from './calculate_recess.js';
import { analyzeResumeDefinition, runAnalyzeResume } from './analyze_resume.js';
import { updateProfileDefinition, runUpdateProfile } from './update_profile.js';
import { checkCandidaturesDefinition, runCheckCandidatures } from './check_candidatures.js';
import { saveResumeDefinition, runSaveResume } from './save_resume.js';
import { addCandidaturaDefinition, runAddCandidatura } from './add_candidatura.js';

// Sprint 1 new tools
import { buyCreditsDefinition, runBuyCredits } from './buy_credits.js';
import { startInterviewDefinition, runStartInterview } from './start_interview.js';
import { generateResumeDefinition, runGenerateResume } from './generate_resume.js';
import { analyzeCandidaturaDefinition, runAnalyzeCandidatura } from './analyze_candidatura.js';
import { updateCandidaturaDefinition, runUpdateCandidatura } from './update_candidatura.js';
import { getReferralLinkDefinition, runGetReferralLink } from './get_referral_link.js';
import { inviteFriendDefinition, runInviteFriend } from './invite_friend.js';
import { listInviteesDefinition, runListInvitees } from './list_invitees.js';
import { checkReferralStatsDefinition, runCheckReferralStats } from './check_referral_stats.js';
import { listAvailableTasksDefinition, runListAvailableTasks } from './list_available_tasks.js';
import { claimTaskRewardDefinition, runClaimTaskReward } from './claim_task_reward.js';
import { requestPasswordResetDefinition, runRequestPasswordReset } from './request_password_reset.js';

export const roverTools = [
  checkProfileDefinition,
  checkCreditsDefinition,
  calculateRecessDefinition,
  analyzeResumeDefinition,
  updateProfileDefinition,
  checkCandidaturesDefinition,
  saveResumeDefinition,
  addCandidaturaDefinition,
  // Sprint 1
  buyCreditsDefinition,
  startInterviewDefinition,
  generateResumeDefinition,
  analyzeCandidaturaDefinition,
  updateCandidaturaDefinition,
  getReferralLinkDefinition,
  inviteFriendDefinition,
  listInviteesDefinition,
  checkReferralStatsDefinition,
  listAvailableTasksDefinition,
  claimTaskRewardDefinition,
  requestPasswordResetDefinition,
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
    // Sprint 1
    case 'buy_credits':
      return await runBuyCredits(userId, args);
    case 'start_interview':
      return await runStartInterview(userId, args);
    case 'generate_resume':
      return await runGenerateResume(userId, args);
    case 'analyze_candidatura':
      return await runAnalyzeCandidatura(userId, args);
    case 'update_candidatura':
      return await runUpdateCandidatura(userId, args);
    case 'get_referral_link':
      return await runGetReferralLink(userId);
    case 'invite_friend':
      return await runInviteFriend(userId, args);
    case 'list_invitees':
      return await runListInvitees(userId);
    case 'check_referral_stats':
      return await runCheckReferralStats(userId);
    case 'list_available_tasks':
      return await runListAvailableTasks(userId);
    case 'claim_task_reward':
      return await runClaimTaskReward(userId, args);
    case 'request_password_reset':
      return await runRequestPasswordReset(userId);
    default:
      throw new Error(`Ferramenta desconhecida: ${name}`);
  }
}


