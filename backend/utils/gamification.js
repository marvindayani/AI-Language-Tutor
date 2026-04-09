/**
 * Gamification Utility
 * Handles daily streaks and badge logic.
 */

export const updateStreak = (user) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  if (!user.lastActivityDate) {
    user.streakCount = 1;
    user.lastActivityDate = now;
    user.highestStreak = 1;
    return true;
  }

  const lastActivity = new Date(user.lastActivityDate);
  const lastDate = new Date(lastActivity.getFullYear(), lastActivity.getMonth(), lastActivity.getDate());
  
  const diffTime = today - lastDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Already practiced today, keep streak the same
    return false; 
  } 
  
  if (diffDays > 1) {
    // Missed a day (or more), reset streak back to 0
    user.streakCount = 0;
  }

  // Increment streak (either from existing or from reset 0)
  user.streakCount += 1;

  if (user.streakCount > user.highestStreak) {
    user.highestStreak = user.streakCount;
  }

  user.lastActivityDate = now;
  return true;
};

export const checkBadges = (user) => {
  const newBadges = [];
  const currentBadgeNames = user.badges.map(b => b.name);

  const addBadge = (name, icon, description) => {
    if (!currentBadgeNames.includes(name)) {
      newBadges.push({ name, icon, description, dateEarned: new Date() });
    }
  };

  // Instant Reward
  if (user.sessionsCompleted >= 1 || user.quizzesTaken >= 1) {
    addBadge("First Step", "map", "Completed your very first learning activity!");
  }

  // Streak Badges
  if (user.streakCount >= 3) addBadge("3-Day Warrior", "fire", "Completed a practice session 3 days in a row.");
  if (user.streakCount >= 7) addBadge("7-Day Legend", "award", "Completed a practice session for an entire week!");
  if (user.streakCount >= 30) addBadge("Monthly Master", "crown", "Unstoppable! 30 days of consistent learning.");

  // Performance Badges
  if (user.sessionsCompleted >= 10) addBadge("Frequent Flyer", "plane", "Completed 10 practice sessions.");
  if (user.quizzesTaken >= 5) addBadge("Quiz Whiz", "star", "Completed 5 language quizzes.");
  if (user.accuracyRate >= 95 && user.totalQuestionsAnswered >= 20) {
    addBadge("Grammar Guru", "shield-check", "Maintained over 95% accuracy in your studies.");
  }

  if (newBadges.length > 0) {
    user.badges.push(...newBadges);
    return newBadges;
  }
  
  return [];
};
