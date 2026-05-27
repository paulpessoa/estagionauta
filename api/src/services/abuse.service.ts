import { supabaseAdmin } from './supabase.service.js';

export interface AbuseCheckResult {
  allowed: boolean;
  reason?: string;
  cooldownRemaining?: number; // in seconds
}

/**
 * Checks if a user or IP address is exceeding limits or in cooldown.
 * Rules:
 * - Rate limit: Max 30 messages/hour and 100 messages/day.
 * - Cooldown: If > 15 messages in the last 5 minutes, trigger a 5-minute cooldown.
 */
export async function checkAbuse(userId: string, ipAddress: string): Promise<AbuseCheckResult> {
  const now = new Date();

  // 1. Check if user is currently in a cooldown block
  // Find if there is a 'spam_cooldown' log in the last 5 minutes
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
  
  const { data: recentCooldowns, error: cooldownError } = await supabaseAdmin
    .from('copilot_abuse_logs')
    .select('created_at')
    .eq('user_id', userId)
    .eq('action', 'spam_cooldown')
    .gte('created_at', fiveMinutesAgo)
    .order('created_at', { ascending: false })
    .limit(1);

  if (cooldownError) {
    console.error('Error checking cooldown logs:', cooldownError);
  }

  if (recentCooldowns && recentCooldowns.length > 0) {
    const cooldownTime = new Date(recentCooldowns[0].created_at);
    const elapsedSeconds = Math.floor((now.getTime() - cooldownTime.getTime()) / 1000);
    const remaining = Math.max(0, 300 - elapsedSeconds); // 5 minutes = 300 seconds
    if (remaining > 0) {
      return {
        allowed: false,
        reason: 'spam_cooldown',
        cooldownRemaining: remaining
      };
    }
  }

  // 2. Count messages in last 5 minutes to see if we should trigger a new cooldown
  const { count: fiveMinCount, error: count5Err } = await supabaseAdmin
    .from('copilot_messages')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('role', 'user')
    .gte('created_at', fiveMinutesAgo);

  if (count5Err) {
    console.error('Error counting 5min messages:', count5Err);
  }

  if (fiveMinCount !== null && fiveMinCount >= 15) {
    // Log abuse
    await logAbuse(userId, ipAddress, 'spam_cooldown', `User sent ${fiveMinCount} messages in 5 minutes.`);
    return {
      allowed: false,
      reason: 'spam_cooldown',
      cooldownRemaining: 300
    };
  }

  // 3. Count messages in last 1 hour (limit 30)
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const { count: hourlyCount, error: count1hErr } = await supabaseAdmin
    .from('copilot_messages')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('role', 'user')
    .gte('created_at', oneHourAgo);

  if (count1hErr) {
    console.error('Error counting hourly messages:', count1hErr);
  }

  if (hourlyCount !== null && hourlyCount >= 30) {
    await logAbuse(userId, ipAddress, 'rate_limit_hourly', `User exceeded hourly limit of 30 messages (sent ${hourlyCount}).`);
    return {
      allowed: false,
      reason: 'rate_limit_hourly'
    };
  }

  // 4. Count messages in last 24 hours (limit 100)
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const { count: dailyCount, error: count24hErr } = await supabaseAdmin
    .from('copilot_messages')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('role', 'user')
    .gte('created_at', oneDayAgo);

  if (count24hErr) {
    console.error('Error counting daily messages:', count24hErr);
  }

  if (dailyCount !== null && dailyCount >= 100) {
    await logAbuse(userId, ipAddress, 'rate_limit_daily', `User exceeded daily limit of 100 messages (sent ${dailyCount}).`);
    return {
      allowed: false,
      reason: 'rate_limit_daily'
    };
  }

  return { allowed: true };
}

/**
 * Logs abuse incident to the database.
 */
export async function logAbuse(
  userId: string,
  ipAddress: string,
  action: string,
  details: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('copilot_abuse_logs')
    .insert({
      user_id: userId,
      ip_address: ipAddress || 'unknown',
      action,
      details
    });

  if (error) {
    console.error('Error writing abuse log:', error);
  }
}
