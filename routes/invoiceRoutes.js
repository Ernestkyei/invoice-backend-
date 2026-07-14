const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getInvoiceStats,
  getRecentInvoices,
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  updateInvoiceStatus,
  bulkDeleteInvoices,
  bulkUpdateStatus,
  exportInvoicesCSV,
  exportInvoicesPDF,
  getSummaryAnalytics,
  getOverdueSummary
} = require('../controllers/invoiceController');

// ============================================
// DASHBOARD ROUTES
// ============================================
router.get('/stats', protect, getInvoiceStats);
router.get('/recent', protect, getRecentInvoices);

// ============================================
// MAIN INVOICE ROUTES (CRUD)
// ============================================
router.get('/', protect, getInvoices);
router.post('/', protect, createInvoice);

// ============================================
// INVOICE ROUTES WITH PARAMETERS
// ============================================
router.get('/:id', protect, getInvoice);
router.put('/:id', protect, updateInvoice);
router.patch('/:id/status', protect, updateInvoiceStatus);
router.delete('/:id', protect, deleteInvoice);

// ============================================
// BULK OPERATIONS
// ============================================
router.delete('/bulk/delete', protect, bulkDeleteInvoices);
router.patch('/bulk/status', protect, bulkUpdateStatus);

// ============================================
// EXPORT ROUTES
// ============================================
router.get('/export/csv', protect, exportInvoicesCSV);
router.get('/export/pdf', protect, exportInvoicesPDF);

// ============================================
// ANALYTICS ROUTES
// ============================================
router.get('/analytics/summary', protect, getSummaryAnalytics);
router.get('/analytics/overdue', protect, getOverdueSummary);

module.exports = router;