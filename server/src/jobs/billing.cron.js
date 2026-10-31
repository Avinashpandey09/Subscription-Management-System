import cron from 'node-cron';
import { runBilling } from '../services/billing.service.js';

export function startBillingCron() {
  const schedule = process.env.BILLING_CRON || '0 2 * * *';
  if (!schedule.trim()) {
    console.log('Billing cron disabled (BILLING_CRON empty)');
    return;
  }
  if (!cron.validate(schedule)) {
    console.error(`Invalid BILLING_CRON schedule: ${schedule}`);
    return;
  }
  cron.schedule(schedule, async () => {
    try {
      const result = await runBilling(new Date());
      console.log('[billing-cron]', JSON.stringify(result));
    } catch (e) {
      console.error('[billing-cron] failed:', e.message);
    }
  });
  console.log(`Billing cron scheduled: ${schedule}`);
}
