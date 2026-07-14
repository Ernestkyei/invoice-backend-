const mongoose = require('mongoose');
const invoiceService = require('../services/InvoiceService');

const validateObjectId = (id) => {
  if (!id || typeof id !== 'string') return false;
  const trimmedId = id.trim();
  return mongoose.Types.ObjectId.isValid(trimmedId);
};

// ============================================
// 1. GET INVOICE STATISTICS (Dashboard)
// ============================================
exports.getInvoiceStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await invoiceService.getInvoiceStats(userId);    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching invoice stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoice statistics',
      error: error.message
    });
  }
};

// ============================================
// 2. GET RECENT INVOICES (Dashboard preview)
// ============================================
exports.getRecentInvoices = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 5;    
    const result = await invoiceService.getRecentInvoices(userId, limit);    
    res.status(200).json({
      success: true,
      data: result.invoices
    });
  } catch (error) {
    console.error('Error fetching recent invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent invoices',
      error: error.message
    });
  }
};

// ============================================
// 3. GET ALL INVOICES (with pagination & filters)
// ============================================
exports.getInvoices = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.search) filters.search = req.query.search;
    if (req.query.fromDate) filters.fromDate = req.query.fromDate;
    if (req.query.toDate) filters.toDate = req.query.toDate;    
    
    const result = await invoiceService.getInvoices(userId, page, limit, filters);
    
    res.status(200).json({
      success: true,
      data: result.invoices,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoices',
      error: error.message
    });
  }
};

// ============================================
// 4. GET SINGLE INVOICE BY ID
// ============================================
exports.getInvoice = async (req, res) => {
  try {
    const userId = req.user.id;
    const invoiceId = req.params.id?.trim();
    if (!validateObjectId(invoiceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice ID'
      });
    }
    
    const result = await invoiceService.getInvoice(userId, invoiceId);    
    res.status(200).json({
      success: true,
      data: result.invoice
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    
    if (error.message === 'Invoice not found') {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoice',
      error: error.message
    });
  }
};

// ============================================
// 5. CREATE NEW INVOICE
// ============================================
exports.createInvoice = async (req, res) => {
  try {
    const userId = req.user.id;
    const invoiceData = req.body;
    
    // Basic validation
    if (!invoiceData.client || !invoiceData.amount) {
      return res.status(400).json({
        success: false,
        message: 'Client name and amount are required fields'
      });
    }
    
    if (isNaN(invoiceData.amount) || invoiceData.amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number'
      });
    }
    
    const result = await invoiceService.createInvoice(userId, invoiceData);
    
    res.status(201).json({
      success: true,
      message: result.message,
      data: result.invoice
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    
    // Handle duplicate key error from service
    if (error.message === 'Failed to create invoice due to duplicate key') {
      return res.status(409).json({
        success: false,
        message: 'Invoice number conflict. Please try again.',
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create invoice',
      error: error.message
    });
  }
};

// ============================================
// 6. UPDATE INVOICE
// ============================================
exports.updateInvoice = async (req, res) => {
  try {
    const userId = req.user.id;
    const invoiceId = req.params.id?.trim();
    const updateData = req.body;

    if (!validateObjectId(invoiceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice ID'
      });
    }
    
    if (updateData.amount !== undefined) {
      if (isNaN(updateData.amount) || updateData.amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be a positive number'
        });
      }
    }
    
    const result = await invoiceService.updateInvoice(userId, invoiceId, updateData);
    
    res.status(200).json({
      success: true,
      message: result.message,
      data: result.invoice
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
    
    if (error.message === 'Invoice not found') {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update invoice',
      error: error.message
    });
  }
};

// ============================================
// 7. DELETE INVOICE
// ============================================
exports.deleteInvoice = async (req, res) => {
  try {
    const userId = req.user.id;
    const invoiceId = req.params.id?.trim();

    if (!validateObjectId(invoiceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice ID'
      });
    }
    
    const result = await invoiceService.deleteInvoice(userId, invoiceId);
    
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    
    if (error.message === 'Invoice not found') {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to delete invoice',
      error: error.message
    });
  }
};

// ============================================
// 8. UPDATE INVOICE STATUS
// ============================================
exports.updateInvoiceStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const invoiceId = req.params.id?.trim();
    const { status } = req.body;

    if (!validateObjectId(invoiceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice ID'
      });
    }
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    const validStatuses = ['Paid', 'Unpaid', 'Cancelled', 'Overdue'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    const result = await invoiceService.updateInvoiceStatus(userId, invoiceId, status);
    
    res.status(200).json({
      success: true,
      message: result.message,
      data: result.invoice
    });
  } catch (error) {
    console.error('Error updating invoice status:', error);
    
    if (error.message === 'Invoice not found') {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    if (error.message === 'Invalid status') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update invoice status',
      error: error.message
    });
  }
};

// ============================================
// 9. BULK DELETE INVOICES
// ============================================
exports.bulkDeleteInvoices = async (req, res) => {
  try {
    const userId = req.user.id;
    const { invoiceIds } = req.body;    
    
    if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of invoice IDs to delete'
      });
    }
    
    const Invoice = require('../models/Invoice');
    const result = await Invoice.deleteMany({
      _id: { $in: invoiceIds },
      userId: userId
    });
    
    res.status(200).json({
      success: true,
      message: `${result.deletedCount} invoice(s) deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error bulk deleting invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete invoices',
      error: error.message
    });
  }
};

// ============================================
// 10. BULK UPDATE INVOICE STATUS
// ============================================
exports.bulkUpdateStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { invoiceIds, status } = req.body;
    
    if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of invoice IDs to update'
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const validStatuses = ['Paid', 'Unpaid', 'Cancelled', 'Overdue'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const result = await invoiceService.bulkUpdateStatus(userId, invoiceIds, status);

    res.status(200).json({
      success: true,
      message: result.message,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error bulk updating invoice statuses:', error);

    if (error.message === 'No invoice IDs provided') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    if (error.message === 'Invalid status') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    if (error.message === 'No invoices found to update') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update invoice statuses',
      error: error.message
    });
  }
};

// ============================================
// 11. EXPORT INVOICES TO CSV - FIXED
// ============================================
exports.exportInvoicesCSV = async (req, res) => {
  try {
    const userId = req.user.id;
    const { invoiceIds } = req.query;

    const result = await invoiceService.getAllInvoicesForExport(
      userId,
      invoiceIds ? invoiceIds.split(',') : null
    );

    //  FIXED: Use result.invoices instead of invoices
    if (!result.invoices || result.invoices.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No invoices found to export'
      });
    }

    const csvHeader = 'Invoice #,Client,Amount,Status,Due Date,Created Date,Payment Date\n';
    const csvRows = result.invoices.map(inv => {
      return `${inv.invoiceNumber},"${inv.client}",${inv.amount},${inv.status},"${new Date(inv.dueDate).toLocaleDateString()}","${new Date(inv.date).toLocaleDateString()}","${inv.paymentDate ? new Date(inv.paymentDate).toLocaleDateString() : 'N/A'}"`;
    }).join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="invoices-export.csv"');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting invoices to CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export invoices to CSV',
      error: error.message
    });
  }
};

// ============================================
// 12. EXPORT INVOICES TO PDF - FIXED
// ============================================
exports.exportInvoicesPDF = async (req, res) => {
  try {
    const userId = req.user.id;
    const { invoiceIds } = req.query;

    const result = await invoiceService.getAllInvoicesForExport(
      userId,
      invoiceIds ? invoiceIds.split(',') : null
    );

    // FIXED: Use result.invoices instead of invoices
    if (!result.invoices || result.invoices.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No invoices found to export'
      });
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="invoices-export.json"');
    res.json({
      success: true,
      message: 'Invoice data for PDF export',
      data: result.invoices
    });
  } catch (error) {
    console.error('Error exporting invoices to PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export invoices to PDF',
      error: error.message
    });
  }
};

// ============================================
// 13. GET SUMMARY ANALYTICS
// ============================================
exports.getSummaryAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await invoiceService.getSummaryAnalytics(userId);

    res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error fetching summary analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch summary analytics',
      error: error.message
    });
  }
};

// ============================================
// 14. GET OVERDUE SUMMARY
// ============================================
exports.getOverdueSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await invoiceService.getOverdueSummary(userId);

    res.status(200).json({
      success: true,
      overdueCount: result.overdueCount,
      overdueAmount: result.overdueAmount,
      invoices: result.invoices
    });
  } catch (error) {
    console.error('Error fetching overdue summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch overdue summary',
      error: error.message
    });
  }
};