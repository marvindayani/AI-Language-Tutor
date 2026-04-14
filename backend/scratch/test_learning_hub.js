import { generateGrammarLesson } from '../services/ai.service.js';
import dotenv from 'dotenv';
dotenv.config();

const testLanguages = [
  { lang: 'Hindi', rule: 'Present Continuous Tense' },
  { lang: 'Spanish', rule: 'Por vs Para' },
  { lang: 'French', rule: 'Passé Composé' }
];

async function runTests() {
  console.log("🚀 Starting Learning Hub Quality Analysis...\n");

  for (const test of testLanguages) {
    console.log(`--- Testing Language: ${test.lang} | Rule: ${test.rule} ---`);
    try {
      const lesson = await generateGrammarLesson(test.lang, 'beginner', test.rule);
      
      console.log(`Title: ${lesson.title}`);
      console.log(`Explanation length: ${lesson.explanation.length} chars`);
      console.log(`Tip: ${lesson.tip}`);
      
      // Basic check for English leakage (looking for common English stop words)
      const englishStopWords = /\b(the|is|and|of|in|to|with)\b/gi;
      const titleMatch = lesson.title.match(englishStopWords);
      const explanationMatch = lesson.explanation.match(englishStopWords);
      const tipMatch = lesson.tip.match(englishStopWords);

      if (titleMatch || explanationMatch || tipMatch) {
         console.warn("⚠️ POTENTIAL ENGLISH LEAKAGE DETECTED!");
         if (titleMatch) console.warn(`   Title contains: ${titleMatch}`);
         if (explanationMatch) console.warn(`   Explanation contains: ${explanationMatch}`);
         if (tipMatch) console.warn(`   Tip contains: ${tipMatch}`);
      } else {
         console.log("✅ Language Consistency: PASSED (No obvious English leaked into target fields)");
      }
      
      console.log("Example 1:", lesson.examples[0]);
      console.log("\n");

    } catch (err) {
      console.error(`❌ Error testing ${test.lang}:`, err.message);
    }
  }
}

runTests();
