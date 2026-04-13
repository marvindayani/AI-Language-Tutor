import User from '../models/User.js';
import { 
  generateGrammarLesson, 
  generateStarterFocusAreas, 
  translateCurriculumTopics,
  generateAdaptiveRemedialLesson 
} from '../services/ai.service.js';
import { grammarCurriculum } from '../utils/curriculum.js';

// Get adaptive lesson from mistakes
export const getAdaptiveLesson = async (req, res) => {
  try {
    const { language, level, mistakes } = req.body;
    if (!language || !level || !mistakes) {
      return res.status(400).json({ error: 'Missing language, level, or mistakes data' });
    }

    const lesson = await generateAdaptiveRemedialLesson(language, level, mistakes);
    res.status(200).json({ lesson });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all focus areas
export const getFocusAreas = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const lang = user.language || 'English';
    
    // Filter user's personal focus/progress by active language
    const userAreas = (user.focusAreas || []).filter(fa => fa.language === lang);
    const currentLevel = user.languageLevels ? (user.languageLevels.get(lang) || 1) : 1;
    
    // Fully localize the curriculum syllabus for the UI
    let localizedCurriculum = grammarCurriculum;
    
    if (lang !== 'English') {
      try {
        // Flatten the curriculum values to translate them all in one go
        const allTopics = Object.values(grammarCurriculum).flat();
        const translatedBatch = await translateCurriculumTopics(lang, allTopics);
        
        // Reconstruction: Rebuild the curriculum with translated values
        const newCurriculum = {};
        Object.keys(grammarCurriculum).forEach(level => {
          newCurriculum[level] = grammarCurriculum[level].map(origTopic => {
            const match = translatedBatch.find(t => t.rule === origTopic.rule);
            return {
              ...origTopic,
              displayName: match?.displayName || origTopic.rule,
              displayDescription: match?.displayDescription || origTopic.description
            };
          });
        });
        localizedCurriculum = newCurriculum;
      } catch (err) {
        console.error("Syllabus localization failed:", err);
      }
    }

    res.status(200).json({
      currentLevel,
      focusAreas: userAreas,
      curriculum: localizedCurriculum
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add a new focus area
export const addFocusArea = async (req, res) => {
  try {
    const { rule } = req.body;
    if (!rule) return res.status(400).json({ error: "Rule is required" });

    const user = await User.findById(req.user.id);
    const lang = user.language || 'English';

    // Check if it already exists for THIS language
    const existing = user.focusAreas.find(fa => 
      fa.rule.toLowerCase() === rule.toLowerCase() && 
      fa.language === lang
    );

    if (!existing) {
      user.focusAreas.push({ 
        rule, 
        language: lang,
        masteryScore: 0, 
        isFocused: true, 
        level: 0 
      }); 
    } else {
      existing.isFocused = true; 
    }

    await user.save();
    const currentLevel = user.languageLevels ? (user.languageLevels.get(lang) || 1) : 1;
    res.status(200).json({ 
      focusAreas: user.focusAreas.filter(fa => fa.language === lang), 
      currentLevel 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update status of a focus area (e.g. user toggles focus off)
export const updateFocusAreaStatus = async (req, res) => {
  try {
    const { ruleId, isFocused } = req.body;
    const user = await User.findById(req.user.id);

    const focusArea = user.focusAreas.id(ruleId);
    if (focusArea) {
      focusArea.isFocused = isFocused;
      await user.save();
    }

    res.status(200).json(user.focusAreas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Dynamically generate a grammar lesson
export const generateLesson = async (req, res) => {
  try {
    const { rule } = req.body;
    if (!rule) return res.status(400).json({ error: "Rule is required" });

    const user = await User.findById(req.user.id);

    const lesson = await generateGrammarLesson(user.language, user.level, rule);

    res.status(200).json(lesson);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Generate starter syllabus (Level 1)
export const generateStarterPack = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const lang = user.language || 'English';

    // If they already have Level 1 topics for THIS language, don't re-add
    const hasLevel1 = user.focusAreas.some(fa => fa.level === 1 && fa.language === lang);
    if (hasLevel1) {
      return res.status(400).json({ error: "Level 1 already initialized." });
    }

    const level1Topics = grammarCurriculum[1];
    
    // Translate topics to user's targeted language
    const translatedTopics = await translateCurriculumTopics(lang, level1Topics);

    const newAreas = translatedTopics.map(t => ({
      rule: t.rule,
      displayName: t.displayName || t.rule,
      displayDescription: t.displayDescription || "",
      language: lang,
      level: 1,
      masteryScore: 0,
      isFocused: true
    }));

    user.focusAreas.push(...newAreas);
    
    if (!user.languageLevels) user.languageLevels = new Map();
    user.languageLevels.set(lang, 1);
    
    await user.save();
    
    res.status(200).json({ 
      focusAreas: user.focusAreas.filter(fa => fa.language === lang), 
      currentLevel: 1 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Check if next level should be unlocked
export const checkLevelUnlock = async (userId) => {
  try {
    const user = await User.findById(userId);
    const lang = user.language || 'English';
    const level = user.languageLevels ? (user.languageLevels.get(lang) || 1) : 1;
    const nextLevel = level + 1;

    // Don't unlock if max level reached (e.g. 5)
    if (!grammarCurriculum[nextLevel]) return { unlocked: false };

    // Check if all topics in current level for THIS language have mastery >= 80
    const currentLevelTopics = user.focusAreas.filter(fa => 
      fa.level === level && 
      fa.language === lang
    );
    
    if (currentLevelTopics.length === 0) return { unlocked: false };

    const allMastered = currentLevelTopics.every(fa => fa.masteryScore >= 80);

    if (allMastered) {
      const nextLevelExists = user.focusAreas.some(fa => 
        fa.level === nextLevel && 
        fa.language === lang
      );
      
      if (!nextLevelExists) {
        const nextTopicsBatch = grammarCurriculum[nextLevel];
        const translatedNextBatch = await translateCurriculumTopics(lang, nextTopicsBatch);

        const nextTopics = translatedNextBatch.map(t => ({
          rule: t.rule,
          displayName: t.displayName || t.rule,
          displayDescription: t.displayDescription || "",
          language: lang,
          level: nextLevel,
          masteryScore: 0,
          isFocused: true
        }));
        user.focusAreas.push(...nextTopics);
      }
      
      if (!user.languageLevels) user.languageLevels = new Map();
      user.languageLevels.set(lang, nextLevel);
      await user.save();
      return { unlocked: true, nextLevel };
    }

    return { unlocked: false };
  } catch (error) {
    console.error("Unlock error:", error);
    return { unlocked: false };
  }
};
