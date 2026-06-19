import mongoose from 'mongoose';

const ReminderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: String, required: true },
  subject: { type: String, default: '' },
  completed: { type: Boolean, default: false }
}, { timestamps: true });

export const ReminderModel = mongoose.model('Reminder', ReminderSchema);
