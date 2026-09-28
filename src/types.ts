export type LearningMode = 'TOEIC' | 'IELTS';

export type NavSection = 'home' | 'write' | 'practice' | 'saved' | 'notifications' | 'profile';

export interface AICorrectionItem {
  category: 'Grammar' | 'Vocabulary' | 'Collocation' | 'Structure';
  wrong: string;
  right: string;
  originalSentence: string;
  correctSentence: string;
  explanation: string;
}

export interface VocabularyUpgradeItem {
  basicWord: string;
  advancedWord: string;
  level: string;
  meaningVi: string;
  exampleSentence: string;
}

export interface CriterionScore {
  name: string;
  score: string;
  commentVi: string;
}

export interface AIFeedbackResult {
  overallScore: string;
  targetComparison: string;
  summaryFeedback: string;
  correctedFullText: string;
  upgradedVersion: string;
  criteriaScores: CriterionScore[];
  corrections: AICorrectionItem[];
  vocabularyUpgrades: VocabularyUpgradeItem[];
  detectedWeaknessTags: string[];
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorTarget: string;
  title: string;
  content: string;
  mode: LearningMode;
  topicTag: string;
  aiScore: string;
  aiSummary?: string;
  aiCorrectionsJson?: string;
  likesCount: number;
  likedBy: string[];
  savedBy: string[];
  commentsCount: number;
  featured?: boolean;
  createdAt: string;
}

export interface CommentItem {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  aiSuggestion?: string;
  createdAt: string;
}

export interface PracticeQuestion {
  id: string;
  question: string;
  contextPassage?: string;
  audioScript?: string;
  options: string[];
  correctIndex: number;
  wrongSnippet?: string;
  rightSnippet?: string;
  explanationVi: string;
  grammarRule: string;
}

export type TOEICCategory = 'Vocabulary' | 'Grammar' | 'Reading' | 'Listening' | 'Mini test';
export type IELTSCategory = 'Listening' | 'Reading' | 'Writing' | 'Speaking' | 'Vocabulary' | 'Grammar';

export interface PracticeModule {
  id: string;
  mode: LearningMode;
  category: TOEICCategory | IELTSCategory | 'AI Mistake Drill';
  title: string;
  subtitle: string;
  targetBadge: string;
  durationMinutes: number;
  questions: PracticeQuestion[];
  writingOrSpeakingPrompt?: {
    promptTitle: string;
    instructions: string;
    sampleCuePoints: string[];
    modelAnswer: string;
  };
}

export interface PracticeAttempt {
  id: string;
  userId: string;
  mode: LearningMode;
  category: string;
  title: string;
  score: number;
  total: number;
  estimatedBandOrScore: string;
  mistakesLogged: string[];
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  bio: string;
  learningMode: LearningMode;
  targetScore: string;
  streakDays: number;
  xp: number;
  frequentMistakes: string[];
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  recipientId: string;
  actorName: string;
  actorAvatar: string;
  type: 'like' | 'comment' | 'ai_feedback' | 'milestone';
  postTitle?: string;
  message: string;
  read: boolean;
  createdAt: string;
}
