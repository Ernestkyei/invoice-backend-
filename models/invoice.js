// models/Invoice.js
const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  invoiceNumber: {
    type: String,
    required: true,
    
  },
  client: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['Paid', 'Unpaid', 'Cancelled', 'Overdue'],
    default: 'Unpaid'
  },
  date: {
    type: Date,
    default: Date.now
  },
  clientEmail: String,
  clientPhone: String,
  clientAddress: String,
  dueDate: Date,
  items: [{
    description: String,
    quantity: Number,
    price: Number,
    total: Number
  }],
  notes: String,
  paymentDate: Date,
  paymentMethod: String
}, {
  timestamps: true
});

// ============================================
// FIXED: Auto-generate invoice number
// ============================================
invoiceSchema.pre('save', async function(next) {
  if (this.isNew && !this.invoiceNumber) {
    try {
      // Find the highest invoice number for this user
      const lastInvoice = await mongoose.model('Invoice')
        .findOne({ userId: this.userId })
        .sort({ invoiceNumber: -1 })
        .select('invoiceNumber');
      
      let nextNumber = 1;
      if (lastInvoice && lastInvoice.invoiceNumber) {
        // Extract the number from INV-XXX
        const match = lastInvoice.invoiceNumber.match(/INV-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
      
      this.invoiceNumber = `INV-${String(nextNumber).padStart(3, '0')}`;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});


invoiceSchema.index({ userId: 1, invoiceNumber: 1 }, { unique: true });
// Additional indexes for performance
invoiceSchema.index({ userId: 1, status: 1 });
invoiceSchema.index({ userId: 1, date: -1 });



module.exports = mongoose.model('Invoice', invoiceSchema);