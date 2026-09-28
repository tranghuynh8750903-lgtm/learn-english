import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Volume2,
  ArrowRight,
  Brain,
  Trophy,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import {
  LearningMode,
  PracticeModule,
  PracticeQuestion,
  TOEICCategory,
  IELTSCategory,
} from '../types';
import { PRACTICE_MODULES } from '../data/seedData';
import {
  generateMistakeDrill,
  generateSkillPracticeQuestions,
  generateWritingOrSpeakingTopic,
  evaluateSpeakingOrWritingPractice,
} from '../services/geminiService';

interface PracticeHubProps {
  learningMode: LearningMode;
  onModeChange: (mode: LearningMode) => void;
  frequentMistakes: string[];
  onCompleteAttempt: (data: {
    mode: LearningMode;
    category: string;
    title: string;
    score: number;
    total: number;
    estimatedBandOrScore: string;
    mistakesLogged: string[];
  }) => Promise<void>;
}

const TOEIC_CATEGORIES: TOEICCategory[] = [
  'Vocabulary',
  'Grammar',
  'Reading',
  'Listening',
  'Mini test',
];

const IELTS_CATEGORIES: IELTSCategory[] = [
  'Listening',
  'Reading',
  'Writing',
  'Speaking',
  'Vocabulary',
  'Grammar',
];

export const PracticeHub: React.FC<PracticeHubProps> = ({
  learningMode,
  onModeChange,
  frequentMistakes,
  onCompleteAttempt,
}) => {
  const categories = learningMode === 'TOEIC' ? TOEIC_CATEGORIES : IELTS_CATEGORIES;
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]);
  const [customAiModule, setCustomAiModule] = useState<PracticeModule | null>(null);
  const [generatedQuestionsByCat, setGeneratedQuestionsByCat] = useState<
    Record<string, PracticeQuestion[]>
  >({});
  const [isGeneratingDrill, setIsGeneratingDrill] = useState(false);
  const [isGeneratingSkillQuiz, setIsGeneratingSkillQuiz] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [submittedQuiz, setSubmittedQuiz] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<string | null>(null);

  // Writing / Speaking interactive state
  const [customTopicTitle, setCustomTopicTitle] = useState('');
  const [cuePoints, setCuePoints] = useState<string[]>([]);
  const [isGeneratingTopic, setIsGeneratingTopic] = useState(false);
  const [userResponseText, setUserResponseText] = useState('');
  const [isEvaluatingResponse, setIsEvaluatingResponse] = useState(false);
  const [responseEvaluation, setResponseEvaluation] = useState<{
    score: string;
    feedbackVi: string;
    improvedVersion: string;
    keyFixes: { wrong: string; right: string; explanation: string }[];
  } | null>(null);

  useEffect(() => {
    const validCategories = learningMode === 'TOEIC' ? TOEIC_CATEGORIES : IELTS_CATEGORIES;
    if (
      selectedCategory !== 'AI Mistake Drill' &&
      !validCategories.includes(selectedCategory as never)
    ) {
      setSelectedCategory(validCategories[0]);
    }
    setSelectedAnswers({});
    setSubmittedQuiz(false);
    setResponseEvaluation(null);
    setUserResponseText('');
    setErrorMsg(null);
  }, [learningMode]);

  const baseModule: PracticeModule | undefined =
    selectedCategory === 'AI Mistake Drill' && customAiModule
      ? customAiModule
      : PRACTICE_MODULES.find(
          (m) => m.mode === learningMode && m.category === selectedCategory
        ) || PRACTICE_MODULES.find((m) => m.mode === learningMode);

  const moduleKey = `${learningMode}-${selectedCategory}`;
  const activeQuestions: PracticeQuestion[] =
    selectedCategory === 'AI Mistake Drill'
      ? customAiModule?.questions || []
      : generatedQuestionsByCat[moduleKey] || [];

  const handleCategoryClick = (cat: string) => {
    setSelectedCategory(cat);
    setSelectedAnswers({});
    setSubmittedQuiz(false);
    setResponseEvaluation(null);
    setUserResponseText('');
    setErrorMsg(null);
  };

  const handleGenerateSkillQuestions = async () => {
    setIsGeneratingSkillQuiz(true);
    setErrorMsg(null);
    setSelectedAnswers({});
    setSubmittedQuiz(false);
    try {
      const qs = await generateSkillPracticeQuestions(learningMode, selectedCategory);
      setGeneratedQuestionsByCat((prev) => ({
        ...prev,
        [moduleKey]: qs,
      }));
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Không thể tạo câu hỏi lúc này.'
      );
    } finally {
      setIsGeneratingSkillQuiz(false);
    }
  };

  const handleGenerateAiDrill = async () => {
    if (frequentMistakes.length === 0) {
      setErrorMsg(
        'Bạn chưa có lỗi nào được ghi nhận. Hãy kiểm tra bài viết của bạn tại mục ✍️ Write trước để AI tổng hợp các lỗi thực tế của bạn!'
      );
      return;
    }
    setIsGeneratingDrill(true);
    setErrorMsg(null);
    setSelectedAnswers({});
    setSubmittedQuiz(false);
    try {
      const questions = await generateMistakeDrill(frequentMistakes, learningMode);
      const newModule: PracticeModule = {
        id: `ai-drill-${Date.now()}`,
        mode: learningMode,
        category: 'AI Mistake Drill',
        title: `🧠 Bài Tập Khắc Phục Lỗi Cá Nhân Hóa (${
          learningMode === 'IELTS' ? 'IELTS 8.0' : 'TOEIC 800+'
        })`,
        subtitle:
          'Được AI tạo trực tiếp từ những lỗi ngữ pháp & từ vựng bạn đã mắc phải.',
        targetBadge:
          learningMode === 'IELTS' ? 'Mục tiêu IELTS 8.0' : 'Mục tiêu TOEIC 800+',
        durationMinutes: 8,
        questions,
      };
      setCustomAiModule(newModule);
      setSelectedCategory('AI Mistake Drill');
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Không thể tạo bài tập lúc này.'
      );
    } finally {
      setIsGeneratingDrill(false);
    }
  };

  const handleGenerateTopic = async () => {
    if (!baseModule) return;
    setIsGeneratingTopic(true);
    setErrorMsg(null);
    try {
      const skillType = baseModule.category === 'Speaking' ? 'Speaking' : 'Writing';
      const res = await generateWritingOrSpeakingTopic(learningMode, skillType);
      setCustomTopicTitle(res.promptTitle);
      setCuePoints(res.sampleCuePoints);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Không thể tạo đề bài lúc này.'
      );
    } finally {
      setIsGeneratingTopic(false);
    }
  };

  const handlePlayAudio = (questionId: string, script: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (isPlayingAudio === questionId) {
      setIsPlayingAudio(null);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(script);
    utterance.lang = 'en-US';
    utterance.rate = 0.96;
    utterance.onend = () => setIsPlayingAudio(null);
    utterance.onerror = () => setIsPlayingAudio(null);
    setIsPlayingAudio(questionId);
    window.speechSynthesis.speak(utterance);
  };

  const handleSubmitQuiz = async () => {
    if (!baseModule || activeQuestions.length === 0) return;
    setSubmittedQuiz(true);
    let correctCount = 0;
    const newMistakes: string[] = [];

    activeQuestions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        correctCount++;
      } else {
        newMistakes.push(q.grammarRule);
      }
    });

    const ratio = correctCount / activeQuestions.length;
    const estimated =
      learningMode === 'IELTS'
        ? ratio >= 0.85
          ? 'Band 8.0'
          : ratio >= 0.65
          ? 'Band 7.0'
          : 'Band 6.0'
        : ratio >= 0.85
        ? '860 / 990'
        : ratio >= 0.65
        ? '785 / 990'
        : '690 / 990';

    await onCompleteAttempt({
      mode: learningMode,
      category: baseModule.category,
      title: baseModule.title,
      score: correctCount,
      total: activeQuestions.length,
      estimatedBandOrScore: estimated,
      mistakesLogged: newMistakes,
    });
  };

  const handleEvaluateWritingOrSpeaking = async () => {
    if (!baseModule?.writingOrSpeakingPrompt || !userResponseText.trim()) return;
    setIsEvaluatingResponse(true);
    setErrorMsg(null);
    try {
      const skillType = baseModule.category === 'Speaking' ? 'Speaking' : 'Writing';
      const result = await evaluateSpeakingOrWritingPractice(
        customTopicTitle || 'Tự chọn',
        userResponseText,
        learningMode,
        skillType
      );
      setResponseEvaluation(result);
      await onCompleteAttempt({
        mode: learningMode,
        category: baseModule.category,
        title: baseModule.title,
        score: 1,
        total: 1,
        estimatedBandOrScore: result.score,
        mistakesLogged: result.keyFixes.map((f) => `${f.wrong} → ${f.right}`),
      });
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Không thể chấm bài lúc này.'
      );
    } finally {
      setIsEvaluatingResponse(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Dual Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E6E1D6] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#6E6A63]">
            <span>📚 Practice Hub</span>
            <span>•</span>
            <span>Luyện tập theo mục tiêu</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#18181B] mt-1">
            Chế độ luyện tập {learningMode === 'TOEIC' ? 'TOEIC 800+' : 'IELTS 8.0'}
          </h1>
          <p className="text-sm text-[#57534E] mt-1">
            AI trực tiếp tạo câu hỏi luyện tập theo kỹ năng hoặc từ những lỗi thực tế của riêng bạn.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="inline-flex rounded-xl border border-[#D6D1C7] p-1 bg-white self-start">
          <button
            type="button"
            onClick={() => onModeChange('TOEIC')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              learningMode === 'TOEIC'
                ? 'bg-[#1E40AF] text-white'
                : 'text-[#57534E] hover:text-[#18181B]'
            }`}
          >
            🎯 TOEIC Mode (800+)
          </button>
          <button
            type="button"
            onClick={() => onModeChange('IELTS')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              learningMode === 'IELTS'
                ? 'bg-[#5B3FD9] text-white'
                : 'text-[#57534E] hover:text-[#18181B]'
            }`}
          >
            🎯 IELTS Mode (8.0)
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Personalized AI Mistake Drill Banner */}
      <div className="bg-white border border-[#E6E1D6] rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-2xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-[#D97706]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#D97706]">
              🧠 AI Tạo Bài Luyện Tập Từ Lỗi Bạn Thường Mắc
            </span>
          </div>
          <p className="text-sm text-[#18181B] font-medium">
            {frequentMistakes.length > 0 ? (
              <>
                Các lỗi thực tế của bạn:{' '}
                <span className="text-[#57534E] font-normal">
                  {frequentMistakes.slice(0, 4).join(' • ')}
                </span>
              </>
            ) : (
              <span className="text-[#57534E] font-normal">
                Chưa có lỗi nào được ghi nhận. Khi bạn kiểm tra bài viết tại mục ✍️ Write hoặc làm bài tập, các lỗi sai của bạn sẽ tự động lưu tại đây.
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={handleGenerateAiDrill}
          disabled={isGeneratingDrill || frequentMistakes.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-bold whitespace-nowrap transition cursor-pointer disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 text-[#FBBF24]" />
          {isGeneratingDrill
            ? 'AI đang tạo câu hỏi từ lỗi của bạn...'
            : 'Tạo bài luyện tập khắc phục lỗi'}
        </button>
      </div>

      {/* Category Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E6E1D6] pb-3">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => handleCategoryClick(cat)}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              selectedCategory === cat
                ? learningMode === 'IELTS'
                  ? 'bg-[#5B3FD9] text-white'
                  : 'bg-[#1E40AF] text-white'
                : 'bg-white border border-[#E6E1D6] text-[#57534E] hover:text-[#18181B]'
            }`}
          >
            {cat}
          </button>
        ))}
        {customAiModule && (
          <button
            type="button"
            onClick={() => handleCategoryClick('AI Mistake Drill')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              selectedCategory === 'AI Mistake Drill'
                ? 'bg-[#D97706] text-white'
                : 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
            }`}
          >
            🧠 Bài tập lỗi cá nhân hóa
          </button>
        )}
      </div>

      {/* Active Module Content */}
      {baseModule && (
        <div className="bg-white border border-[#E6E1D6] rounded-xl p-6 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E6E1D6] pb-4">
            <div>
              <span className="font-mono-code text-xs font-bold px-2.5 py-1 rounded bg-[#F3EFEA] text-[#18181B]">
                {baseModule.targetBadge} • {baseModule.category}
              </span>
              <h2 className="text-xl font-bold text-[#18181B] mt-2">{baseModule.title}</h2>
              <p className="text-sm text-[#57534E] mt-0.5">{baseModule.subtitle}</p>
            </div>
            {!baseModule.writingOrSpeakingPrompt && selectedCategory !== 'AI Mistake Drill' && (
              <button
                type="button"
                onClick={handleGenerateSkillQuestions}
                disabled={isGeneratingSkillQuiz}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-xs font-bold transition cursor-pointer disabled:opacity-50 ${
                  learningMode === 'IELTS'
                    ? 'bg-[#5B3FD9] hover:bg-[#4C32B8]'
                    : 'bg-[#1E40AF] hover:bg-[#1E3A8A]'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                {isGeneratingSkillQuiz
                  ? 'AI đang biên soạn câu hỏi...'
                  : activeQuestions.length > 0
                  ? 'Tạo bộ câu hỏi mới bằng AI'
                  : `🤖 AI Tạo Đề Luyện ${baseModule.category}`}
              </button>
            )}
          </div>

          {/* CASE A: Interactive Writing or Speaking Module (IELTS Writing / Speaking) */}
          {baseModule.writingOrSpeakingPrompt ? (
            <div className="space-y-5">
              <div className="p-4 rounded-lg bg-[#FAF8F5] border border-[#E6E1D6] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#5B3FD9]">
                    Đề bài {baseModule.category} chuẩn IELTS 8.0
                  </span>
                  <button
                    type="button"
                    onClick={handleGenerateTopic}
                    disabled={isGeneratingTopic}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#D6D1C7] hover:bg-[#F3EFEA] text-xs font-bold text-[#18181B] transition cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#5B3FD9]" />
                    {isGeneratingTopic ? 'Đang tạo đề bài...' : 'Nhờ AI tạo đề bài mới'}
                  </button>
                </div>

                <input
                  type="text"
                  value={customTopicTitle}
                  onChange={(e) => setCustomTopicTitle(e.target.value)}
                  placeholder="Nhập đề bài bạn muốn luyện tập hoặc nhấn 'Nhờ AI tạo đề bài mới'..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E6E1D6] bg-white text-sm font-semibold text-[#18181B] focus:outline-none focus:border-[#18181B]"
                />

                {cuePoints.length > 0 && (
                  <ul className="list-disc list-inside text-xs text-[#57534E] space-y-1 pt-1">
                    {cuePoints.map((pt, i) => (
                      <li key={i}>{pt}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6A63]">
                  Bài làm {baseModule.category} của bạn
                </label>
                <textarea
                  rows={5}
                  value={userResponseText}
                  onChange={(e) => setUserResponseText(e.target.value)}
                  placeholder="Nhập đoạn văn hoặc câu trả lời Speaking của bạn tại đây..."
                  className="w-full p-4 rounded-lg border border-[#E6E1D6] bg-[#FAF8F5] text-sm text-[#18181B] leading-relaxed focus:outline-none focus:border-[#18181B]"
                />
              </div>

              <button
                type="button"
                onClick={handleEvaluateWritingOrSpeaking}
                disabled={isEvaluatingResponse || !userResponseText.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#5B3FD9] hover:bg-[#4C32B8] text-white text-sm font-semibold transition cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {isEvaluatingResponse
                  ? 'AI đang chấm điểm & sửa bài...'
                  : `Chấm điểm ${baseModule.category} theo mục tiêu 8.0`}
              </button>

              {responseEvaluation && (
                <div className="p-5 rounded-xl border border-[#E6E1D6] bg-[#FAF8F5] space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E6E1D6] pb-3">
                    <span className="text-sm font-bold text-[#18181B]">
                      Kết quả đánh giá từ AI
                    </span>
                    <span className="font-mono-code text-base font-bold text-[#5B3FD9]">
                      {responseEvaluation.score}
                    </span>
                  </div>
                  <p className="text-sm text-[#18181B] leading-relaxed">
                    {responseEvaluation.feedbackVi}
                  </p>
                  {responseEvaluation.keyFixes.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-[#6E6A63]">
                        Các điểm sửa & nâng cấp quan trọng:
                      </div>
                      {responseEvaluation.keyFixes.map((fix, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg bg-white border border-[#E6E1D6] text-xs space-y-1"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono-code text-[#DC2626] line-through">
                              ❌ {fix.wrong}
                            </span>
                            <ArrowRight className="w-3 h-3 text-[#6E6A63]" />
                            <span className="font-mono-code text-[#059669] font-bold">
                              ✅ {fix.right}
                            </span>
                          </div>
                          <p className="text-[#57534E]">
                            <strong>Explanation:</strong> {fix.explanation}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="p-3.5 rounded-lg bg-white border border-[#E6E1D6] space-y-1">
                    <div className="text-xs font-bold text-[#059669]">
                      ✨ Bản nâng cấp đạt chuẩn Band 8.0:
                    </div>
                    <p className="text-sm text-[#18181B] leading-relaxed">
                      {responseEvaluation.improvedVersion}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : activeQuestions.length === 0 ? (
            <div className="p-10 text-center space-y-4 bg-[#FAF8F5] rounded-xl border border-[#E6E1D6]">
              <p className="text-sm text-[#57534E] max-w-md mx-auto">
                Nhấn nút <strong>"🤖 AI Tạo Đề Luyện {baseModule.category}"</strong> ở góc trên để AI tạo bộ câu hỏi mới nhất sát mục tiêu{' '}
                <strong>{learningMode === 'IELTS' ? 'IELTS 8.0' : 'TOEIC 800+'}</strong>.
              </p>
              <button
                type="button"
                onClick={handleGenerateSkillQuestions}
                disabled={isGeneratingSkillQuiz}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-xs font-bold transition cursor-pointer disabled:opacity-50 ${
                  learningMode === 'IELTS'
                    ? 'bg-[#5B3FD9] hover:bg-[#4C32B8]'
                    : 'bg-[#1E40AF] hover:bg-[#1E3A8A]'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                {isGeneratingSkillQuiz
                  ? 'AI đang tạo câu hỏi...'
                  : `🤖 Bắt đầu tạo câu hỏi ${baseModule.category}`}
              </button>
            </div>
          ) : (
            /* CASE B: Multiple Choice & Pedagogical Explanation Questions */
            <div className="space-y-6">
              {activeQuestions.map((q, index) => {
                const chosen = selectedAnswers[q.id];
                const isCorrect = chosen === q.correctIndex;

                return (
                  <div
                    key={q.id}
                    className="p-5 rounded-xl border border-[#E6E1D6] bg-[#FAF8F5] space-y-4"
                  >
                    {q.contextPassage && (
                      <div className="p-4 rounded-lg bg-white border border-[#E6E1D6] text-xs md:text-sm text-[#18181B] whitespace-pre-line leading-relaxed font-serif">
                        {q.contextPassage}
                      </div>
                    )}

                    {q.audioScript && (
                      <div className="p-3.5 rounded-lg bg-white border border-[#E6E1D6] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => handlePlayAudio(q.id, q.audioScript!)}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#18181B] text-white text-xs font-semibold hover:bg-[#27272A] transition cursor-pointer"
                          >
                            <Volume2 className="w-4 h-4" />
                            {isPlayingAudio === q.id
                              ? 'Đang phát Audio (Nhấn để dừng)'
                              : '▶ Phát Audio bài nghe'}
                          </button>
                          <span className="text-xs text-[#57534E]">
                            Nghe hội thoại và chọn đáp án đúng
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <span className="font-mono-code text-xs font-bold px-2 py-1 rounded bg-white border border-[#E6E1D6] text-[#18181B]">
                        Q{index + 1}
                      </span>
                      <p className="text-base font-semibold text-[#18181B] leading-relaxed">
                        {q.question}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = chosen === optIdx;
                        let btnStyle =
                          'bg-white border-[#E6E1D6] text-[#18181B] hover:border-[#18181B]';

                        if (submittedQuiz) {
                          if (optIdx === q.correctIndex) {
                            btnStyle =
                              'bg-[#ECFDF5] border-[#059669] text-[#059669] font-semibold';
                          } else if (isSelected && optIdx !== q.correctIndex) {
                            btnStyle =
                              'bg-[#FEF2F2] border-[#DC2626] text-[#DC2626] line-through';
                          }
                        } else if (isSelected) {
                          btnStyle =
                            learningMode === 'IELTS'
                              ? 'bg-[#F6F4FF] border-[#5B3FD9] text-[#5B3FD9] font-semibold'
                              : 'bg-[#F0F5FF] border-[#1E40AF] text-[#1E40AF] font-semibold';
                        }

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            disabled={submittedQuiz}
                            onClick={() =>
                              setSelectedAnswers((prev) => ({
                                ...prev,
                                [q.id]: optIdx,
                              }))
                            }
                            className={`text-left px-4 py-3 rounded-lg border text-sm transition flex items-center justify-between gap-2 cursor-pointer ${btnStyle}`}
                          >
                            <span>
                              <strong className="font-mono-code mr-2">
                                {String.fromCharCode(65 + optIdx)}.
                              </strong>
                              {opt}
                            </span>
                            {submittedQuiz && optIdx === q.correctIndex && (
                              <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                            )}
                            {submittedQuiz && isSelected && optIdx !== q.correctIndex && (
                              <XCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {submittedQuiz && (
                      <div className="p-4 rounded-lg bg-white border border-[#E6E1D6] space-y-2 text-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span
                            className={`text-xs font-bold uppercase tracking-wider ${
                              isCorrect ? 'text-[#059669]' : 'text-[#DC2626]'
                            }`}
                          >
                            {isCorrect ? '✓ Chính xác' : '✗ Cần lưu ý lỗi này'} • Quy tắc:{' '}
                            {q.grammarRule}
                          </span>
                        </div>

                        {q.wrongSnippet && q.rightSnippet && (
                          <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                            <span className="font-bold text-[#18181B]">Pattern:</span>
                            <span className="font-mono-code px-2 py-0.5 rounded bg-[#FEF2F2] text-[#DC2626] line-through">
                              ❌ {q.wrongSnippet}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-[#6E6A63]" />
                            <span className="font-mono-code px-2 py-0.5 rounded bg-[#ECFDF5] text-[#059669] font-semibold">
                              ✅ {q.rightSnippet}
                            </span>
                          </div>
                        )}

                        {q.audioScript && (
                          <div className="text-xs text-[#57534E] bg-[#FAF8F5] p-2.5 rounded border border-[#E6E1D6]">
                            <strong>Audio Transcript:</strong> "{q.audioScript}"
                          </div>
                        )}

                        <p className="text-xs md:text-sm text-[#18181B] leading-relaxed">
                          <strong>Explanation:</strong> {q.explanationVi}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                {!submittedQuiz ? (
                  <button
                    type="button"
                    onClick={handleSubmitQuiz}
                    disabled={
                      Object.keys(selectedAnswers).length < activeQuestions.length
                    }
                    className={`px-6 py-3 rounded-lg text-white text-sm font-bold transition cursor-pointer disabled:opacity-50 ${
                      learningMode === 'IELTS'
                        ? 'bg-[#5B3FD9] hover:bg-[#4C32B8]'
                        : 'bg-[#1E40AF] hover:bg-[#1E3A8A]'
                    }`}
                  >
                    Nộp bài & Xem AI giải thích chi tiết (
                    {Object.keys(selectedAnswers).length}/{activeQuestions.length})
                  </button>
                ) : (
                  <div className="flex flex-wrap items-center justify-between w-full gap-4 p-4 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0]">
                    <div className="flex items-center gap-3">
                      <Trophy className="w-6 h-6 text-[#059669]" />
                      <div>
                        <div className="text-sm font-bold text-[#065F46]">
                          Hoàn thành bài luyện tập! Kết quả đã được lưu vào Tiến độ học tập.
                        </div>
                        <div className="text-xs text-[#047857]">
                          Xem kỹ phần giải thích (❌ → ✅) bên trên để không lặp lại lỗi sai.
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAnswers({});
                        setSubmittedQuiz(false);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-[#059669] text-xs font-bold text-[#059669] hover:bg-[#F0FDF4] transition cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Làm lại bài này
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
