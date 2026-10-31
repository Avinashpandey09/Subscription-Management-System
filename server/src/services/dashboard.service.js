import Subscription from '../models/Subscription.js';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';

// Finance dashboard aggregates. Uses indexed fields (status, dueDate,
// customerId) + lean queries so 1,000+ subscriptions load in < 2s.
export async function getDashboard() {
  const started = Date.now();
  const today = new Date();

  const [activeSubscriptions, statusBreakdown, revenueAgg, outstandingAgg, overdue, recentPayments, revenueByMonth] =
    await Promise.all([
      Subscription.countDocuments({ status: 'Active' }),
      Subscription.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Payment.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      Invoice.aggregate([
        { $match: { status: { $in: ['Draft', 'Confirmed'] } } },
        { $group: { _id: null, total: { $sum: '$amountDue' }, count: { $sum: 1 } } }
      ]),
      Invoice.find({ dueDate: { $lt: today }, status: { $in: ['Draft', 'Confirmed'] } })
        .select('number customer total amountDue dueDate status')
        .sort({ dueDate: 1 })
        .limit(100)
        .lean(),
      Payment.find().populate('invoiceId', 'number').sort({ date: -1 }).limit(10).lean(),
      Payment.aggregate([
        { $match: { date: { $gte: new Date(today.getFullYear(), today.getMonth() - 5, 1) } } },
        {
          $group: {
            _id: { y: { $year: '$date' }, m: { $month: '$date' } },
            revenue: { $sum: '$amount' }
          }
        },
        { $sort: { '_id.y': 1, '_id.m': 1 } }
      ])
    ]);

  return {
    kpis: {
      activeSubscriptions,
      revenueCollected: revenueAgg[0]?.total || 0,
      outstanding: outstandingAgg[0]?.total || 0,
      outstandingCount: outstandingAgg[0]?.count || 0,
      overdueCount: overdue.length
    },
    statusBreakdown: Object.fromEntries(statusBreakdown.map((s) => [s._id, s.count])),
    overdue,
    recentPayments,
    revenueByMonth: revenueByMonth.map((r) => ({
      month: `${r._id.y}-${String(r._id.m).padStart(2, '0')}`,
      revenue: r.revenue
    })),
    durationMs: Date.now() - started
  };
}
