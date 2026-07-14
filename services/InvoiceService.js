// services/invoiceService.js
const Invoice = require('../models/invoice'); 
const crypto = require('crypto');
const mongoose = require('mongoose');

// ============================================
// Helper: Clean ObjectId
// ============================================
const cleanId = (id) => {
  if (!id) return null;
  if (typeof id === 'string') {
    return id.trim();
  }
  return id;
};

const isValidObjectId = (id) => {
  const cleaned = cleanId(id);
  return mongoose.Types.ObjectId.isValid(cleaned);
};

// ============================================
// Helper: Generate Unique Invoice Number
// ============================================
const generateInvoiceNumber = async (userId, retries = 3) => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Find the highest invoice number for this user
      const lastInvoice = await Invoice.findOne({ userId })
        .sort({ invoiceNumber: -1 })
        .select('invoiceNumber');
      
      let nextNumber = 1;
      if (lastInvoice && lastInvoice.invoiceNumber) {
        const match = lastInvoice.invoiceNumber.match(/INV-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
      
      const invoiceNumber = `INV-${String(nextNumber).padStart(3, '0')}`;
      
      // Double-check that this number doesn't already exist (shouldn't, but just in case)
      const existing = await Invoice.findOne({ userId, invoiceNumber });
      if (!existing) {
        return invoiceNumber;
      }
      // If it exists, increment and try again
    } catch (error) {
      if (attempt === retries - 1) throw error;
    }
  }
  throw new Error('Failed to generate unique invoice number after multiple attempts');
};

// ============================================
// DASHBOARD SERVICES
// ============================================
exports.getInvoiceStats = async (userId) => {
  try {
    const invoices = await Invoice.find({ userId });
    
    const totalInvoices = invoices.length;
    let totalCollected = 0;
    let pendingAmount = 0;
    let overdueCount = 0;
    
    invoices.forEach(invoice => {
      if (invoice.status === 'Paid') {
        totalCollected += invoice.amount;
      } else if (invoice.status === 'Unpaid') {
        pendingAmount += invoice.amount;
        if (invoice.dueDate && new Date(invoice.dueDate) < new Date()) {
          overdueCount++;
        }
      } else if (invoice.status === 'Overdue') {
        pendingAmount += invoice.amount;
        overdueCount++;
      }
    });
    
    return {
      success: true,
      totalInvoices,
      totalCollected,
      pendingAmount,
      unpaidCount: overdueCount
    };
  } catch (error) {
    throw error;
  }
};

exports.getRecentInvoices = async (userId, limit = 5) => {
  try {
    const invoices = await Invoice.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('invoiceNumber client amount status dueDate createdAt');
    
    const formattedInvoices = invoices.map(inv => ({
      id: inv._id,
      invoiceNumber: `#${inv.invoiceNumber}`,
      client: inv.client,
      amount: inv.amount,
      status: inv.status,
      date: inv.createdAt,
      dueDate: inv.dueDate
    }));
    
    return {
      success: true,
      invoices: formattedInvoices
    };
  } catch (error) {
    throw error;
  }
};

// ============================================
// MAIN INVOICE SERVICES
// ============================================
exports.getInvoices = async (userId, page = 1, limit = 5, filters = {}) => {
  try {
    const query = { userId };
    
    if (filters.status) {
      query.status = filters.status;
    }
    
    if (filters.search) {
      query.$or = [
        { client: { $regex: filters.search, $options: 'i' } },
        { invoiceNumber: { $regex: filters.search, $options: 'i' } }
      ];
    }
    
    const skip = (page - 1) * limit;
    
    const [invoices, total] = await Promise.all([
      Invoice.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Invoice.countDocuments(query)
    ]);
    
    const formattedInvoices = invoices.map(inv => ({
      id: inv._id,
      invoiceNumber: `#${inv.invoiceNumber}`,
      client: inv.client,
      amount: inv.amount,
      status: inv.status,
      date: inv.createdAt,
      dueDate: inv.dueDate,
      clientEmail: inv.clientEmail,
      clientPhone: inv.clientPhone,
      notes: inv.notes
    }));
    
    return {
      success: true,
      invoices: formattedInvoices,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    throw error;
  }
};

// ============================================
// CRUD OPERATIONS - FIXED
// ============================================
exports.createInvoice = async (userId, invoiceData) => {
  try {
    // Generate unique invoice number using the helper
    const invoiceNumber = await generateInvoiceNumber(userId);
    
    // Removed: shareToken - not in schema
    // const shareToken = crypto.randomBytes(16).toString('hex');
    
    const invoice = await Invoice.create({
      userId,
      invoiceNumber,
      // shareToken, // ⬅️ REMOVED - not in schema
      client: invoiceData.client,
      clientEmail: invoiceData.email || null,
      amount: parseFloat(invoiceData.amount),
      status: invoiceData.status || 'Unpaid',
      dueDate: invoiceData.dueDate || null,
      notes: invoiceData.description || null,
    });
    
    return {
      success: true,
      message: 'Invoice created successfully',
      invoice: {
        id: invoice._id,
        invoiceNumber: `#${invoice.invoiceNumber}`,
        client: invoice.client,
        amount: invoice.amount,
        status: invoice.status,
        date: invoice.createdAt,
        dueDate: invoice.dueDate
      }
    };
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      // Retry with a new number
      try {
        const invoiceNumber = await generateInvoiceNumber(userId, 5);
        
        const invoice = await Invoice.create({
          userId,
          invoiceNumber,
          client: invoiceData.client,
          clientEmail: invoiceData.email || null,
          amount: parseFloat(invoiceData.amount),
          status: invoiceData.status || 'Unpaid',
          dueDate: invoiceData.dueDate || null,
          notes: invoiceData.description || null,
        });
        
        return {
          success: true,
          message: 'Invoice created successfully (retry)',
          invoice: {
            id: invoice._id,
            invoiceNumber: `#${invoice.invoiceNumber}`,
            client: invoice.client,
            amount: invoice.amount,
            status: invoice.status,
            date: invoice.createdAt,
            dueDate: invoice.dueDate
          }
        };
      } catch (retryError) {
        throw new Error('Failed to create invoice due to duplicate key');
      }
    }
    throw error;
  }
};

// ============================================
// GET SINGLE INVOICE
// ============================================
exports.getInvoice = async (userId, invoiceId) => {
  try {
    const cleanedId = cleanId(invoiceId);
    
    if (!isValidObjectId(cleanedId)) {
      throw new Error('Invalid invoice ID format');
    }
    
    const invoice = await Invoice.findOne({ _id: cleanedId, userId });
    
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    
    return {
      success: true,
      invoice: {
        id: invoice._id,
        invoiceNumber: `#${invoice.invoiceNumber}`,
        client: invoice.client,
        amount: invoice.amount,
        status: invoice.status,
        date: invoice.createdAt,
        dueDate: invoice.dueDate,
        clientEmail: invoice.clientEmail,
        clientPhone: invoice.clientPhone,
        clientAddress: invoice.clientAddress,
        notes: invoice.notes,
        paymentDate: invoice.paymentDate,
        // shareToken: invoice.shareToken, // ⬅️ REMOVED - not in schema
      }
    };
  } catch (error) {
    throw error;
  }
};

// ============================================
// UPDATE INVOICE
// ============================================
exports.updateInvoice = async (userId, invoiceId, updateData) => {
  try {
    const cleanedId = cleanId(invoiceId);
    
    if (!isValidObjectId(cleanedId)) {
      throw new Error('Invalid invoice ID format');
    }
    
    const invoice = await Invoice.findOne({ _id: cleanedId, userId });
    
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    
    const allowedFields = [
      'client', 'amount', 'status', 'dueDate', 
      'clientEmail', 'clientPhone', 'clientAddress',
      'notes'
    ];
    
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        invoice[field] = updateData[field];
      }
    });
    
    if (updateData.status === 'Paid' && invoice.status !== 'Paid') {
      invoice.paymentDate = new Date();
    }
    
    await invoice.save();
    
    return {
      success: true,
      message: 'Invoice updated successfully',
      invoice: {
        id: invoice._id,
        invoiceNumber: `#${invoice.invoiceNumber}`,
        client: invoice.client,
        amount: invoice.amount,
        status: invoice.status,
        date: invoice.createdAt,
        dueDate: invoice.dueDate
      }
    };
  } catch (error) {
    throw error;
  }
};

// ============================================
// DELETE INVOICE
// ============================================
exports.deleteInvoice = async (userId, invoiceId) => {
  try {
    const cleanedId = cleanId(invoiceId);
    
    if (!isValidObjectId(cleanedId)) {
      throw new Error('Invalid invoice ID format');
    }
    
    const invoice = await Invoice.findOneAndDelete({ _id: cleanedId, userId });
    
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    
    return {
      success: true,
      message: 'Invoice deleted successfully'
    };
  } catch (error) {
    throw error;
  }
};

// ============================================
// UPDATE INVOICE STATUS
// ============================================
exports.updateInvoiceStatus = async (userId, invoiceId, status) => {
  try {
    const cleanedId = cleanId(invoiceId);
    
    if (!isValidObjectId(cleanedId)) {
      throw new Error('Invalid invoice ID format');
    }
    
    const invoice = await Invoice.findOne({ _id: cleanedId, userId });
    
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    
    const validStatuses = ['Paid', 'Unpaid', 'Cancelled', 'Overdue'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status');
    }
    
    invoice.status = status;
    
    if (status === 'Paid') {
      invoice.paymentDate = new Date();
    }
    
    await invoice.save();
    
    return {
      success: true,
      message: `Invoice status updated to ${status}`,
      invoice: {
        id: invoice._id,
        invoiceNumber: `#${invoice.invoiceNumber}`,
        client: invoice.client,
        amount: invoice.amount,
        status: invoice.status,
        date: invoice.createdAt,
        dueDate: invoice.dueDate
      }
    };
  } catch (error) {
    throw error;
  }
};

// ============================================
// BULK OPERATIONS
// ============================================
exports.bulkDeleteInvoices = async (userId, invoiceIds) => {
  try {
    if (!invoiceIds || invoiceIds.length === 0) {
      throw new Error('No invoice IDs provided');
    }
    
    const cleanedIds = invoiceIds.map(id => cleanId(id));
    
    const result = await Invoice.deleteMany({
      _id: { $in: cleanedIds },
      userId: userId
    });
    
    if (result.deletedCount === 0) {
      throw new Error('No invoices found to delete');
    }
    
    return {
      success: true,
      message: `${result.deletedCount} invoice(s) deleted successfully`,
      deletedCount: result.deletedCount
    };
  } catch (error) {
    throw error;
  }
};

exports.bulkUpdateStatus = async (userId, invoiceIds, status) => {
  try {
    if (!invoiceIds || invoiceIds.length === 0) {
      throw new Error('No invoice IDs provided');
    }
    
    const validStatuses = ['Paid', 'Unpaid', 'Cancelled', 'Overdue'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status');
    }
    
    const cleanedIds = invoiceIds.map(id => cleanId(id));
    
    const result = await Invoice.updateMany(
      { _id: { $in: cleanedIds }, userId: userId },
      { 
        status: status,
        ...(status === 'Paid' && { paymentDate: new Date() })
      }
    );
    
    if (result.matchedCount === 0) {
      throw new Error('No invoices found to update');
    }
    
    return {
      success: true,
      message: `${result.modifiedCount} invoice(s) updated to ${status}`,
      modifiedCount: result.modifiedCount
    };
  } catch (error) {
    throw error;
  }
};

// ============================================
// EXPORT SERVICES
// ============================================
exports.getAllInvoicesForExport = async (userId, invoiceIds = null) => {
  try {
    let query = { userId };
    
    if (invoiceIds && invoiceIds.length > 0) {
      const cleanedIds = invoiceIds.map(id => cleanId(id));
      query._id = { $in: cleanedIds };
    }
    
    const invoices = await Invoice.find(query)
      .sort({ createdAt: -1 })
      .select('invoiceNumber client amount status dueDate createdAt paymentDate');
    
    const formattedInvoices = invoices.map(inv => ({
      id: inv._id,
      invoiceNumber: `#${inv.invoiceNumber}`,
      client: inv.client,
      amount: inv.amount,
      status: inv.status,
      date: inv.createdAt,
      dueDate: inv.dueDate,
      paymentDate: inv.paymentDate
    }));
    
    return {
      success: true,
      invoices: formattedInvoices
    };
  } catch (error) {
    throw error;
  }
};

// ============================================
// SUMMARY ANALYTICS
// ============================================
exports.getSummaryAnalytics = async (userId) => {
  try {
    const invoices = await Invoice.find({ userId });
    
    if (invoices.length === 0) {
      return {
        success: true,
        data: {
          totalRevenue: 0,
          averageInvoice: 0,
          mostActiveClient: null,
          mostActiveClientCount: 0,
          statusDistribution: {
            Paid: 0,
            Unpaid: 0,
            Overdue: 0,
            Cancelled: 0
          },
          totalInvoices: 0,
          paidInvoices: 0,
          unpaidInvoices: 0
        }
      };
    }
    
    const totalRevenue = invoices
      .filter(inv => inv.status === 'Paid')
      .reduce((sum, inv) => sum + inv.amount, 0);
    
    const averageInvoice = invoices.reduce((sum, inv) => sum + inv.amount, 0) / invoices.length;
    
    const clientCount = {};
    invoices.forEach(inv => {
      clientCount[inv.client] = (clientCount[inv.client] || 0) + 1;
    });
    
    let mostActiveClient = null;
    let mostActiveClientCount = 0;
    for (const [client, count] of Object.entries(clientCount)) {
      if (count > mostActiveClientCount) {
        mostActiveClientCount = count;
        mostActiveClient = client;
      }
    }
    
    const statusDistribution = {
      Paid: invoices.filter(inv => inv.status === 'Paid').length,
      Unpaid: invoices.filter(inv => inv.status === 'Unpaid').length,
      Overdue: invoices.filter(inv => inv.status === 'Overdue').length,
      Cancelled: invoices.filter(inv => inv.status === 'Cancelled').length
    };
    
    return {
      success: true,
      data: {
        totalRevenue,
        averageInvoice: parseFloat(averageInvoice.toFixed(2)),
        mostActiveClient,
        mostActiveClientCount,
        statusDistribution,
        totalInvoices: invoices.length,
        paidInvoices: statusDistribution.Paid,
        unpaidInvoices: statusDistribution.Unpaid + statusDistribution.Overdue
      }
    };
  } catch (error) {
    throw error;
  }
};

exports.getOverdueSummary = async (userId) => {
  try {
    const now = new Date();
    
    const invoices = await Invoice.find({
      userId,
      status: 'Unpaid',
      dueDate: { $lt: now }
    });
    
    const overdueCount = invoices.length;
    const overdueAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    
    return {
      success: true,
      overdueCount,
      overdueAmount,
      invoices: invoices.map(inv => ({
        id: inv._id,
        invoiceNumber: `#${inv.invoiceNumber}`,
        client: inv.client,
        amount: inv.amount,
        dueDate: inv.dueDate,
        daysOverdue: Math.floor((now - new Date(inv.dueDate)) / (1000 * 60 * 60 * 24))
      }))
    };
  } catch (error) {
    throw error;
  }
};