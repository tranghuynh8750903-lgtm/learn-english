import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Award,
  Send,
  Wand2,
  ArrowRight,
  RotateCcw,
  FileText,
  Layers,
} from 'lucide-react';
import { AIFeedbackResult, LearningMode } from '../types';
import { analyzeEnglishWriting } from '../services/geminiService';

interface WriteStudioProps {
  learningMode: LearningMode;
  onModeChange: (mode: LearningMode) => void;
  onPublishPost: (data: {
    title: string;
    content: string;
    mode: LearningMode;
    topicTag: string;
    aiResult: AIFeedbackResult | null;
  }) => Promise<void>;
  onRecordMistakes: (mistakes: string[]) => void;
  initialDraft?: { title: string; content: string; topicTag: string } | null;
}

const SAMPLE_PROMPTS = [
  {
    label: 'Ví dụ kinh điển: "many reason"',
    mode: 'IELTS' as LearningMode,
    title: 'My Motivation for Learning English',
    topicTag: 'Personal Essay',
    content:
      'I have many reason to learn English. First, it helps me communicating with international colleagues at work. Second, most scientific research papers is published in English, so reading them directly give me a huge advantage.',
  },
  {
    label: 'Mẫu Email TOEIC 800+',
    mode: 'TOEIC' as LearningMode,
    title: 'Follow-up on Quarterly Supply Schedule',
    topicTag: 'Business Email',
    content:
      'Dear Ms. Carter, I am writing to inform you about the delay of our shipment. Please find attached the revise schedule. We look forward to hear from you soon regarding the new delivery date.',
  },
  {
    label: 'Mẫu IELTS Writing Task 2',
    mode: 'IELTS' as LearningMode,
    title: 'The Impact of Remote Work on Productivity',
    topicTag: 'IELTS Task 2',
    content:
      'In recent years, working from home has become very popular in many countries. Despite it brings flexibility for employees, some managers argue that remote work reduces team cohesion and innovation.',
  },
];

export const WriteStudio: React.FC<WriteStudioProps> = ({
  learningMode,
  onModeChange,
  onPublishPost,
  onRecordMistakes,
  initialDraft,
}) => {
  const [title, setTitle] = useState(
    initialDraft?.title || 'My Motivation for Learning English'
  );
  const [topicTag, setTopicTag] = useState(initialDraft?.topicTag || 'General Writing');
  const [content, setContent] = useState(
    initialDraft?.content ||
      'I have many reason to learn English. First, it helps me communicating with international colleagues at work. Second, most scientific research papers is published in English, so reading them directly give me a huge advantage.'
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'grammar' | 'vocabulary' | 'rubric'>('all');

  // Pre-populate with the pedagogical analysis of the default sample so the user immediately sees the rich inspection studio
  const [aiResult, setAiResult] = useState<AIFeedbackResult | null>({
    overallScore: learningMode === 'IELTS' ? '6.5 / 9.0' : '775 / 990',
    targetComparison:
      learningMode === 'IELTS'
        ? 'Cách mục tiêu IELTS 8.0: +1.5 band (Cần khắc phục lỗi danh từ số nhiều & chia động từ)'
        : 'Cách mục tiêu TOEIC 800+: +25 điểm (Cần chính xác hóa dạng từ & danh từ đếm được)',
    summaryFeedback:
      'Bài viết có bố cục 2 luận điểm mạch lạc (First, Second). Tuy nhiên bạn mất điểm đáng tiếc ở 4 lỗi ngữ pháp nền tảng: danh từ đếm được sau "many", cấu trúc "help + O + V", và sự hòa hợp giữa chủ ngữ - động từ. Xem chi tiết từng lỗi bên dưới để hiểu rõ nguyên nhân và cách nâng cấp lên mức điểm mục tiêu.',
    correctedFullText:
      'I have many reasons to learn English. First, it helps me communicate with international colleagues at work. Second, most scientific research papers are published in English, so reading them directly gives me a huge advantage.',
    upgradedVersion:
      'There are numerous compelling reasons why I am committed to mastering English. Foremost, proficiency in the language enables seamless communication with international counterparts in the workplace. Furthermore, since the vast majority of peer-reviewed scientific literature is published in English, consulting these primary sources directly confers a distinct competitive advantage.',
    criteriaScores:
      learningMode === 'IELTS'
        ? [
            { name: 'Task Response', score: '7.0', commentVi: 'Luận điểm rõ ràng, có dẫn chứng thực tế cho việc học tiếng Anh.' },
            { name: 'Coherence & Cohesion', score: '7.0', commentVi: 'Sử dụng từ nối First, Second, so hợp lý; có thể nâng cấp lên Foremost, Furthermore.' },
            { name: 'Lexical Resource', score: '6.5', commentVi: 'Có cụm "scientific research papers" tốt, nhưng "many", "huge advantage" còn cơ bản.' },
            { name: 'Grammatical Range & Accuracy', score: '5.5', commentVi: 'Mắc lỗi số nhiều sau "many" và chia động từ to-be / V-s.' },
          ]
        : [
            { name: 'Grammar Accuracy', score: '730', commentVi: 'Cần sửa lỗi "many reason", "helps me communicating", "papers is".' },
            { name: 'Workplace Vocabulary', score: '810', commentVi: 'Sử dụng tốt cụm "international colleagues at work".' },
            { name: 'Clarity & Conciseness', score: '820', commentVi: 'Ý văn súc tích, dễ hiểu trong ngữ cảnh công việc.' },
            { name: 'Tone & Register', score: '760', commentVi: 'Có thể nâng cấp sang văn phong chuyên nghiệp hơn.' },
          ],
    corrections: [
      {
        category: 'Grammar',
        wrong: 'reason',
        right: 'reasons',
        originalSentence: 'I have many reason to learn English.',
        correctSentence: 'I have many reasons to learn English.',
        explanation: 'Sau many cần danh từ đếm được ở dạng số nhiều (plural countable noun).',
      },
      {
        category: 'Grammar',
        wrong: 'communicating',
        right: 'communicate',
        originalSentence: 'First, it helps me communicating with international colleagues at work.',
        correctSentence: 'First, it helps me communicate with international colleagues at work.',
        explanation: 'Cấu trúc chuẩn: "help + somebody + V (nguyên mẫu)" hoặc "to V", không dùng V-ing.',
      },
      {
        category: 'Grammar',
        wrong: 'papers is published',
        right: 'papers are published',
        originalSentence: 'Second, most scientific research papers is published in English...',
        correctSentence: 'Second, most scientific research papers are published in English...',
        explanation: 'Chủ ngữ "papers" là danh từ số nhiều nên động từ to-be phải chia là "are".',
      },
      {
        category: 'Grammar',
        wrong: 'reading them directly give',
        right: 'reading them directly gives',
        originalSentence: '...so reading them directly give me a huge advantage.',
        correctSentence: '...so reading them directly gives me a huge advantage.',
        explanation: 'Chủ ngữ bắt đầu bằng danh động từ (V-ing: "reading them directly") luôn chia động từ ở ngôi thứ 3 số ít ("gives").',
      },
    ],
    vocabularyUpgrades: [
      {
        basicWord: 'many reasons',
        advancedWord: 'numerous compelling reasons',
        level: learningMode === 'IELTS' ? 'IELTS 8.0' : 'TOEIC 850+',
        meaningVi: 'nhiều lý do thuyết phục',
        exampleSentence: 'There are numerous compelling reasons to master business English.',
      },
      {
        basicWord: 'huge advantage',
        advancedWord: 'distinct competitive edge',
        level: learningMode === 'IELTS' ? 'IELTS 8.0' : 'TOEIC 850+',
        meaningVi: 'lợi thế cạnh tranh vượt trội',
        exampleSentence: 'Bilingual professionals possess a distinct competitive edge in global markets.',
      },
    ],
    detectedWeaknessTags: [
      'Danh từ số nhiều sau lượng từ (many/several)',
      'Cấu trúc động từ theo sau "help" (Verb Pattern)',
      'Sự hòa hợp chủ ngữ - động từ (Subject-Verb Agreement)',
    ],
  });

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  const handleAnalyze = async () => {
    if (!content.trim()) return;
    setIsAnalyzing(true);
    setPublishSuccess(false);
    try {
      const result = await analyzeEnglishWriting(content, title, learningMode, topicTag);
      setAiResult(result);
      if (result.detectedWeaknessTags?.length) {
        onRecordMistakes(result.detectedWeaknessTags);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePublish = async () => {
    if (!content.trim() || !title.trim()) return;
    setIsPublishing(true);
    try {
      let currentAi = aiResult;
      if (!currentAi) {
        currentAi = await analyzeEnglishWriting(content, title, learningMode, topicTag);
        setAiResult(currentAi);
      }
      await onPublishPost({
        title: title.trim(),
        content: content.trim(),
        mode: learningMode,
        topicTag,
        aiResult: currentAi,
      });
      setPublishSuccess(true);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleLoadSample = (sample: (typeof SAMPLE_PROMPTS)[0]) => {
    setTitle(sample.title);
    setTopicTag(sample.topicTag);
    setContent(sample.content);
    onModeChange(sample.mode);
    setPublishSuccess(false);
  };

  const filteredCorrections =
    aiResult?.corrections.filter((item) => {
      if (activeTab === 'all') return true;
      if (activeTab === 'grammar') return item.category === 'Grammar' || item.category === 'Structure';
      if (activeTab === 'vocabulary') return item.category === 'Vocabulary' || item.category === 'Collocation';
      return true;
    }) || [];

  return (
    <div className="space-y-6">
      {/* Studio Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E6E1D6] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#6E6A63]">
            <span>✍️ Write & AI Inspection Studio</span>
            <span>•</span>
            <span className={learningMode === 'IELTS' ? 'text-[#5B3FD9]' : 'text-[#1E40AF]'}>
              Chế độ {learningMode === 'IELTS' ? 'IELTS 8.0' : 'TOEIC 800+'}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#18181B] mt-1">
            Viết bài & Sửa lỗi tiếng Anh chuyên sâu
          </h1>
          <p className="text-sm text-[#57534E] mt-1">
            AI không chỉ chấm điểm mà còn phân tích rõ <span className="font-semibold text-[#18181B]">vì sao câu văn sai</span>, cách sửa đúng và cách nâng cấp từ vựng đạt mục tiêu.
          </p>
        </div>

        {/* Sample Loaders */}
        <div className="flex flex-wrap items-center gap-2">
          {SAMPLE_PROMPTS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleLoadSample(sample)}
              className="text-xs px-3 py-1.5 rounded-md border border-[#D6D1C7] bg-white hover:bg-[#F3EFEA] text-[#18181B] font-medium transition cursor-pointer"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>

      {/* Split-Pane Studio: Left Editor | Right AI Pedagogical Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANE: Writing Editor (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-[#E6E1D6] rounded-xl p-5 md:p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#6E6A63]">
                Mục tiêu chấm:
              </span>
              <div className="inline-flex rounded-lg border border-[#E6E1D6] p-0.5 bg-[#FAF8F5]">
                <button
                  type="button"
                  onClick={() => onModeChange('TOEIC')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                    learningMode === 'TOEIC'
                      ? 'bg-[#1E40AF] text-white'
                      : 'text-[#57534E] hover:text-[#18181B]'
                  }`}
                >
                  TOEIC 800+
                </button>
                <button
                  type="button"
                  onClick={() => onModeChange('IELTS')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                    learningMode === 'IELTS'
                      ? 'bg-[#5B3FD9] text-white'
                      : 'text-[#57534E] hover:text-[#18181B]'
                  }`}
                >
                  IELTS 8.0
                </button>
              </div>
            </div>

            <select
              value={topicTag}
              onChange={(e) => setTopicTag(e.target.value)}
              className="text-xs font-medium bg-[#FAF8F5] border border-[#E6E1D6] rounded-md px-2.5 py-1.5 text-[#18181B] focus:outline-none"
            >
              <option value="General Writing">Chủ đề: General Writing</option>
              <option value="IELTS Task 2">Chủ đề: IELTS Writing Task 2</option>
              <option value="IELTS Task 1">Chủ đề: IELTS Writing Task 1</option>
              <option value="Business Email">Chủ đề: TOEIC Business Email</option>
              <option value="Workplace Proposal">Chủ đề: Workplace Proposal</option>
              <option value="Daily Reflection">Chủ đề: Daily Reflection</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#6E6A63] mb-1.5">
              Tiêu đề bài viết
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề bài viết tiếng Anh của bạn..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E6E1D6] bg-[#FAF8F5] text-[#18181B] font-semibold focus:outline-none focus:border-[#18181B] transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#6E6A63]">
                Nội dung tiếng Anh
              </label>
              <span className="font-mono-code text-xs text-[#6E6A63]">
                {wordCount} words
              </span>
            </div>
            <textarea
              rows={9}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Ví dụ: I have many reason to learn English..."
              className="w-full p-4 rounded-lg border border-[#E6E1D6] bg-[#FAF8F5] text-[#18181B] text-base leading-relaxed focus:outline-none focus:border-[#18181B] transition resize-y"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E6E1D6]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isAnalyzing || !content.trim()}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm text-white transition cursor-pointer disabled:opacity-50 ${
                  learningMode === 'IELTS'
                    ? 'bg-[#5B3FD9] hover:bg-[#4C32B8]'
                    : 'bg-[#1E40AF] hover:bg-[#1E3A8A]'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                {isAnalyzing ? 'AI đang chấm & giải thích lỗi...' : '🤖 AI Kiểm tra & Sửa bài'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setContent('');
                  setTitle('');
                  setAiResult(null);
                  setPublishSuccess(false);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-[#E6E1D6] text-xs font-semibold text-[#57534E] hover:text-[#18181B] hover:bg-[#F3EFEA] transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Làm mới
              </button>
            </div>

            <button
              type="button"
              onClick={handlePublish}
              disabled={isPublishing || !content.trim() || !title.trim()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#18181B] hover:bg-[#27272A] text-white font-semibold text-sm transition cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {isPublishing ? 'Đang đăng...' : 'Đăng lên Cộng đồng'}
            </button>
          </div>

          {publishSuccess && (
            <div className="p-3 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] text-xs font-medium flex items-center justify-between">
              <span>🎉 Đã đăng bài viết kèm phân tích AI lên bảng tin cộng đồng EnglishHub!</span>
            </div>
          )}
        </div>

        {/* RIGHT PANE: AI Pedagogical Inspector (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {!aiResult ? (
            <div className="bg-white border border-[#E6E1D6] rounded-xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#F3EFEA] text-[#18181B] flex items-center justify-center mx-auto">
                <Wand2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#18181B]">
                Sẵn sàng kiểm tra ngữ pháp & từ vựng
              </h3>
              <p className="text-sm text-[#57534E] max-w-md mx-auto">
                Nhấn <strong>"🤖 AI Kiểm tra & Sửa bài"</strong> để xem chi tiết từng lỗi sai (❌ → ✅), câu viết lại chuẩn và giải thích tiếng Việt vì sao cần sửa.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-[#E6E1D6] rounded-xl overflow-hidden shadow-xs">
              {/* Score Header Banner */}
              <div
                className={`p-5 border-b border-[#E6E1D6] flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  learningMode === 'IELTS' ? 'bg-[#F6F4FF]' : 'bg-[#F0F5FF]'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#57534E]">
                    Đánh giá theo chuẩn {learningMode === 'IELTS' ? 'IELTS 8.0' : 'TOEIC 800+'}
                  </div>
                  <div className="text-sm font-medium text-[#18181B] mt-1">
                    {aiResult.targetComparison}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 rounded-lg bg-white border border-[#E6E1D6] text-right">
                    <div className="text-[11px] uppercase tracking-wider font-semibold text-[#6E6A63]">
                      Điểm AI ước tính
                    </div>
                    <div
                      className={`font-mono-code text-xl font-bold ${
                        learningMode === 'IELTS' ? 'text-[#5B3FD9]' : 'text-[#1E40AF]'
                      }`}
                    >
                      {aiResult.overallScore}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub-navigation inside AI Inspector */}
              <div className="flex border-b border-[#E6E1D6] bg-[#FAF8F5] px-4 pt-2 gap-2 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition cursor-pointer whitespace-nowrap ${
                    activeTab === 'all'
                      ? 'border-[#18181B] text-[#18181B]'
                      : 'border-transparent text-[#6E6A63] hover:text-[#18181B]'
                  }`}
                >
                  AI Kiểm tra ({aiResult.corrections.length} lỗi)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('grammar')}
                  className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition cursor-pointer whitespace-nowrap ${
                    activeTab === 'grammar'
                      ? 'border-[#18181B] text-[#18181B]'
                      : 'border-transparent text-[#6E6A63] hover:text-[#18181B]'
                  }`}
                >
                  Grammar ({aiResult.corrections.filter((c) => c.category === 'Grammar' || c.category === 'Structure').length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('vocabulary')}
                  className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition cursor-pointer whitespace-nowrap ${
                    activeTab === 'vocabulary'
                      ? 'border-[#18181B] text-[#18181B]'
                      : 'border-transparent text-[#6E6A63] hover:text-[#18181B]'
                  }`}
                >
                  Vocabulary ({aiResult.vocabularyUpgrades.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('rubric')}
                  className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition cursor-pointer whitespace-nowrap ${
                    activeTab === 'rubric'
                      ? 'border-[#18181B] text-[#18181B]'
                      : 'border-transparent text-[#6E6A63] hover:text-[#18181B]'
                  }`}
                >
                  {learningMode} Feedback
                </button>
              </div>

              <div className="p-5 space-y-5 max-h-[680px] overflow-y-auto">
                {/* Summary diagnosis */}
                <div className="p-3.5 rounded-lg bg-[#FAF8F5] border border-[#E6E1D6] text-sm text-[#18181B] leading-relaxed">
                  <span className="font-semibold">Nhận xét tổng quan: </span>
                  {aiResult.summaryFeedback}
                </div>

                {/* Pedagogical Line-by-Line Corrections (Exact format requested by user) */}
                {(activeTab === 'all' || activeTab === 'grammar') && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#6E6A63]">
                        Chi tiết lỗi sai & Giải thích vì sao cần sửa
                      </h3>
                      <button
                        type="button"
                        onClick={() => setContent(aiResult.correctedFullText)}
                        className="text-xs font-semibold text-[#059669] hover:underline cursor-pointer"
                      >
                        Áp dụng toàn bộ bản sửa vào khung viết →
                      </button>
                    </div>

                    {filteredCorrections.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-lg border border-[#E6E1D6] bg-white space-y-2 shadow-2xs"
                      >
                        {/* Line 1: Grammar: ❌ reason → reasons */}
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="font-bold text-[#18181B]">{item.category}:</span>
                          <span className="font-mono-code px-2 py-0.5 rounded bg-[#FEF2F2] text-[#DC2626] line-through font-medium">
                            ❌ {item.wrong}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#6E6A63]" />
                          <span className="font-mono-code px-2 py-0.5 rounded bg-[#ECFDF5] text-[#059669] font-semibold">
                            {item.right}
                          </span>
                        </div>

                        {/* Line 2: Correct: I have many reasons to learn English. */}
                        <div className="text-sm text-[#18181B] bg-[#FAF8F5] px-3 py-2 rounded border-l-3 border-[#059669]">
                          <span className="font-bold text-[#059669]">Correct: </span>
                          <span className="font-medium">{item.correctSentence}</span>
                        </div>

                        {/* Line 3: Explanation: Sau many cần danh từ số nhiều. */}
                        <div className="text-sm text-[#57534E] leading-relaxed">
                          <span className="font-bold text-[#18181B]">Explanation: </span>
                          {item.explanation}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Vocabulary Upgrades */}
                {(activeTab === 'all' || activeTab === 'vocabulary') &&
                  aiResult.vocabularyUpgrades.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#6E6A63]">
                        Nâng cấp Từ vựng & Collocations ({learningMode === 'IELTS' ? 'Band 8.0' : 'TOEIC 800+'})
                      </h3>
                      <div className="grid grid-cols-1 gap-3">
                        {aiResult.vocabularyUpgrades.map((voc, i) => (
                          <div
                            key={i}
                            className="p-3.5 rounded-lg border border-[#E6E1D6] bg-[#FAF8F5] space-y-1.5"
                          >
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-[#6E6A63] line-through">{voc.basicWord}</span>
                                <ArrowRight className="w-3.5 h-3.5 text-[#6E6A63]" />
                                <span className="font-bold text-[#5B3FD9]">{voc.advancedWord}</span>
                              </div>
                              <span className="font-mono-code text-[11px] px-2 py-0.5 rounded bg-white border border-[#E6E1D6] font-semibold text-[#18181B]">
                                {voc.level}
                              </span>
                            </div>
                            <p className="text-xs text-[#57534E]">
                              <strong>Nghĩa:</strong> {voc.meaningVi}
                            </p>
                            <p className="text-xs italic text-[#18181B]">
                              "{voc.exampleSentence}"
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Rubric & Upgraded Version */}
                {(activeTab === 'all' || activeTab === 'rubric') && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#6E6A63]">
                      Bảng chấm điểm chi tiết ({learningMode})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {aiResult.criteriaScores.map((crit, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-lg border border-[#E6E1D6] bg-white space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#18181B]">{crit.name}</span>
                            <span className="font-mono-code text-xs font-bold px-2 py-0.5 rounded bg-[#F3EFEA] text-[#18181B]">
                              {crit.score}
                            </span>
                          </div>
                          <p className="text-xs text-[#57534E] leading-relaxed">{crit.commentVi}</p>
                        </div>
                      ))}
                    </div>

                    {/* Full Upgraded Version */}
                    <div className="p-4 rounded-lg border border-[#D6D1C7] bg-[#FAF8F5] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#5B3FD9]">
                          ✨ Phiên bản nâng cấp chuẩn {learningMode === 'IELTS' ? 'IELTS 8.0' : 'TOEIC 850+'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setContent(aiResult.upgradedVersion)}
                          className="text-xs font-semibold text-[#5B3FD9] hover:underline cursor-pointer"
                        >
                          Thay bằng bản nâng cấp
                        </button>
                      </div>
                      <p className="text-sm text-[#18181B] leading-relaxed">
                        {aiResult.upgradedVersion}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
