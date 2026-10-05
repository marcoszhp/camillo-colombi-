import { json } from '../lib/http.js';
import { currentUser } from '../lib/auth.js';

export async function handleLoyalty(request, env, path, method) {
  if (path !== '/loyalty/summary' || method !== 'GET') return null;
  const user = await currentUser(request, env, true);
  const [levelsR, transactionsR, rewardsR, customerRewardsR] = await Promise.all([
    env.DB.prepare('SELECT id,name,slug,min_points,benefit_description FROM loyalty_levels ORDER BY min_points').all(),
    env.DB.prepare('SELECT type,points,description,created_at FROM loyalty_transactions WHERE user_id=? ORDER BY id DESC LIMIT 50').bind(user.id).all(),
    env.DB.prepare('SELECT id,name,description,points_cost,reward_type FROM rewards WHERE active=1 ORDER BY points_cost').all(),
    env.DB.prepare(`SELECT cr.id,cr.status,cr.created_at,cr.redeemed_at,r.name,r.description,r.reward_type
      FROM customer_rewards cr JOIN rewards r ON r.id=cr.reward_id WHERE cr.user_id=? ORDER BY cr.id DESC`).bind(user.id).all()
  ]);
  const levels = levelsR.results || [];
  const points = Number(user.loyalty_points || 0);
  let currentLevel = levels[0] || null;
  let nextLevel = null;
  for (const level of levels) {
    if (points >= Number(level.min_points)) currentLevel = level;
    else { nextLevel = level; break; }
  }
  const rewards = (rewardsR.results || []).map((reward) => ({ ...reward, unlocked: points >= Number(reward.points_cost) }));
  return json({
    points,
    currentLevel,
    nextLevel,
    rewards,
    customerRewards: customerRewardsR.results || [],
    transactions: transactionsR.results || []
  });
}
