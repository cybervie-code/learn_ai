import mongoose from 'mongoose';

const { Schema } = mongoose;

const badgeSchema = new Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  icon: { type: String, default: '🏆' },
  color: { type: String, default: '#f59e0b' },
  category: {
    type: String,
    enum: ['mastery', 'streak', 'completion', 'competition', 'special', 'contribution'],
    default: 'mastery',
  },
  criteria: {
    type: { type: String, enum: ['mission-complete', 'path-complete', 'streak', 'score-threshold', 'competition', 'manual'] },
    threshold: Schema.Types.Mixed,
  },
  competency: { type: Schema.Types.ObjectId, ref: 'Competency', default: null },
  rarity: { type: String, enum: ['common', 'rare', 'epic', 'legendary'], default: 'common' },
  isPublished: { type: Boolean, default: true },
}, { timestamps: true });

export const Badge = mongoose.model('Badge', badgeSchema);
