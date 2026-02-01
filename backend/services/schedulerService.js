const StudySession = require('../models/StudySession');
const Progress = require('../models/Progress');
const Material = require('../models/Material');

/**
 * Scheduler Service
 * Implements spaced repetition (SM-2 Algorithm) and intelligent scheduling
 */

class SchedulerService {

  /**
   * Generate study schedule for next N days
   */
  async generateSchedule(userId, days = 7) {
    try {
      // Get user's materials and progress
      const materials = await Material.find({ user: userId });
      const weakTopics = await Progress.identifyGaps(userId);
      
      // Get existing sessions to avoid conflicts
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + days);

      const existingSessions = await StudySession.find({
        user: userId,
        scheduledDate: { $gte: startDate, $lte: endDate }
      });

      // Calculate daily study allocation
      const schedule = [];
      
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        
        const daySessions = await this.planDay(
          userId,
          date,
          materials,
          weakTopics,
          existingSessions.filter(s => 
            s.scheduledDate.toDateString() === date.toDateString()
          )
        );
        
        schedule.push({
          date: date,
          sessions: daySessions
        });
      }

      return schedule;
    } catch (error) {
      console.error('Schedule generation error:', error);
      throw error;
    }
  }

  /**
   * Plan sessions for a single day
   */
  async planDay(userId, date, materials, weakTopics, existingSessions) {
    const sessions = [];
    const user = await require('../models/User').findById(userId);
    
    // Get available study time for this day
    const dailyStudyTime = user.studyGoals?.dailyStudyTime || 120; // minutes
    let remainingTime = dailyStudyTime;

    // Already scheduled time
    const scheduledTime = existingSessions.reduce(
      (sum, s) => sum + s.scheduledDuration, 0
    );
    remainingTime -= scheduledTime;

    if (remainingTime <= 0) {
      return existingSessions;
    }

    // Priority 1: Review overdue flashcards (spaced repetition)
    const dueReviews = await this.getDueReviews(userId, date);
    for (const review of dueReviews) {
      if (remainingTime < 15) break; // Minimum session time
      
      const duration = Math.min(30, remainingTime);
      sessions.push({
        type: 'flashcards',
        material: review.materialId,
        subject: review.subject,
        topic: review.topic,
        duration: duration,
        priority: 'high',
        reason: 'Spaced repetition review'
      });
      remainingTime -= duration;
    }

    // Priority 2: Practice weak topics
    for (const weak of weakTopics.slice(0, 3)) {
      if (remainingTime < 20) break;
      
      const duration = Math.min(45, remainingTime);
      const material = materials.find(
        m => m.subject === weak.subject && m.topic === weak.topic
      );
      
      if (material) {
        sessions.push({
          type: 'practice',
          material: material._id,
          subject: weak.subject,
          topic: weak.topic,
          duration: duration,
          priority: 'high',
          reason: `Weak area: ${weak.avgAccuracy}% accuracy`
        });
        remainingTime -= duration;
      }
    }

    // Priority 3: Regular study sessions
    const unscheduledMaterials = materials.filter(m => {
      const hasSession = sessions.some(s => 
        s.material && s.material.toString() === m._id.toString()
      );
      return !hasSession && (!m.lastStudied || this.daysSince(m.lastStudied) > 3);
    });

    for (const material of unscheduledMaterials) {
      if (remainingTime < 20) break;
      
      const duration = Math.min(material.metadata?.estimatedReadTime || 30, remainingTime);
      sessions.push({
        type: 'reading',
        material: material._id,
        subject: material.subject,
        topic: material.topic,
        duration: duration,
        priority: 'medium',
        reason: 'Regular study session'
      });
      remainingTime -= duration;
    }

    return sessions;
  }

  /**
   * Get materials/flashcards due for review
   */
  async getDueReviews(userId, date) {
    const materials = await Material.find({
      user: userId,
      'flashcards.nextReview': { $lte: date }
    }).select('subject topic flashcards');

    return materials.map(m => ({
      materialId: m._id,
      subject: m.subject,
      topic: m.topic,
      dueCount: m.flashcards.filter(f => 
        !f.nextReview || f.nextReview <= date
      ).length
    })).filter(r => r.dueCount > 0);
  }

  /**
   * Calculate next review date using SM-2 algorithm
   * @param {number} quality - Response quality (0-5)
   * @param {number} repetitions - Number of successful repetitions
   * @param {number} interval - Current interval in days
   * @param {number} easeFactor - Current ease factor
   */
  calculateNextReview(quality, repetitions = 0, interval = 1, easeFactor = 2.5) {
    let newRepetitions = repetitions;
    let newInterval = interval;
    let newEaseFactor = easeFactor;

    if (quality < 3) {
      // Failed recall - reset
      newRepetitions = 0;
      newInterval = 1;
    } else {
      // Successful recall
      if (repetitions === 0) {
        newInterval = 1;
      } else if (repetitions === 1) {
        newInterval = 6;
      } else {
        newInterval = Math.round(interval * easeFactor);
      }
      newRepetitions = repetitions + 1;
    }

    // Update ease factor
    newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    
    // Ensure ease factor doesn't go below 1.3
    if (newEaseFactor < 1.3) {
      newEaseFactor = 1.3;
    }

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

    return {
      nextReview: nextReviewDate,
      interval: newInterval,
      repetitions: newRepetitions,
      easeFactor: newEaseFactor
    };
  }

  /**
   * Adjust schedule based on missed sessions
   */
  async handleMissedSession(sessionId) {
    const session = await StudySession.findById(sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }

    // Mark as missed
    session.status = 'missed';
    await session.save();

    // Reschedule with higher priority
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    const rescheduled = new StudySession({
      user: session.user,
      material: session.material,
      subject: session.subject,
      topic: session.topic,
      scheduledDate: tomorrow,
      scheduledDuration: session.scheduledDuration,
      type: session.type,
      status: 'scheduled',
      repetitionNumber: session.repetitionNumber,
      interval: session.interval,
      easeFactor: Math.max(session.easeFactor - 0.2, 1.3) // Reduce ease factor
    });

    await rescheduled.save();
    return rescheduled;
  }

  /**
   * Get study streak information
   */
  async getStreak(userId) {
    const sessions = await StudySession.find({
      user: userId,
      status: 'completed'
    }).sort({ scheduledDate: -1 });

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate = null;

    for (const session of sessions.reverse()) {
      const sessionDate = new Date(session.scheduledDate);
      sessionDate.setHours(0, 0, 0, 0);

      if (!lastDate) {
        tempStreak = 1;
      } else {
        const dayDiff = Math.floor((lastDate - sessionDate) / (1000 * 60 * 60 * 24));
        if (dayDiff === 1) {
          tempStreak++;
        } else if (dayDiff > 1) {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }

      lastDate = sessionDate;
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    // Check if streak is current (studied today or yesterday)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastDate && (lastDate.getTime() === today.getTime() || lastDate.getTime() === yesterday.getTime())) {
      currentStreak = tempStreak;
    }

    return { currentStreak, longestStreak };
  }

  /**
   * Helper: Calculate days since a date
   */
  daysSince(date) {
    const now = new Date();
    const past = new Date(date);
    const diffTime = Math.abs(now - past);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get optimal study times based on user performance
   */
  async getOptimalStudyTimes(userId) {
    const sessions = await StudySession.find({
      user: userId,
      status: 'completed',
      productivity: { $exists: true }
    });

    const hourPerformance = {};

    sessions.forEach(session => {
      const hour = new Date(session.actualStartTime).getHours();
      if (!hourPerformance[hour]) {
        hourPerformance[hour] = { total: 0, count: 0 };
      }
      hourPerformance[hour].total += session.productivity;
      hourPerformance[hour].count += 1;
    });

    const optimalHours = Object.entries(hourPerformance)
      .map(([hour, data]) => ({
        hour: parseInt(hour),
        avgProductivity: data.total / data.count
      }))
      .sort((a, b) => b.avgProductivity - a.avgProductivity)
      .slice(0, 3);

    return optimalHours;
  }
}

module.exports = new SchedulerService();
