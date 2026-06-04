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
import { redeemCouponDefinition, runRedeemCoupon } from './redeem_coupon.js';
import { analyzeCandidaturaDefinition, runAnalyzeCandidatura } from './analyze_candidatura.js';
import { updateCandidaturaDefinition, runUpdateCandidatura } from './update_candidatura.js';
import { getReferralLinkDefinition, runGetReferralLink } from './get_referral_link.js';
import { inviteFriendDefinition, runInviteFriend } from './invite_friend.js';
import { listInviteesDefinition, runListInvitees } from './list_invitees.js';
import { checkReferralStatsDefinition, runCheckReferralStats } from './check_referral_stats.js';
import { listAvailableTasksDefinition, runListAvailableTasks } from './list_available_tasks.js';
import { claimTaskRewardDefinition, runClaimTaskReward } from './claim_task_reward.js';
import { requestPasswordResetDefinition, runRequestPasswordReset } from './request_password_reset.js';

// Sprint 2 new tools
import { createReminderDefinition, runCreateReminder } from './create_reminder.js';
import { listRemindersDefinition, runListReminders } from './list_reminders.js';
import { updateReminderDefinition, runUpdateReminder } from './update_reminder.js';
import { checkCreditHistoryDefinition, runCheckCreditHistory } from './check_credit_history.js';
import { checkCreditExpiryDefinition, runCheckCreditExpiry } from './check_credit_expiry.js';
import { listPastInterviewsDefinition, runListPastInterviews } from './list_past_interviews.js';
import { candidaturaStatsDefinition, runCandidaturaStats } from './candidatura_stats.js';
import { listResumesDefinition, runListResumes } from './list_resumes.js';
import { checkAccountStatusDefinition, runCheckAccountStatus } from './check_account_status.js';
import { navigateToDefinition, runNavigateTo } from './navigate_to.js';

// Sprint 3 agency tools
import { searchAgenciesDefinition, runSearchAgencies } from './search_agencies.js';
import { getAgencyDetailsDefinition, runGetAgencyDetails } from './get_agency_details.js';
import { submitAgencyReviewDefinition, runSubmitAgencyReview } from './submit_agency_review.js';
import { createAgencyDefinition, runCreateAgency } from './create_agency.js';


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
  redeemCouponDefinition,
  analyzeCandidaturaDefinition,
  updateCandidaturaDefinition,
  getReferralLinkDefinition,
  inviteFriendDefinition,
  listInviteesDefinition,
  checkReferralStatsDefinition,
  listAvailableTasksDefinition,
  claimTaskRewardDefinition,
  requestPasswordResetDefinition,
  // Sprint 2
  createReminderDefinition,
  listRemindersDefinition,
  updateReminderDefinition,
  checkCreditHistoryDefinition,
  checkCreditExpiryDefinition,
  listPastInterviewsDefinition,
  candidaturaStatsDefinition,
  listResumesDefinition,
  checkAccountStatusDefinition,
  navigateToDefinition,
  // Sprint 3
  searchAgenciesDefinition,
  getAgencyDetailsDefinition,
  submitAgencyReviewDefinition,
  createAgencyDefinition,
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
    case 'redeem_coupon':
      return await runRedeemCoupon(userId, args);
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
    // Sprint 2
    case 'create_reminder':
      return await runCreateReminder(userId, args);
    case 'list_reminders':
      return await runListReminders(userId, args);
    case 'update_reminder':
      return await runUpdateReminder(userId, args);
    case 'check_credit_history':
      return await runCheckCreditHistory(userId, args);
    case 'check_credit_expiry':
      return await runCheckCreditExpiry(userId);
    case 'list_past_interviews':
      return await runListPastInterviews(userId, args);
    case 'candidatura_stats':
      return await runCandidaturaStats(userId);
    case 'list_resumes':
      return await runListResumes(userId);
    case 'check_account_status':
      return await runCheckAccountStatus(userId);
    case 'navigate_to':
      return await runNavigateTo(userId, args);
    // Sprint 3
    case 'search_agencies':
      return await runSearchAgencies(userId, args);
    case 'get_agency_details':
      return await runGetAgencyDetails(userId, args);
    case 'submit_agency_review':
      return await runSubmitAgencyReview(userId, args);
    case 'create_agency':
      return await runCreateAgency(userId, args);
    default:
      throw new Error(`Ferramenta desconhecida: ${name}`);
  }
}

export const toolInvalidations: Record<string, string[]> = {
  // Modifica Perfil
  'update_profile': ['profile'],
  
  // Modifica Créditos
  'redeem_coupon': ['credits', 'profile'],
  'buy_credits': ['credits'],
  'start_interview': ['credits'],
  'analyze_resume': ['credits'],
  'claim_task_reward': ['credits'],
  
  // Modifica Candidaturas
  'add_candidatura': ['candidatures'],
  'update_candidatura': ['candidatures'],
  
  // Modifica Indicações
  'invite_friend': ['referrals'],
  
  // Modifica Agências
  'submit_agency_review': ['agencies'],
  'create_agency': ['agencies'],
};


