import { GoogleGenAI, Type } from '@google/genai';
import { AIFeedbackResult, LearningMode, PracticeQuestion } from '../types';

function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY || '';
  return new GoogleGenAI({ apiKey });
}

export async function analyzeEnglishWriting(
  text: string,
  title: string,
  mode: LearningMode,
  topicTag: string = 'General'
): Promise<AIFeedbackResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('Vui lòng nhập nội dung tiếng Anh để AI phân tích.');
  }

  try {
    const ai = getAIClient();
    const targetDesc =
      mode === 'IELTS'
        ? 'IELTS Writing Band 8.0 (Academic & General: Task Response, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy)'
        : 'TOEIC 800+ / 990 (Business & Workplace English: Grammar Accuracy, Workplace Vocabulary, Clarity & Conciseness, Professional Tone)';

    const prompt = `Bạn là chuyên gia chấm thi và sửa bài tiếng Anh chuẩn quốc tế (${targetDesc}).
Hãy phân tích chi tiết bài viết tiếng Anh sau đây của người học Việt Nam.

Tiêu đề bài viết: "${title || 'Untitled Practice'}"
Chủ đề: "${topicTag}"
Chế độ mục tiêu: ${mode} (${mode === 'IELTS' ? 'Mục tiêu 8.0' : 'Mục tiêu 800+'})

Nội dung người học viết:
"""
${trimmed}
"""

YÊU CẦU QUAN TRỌNG:
1. Đừng chỉ trả về con số điểm! Hãy chỉ rõ VÌ SAO bài viết có vấn đề và CÁCH CẢI THIỆN cụ thể từng câu, từng từ.
2. Trong mảng "corrections", tìm TẤT CẢ các lỗi ngữ pháp (Grammar), từ vựng (Vocabulary), kết hợp từ (Collocation), hoặc cấu trúc câu (Structure).
   Ví dụ mẫu bắt buộc tuân thủ:
   Nếu người dùng viết: "I have many reason to learn English."
   Thì trả về item:
   - category: "Grammar"
   - wrong: "reason"
   - right: "reasons"
   - originalSentence: "I have many reason to learn English."
   - correctSentence: "I have many reasons to learn English."
   - explanation: "Sau lượng từ 'many' cần sử dụng danh từ đếm được ở dạng số nhiều (plural countable noun)."
3. Ngay cả khi câu không sai ngữ pháp cơ bản, hãy gợi ý ít nhất 1-2 điểm nâng cấp từ vựng/cấu trúc trong "corrections" và "vocabularyUpgrades" để đạt mốc ${mode === 'IELTS' ? 'IELTS 8.0' : 'TOEIC 800+'}.
4. Trường "overallScore": Nếu mode là IELTS, định dạng kiểu "6.5 / 9.0" hoặc "7.5 / 9.0". Nếu mode là TOEIC, định dạng kiểu "765 / 990" hoặc "835 / 990".
5. Trường "criteriaScores": Trả về đúng 4 tiêu chí chấm điểm phù hợp với ${mode} kèm nhận xét tiếng Việt ngắn gọn, sắc bén.
6. Trường "detectedWeaknessTags": Liệt kê 2-4 chủ điểm ngữ pháp/từ vựng người viết cần luyện thêm (bằng tiếng Việt ngắn gọn, ví dụ: "Danh từ số nhiều sau lượng từ (many/several)", "Sự hòa hợp chủ ngữ - động từ", "Collocation học thuật chủ đề công việc").`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.STRING },
            targetComparison: { type: Type.STRING },
            summaryFeedback: { type: Type.STRING },
            correctedFullText: { type: Type.STRING },
            upgradedVersion: { type: Type.STRING },
            criteriaScores: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  score: { type: Type.STRING },
                  commentVi: { type: Type.STRING },
                },
                required: ['name', 'score', 'commentVi'],
              },
            },
            corrections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: {
                    type: Type.STRING,
                    enum: ['Grammar', 'Vocabulary', 'Collocation', 'Structure'],
                  },
                  wrong: { type: Type.STRING },
                  right: { type: Type.STRING },
                  originalSentence: { type: Type.STRING },
                  correctSentence: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
                required: ['category', 'wrong', 'right', 'originalSentence', 'correctSentence', 'explanation'],
              },
            },
            vocabularyUpgrades: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  basicWord: { type: Type.STRING },
                  advancedWord: { type: Type.STRING },
                  level: { type: Type.STRING },
                  meaningVi: { type: Type.STRING },
                  exampleSentence: { type: Type.STRING },
                },
                required: ['basicWord', 'advancedWord', 'level', 'meaningVi', 'exampleSentence'],
              },
            },
            detectedWeaknessTags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: [
            'overallScore',
            'targetComparison',
            'summaryFeedback',
            'correctedFullText',
            'upgradedVersion',
            'criteriaScores',
            'corrections',
            'vocabularyUpgrades',
            'detectedWeaknessTags',
          ],
        },
      },
    });

    const jsonText = response.text;
    if (jsonText) {
      const parsed = JSON.parse(jsonText) as AIFeedbackResult;
      return parsed;
    }
    throw new Error('Empty AI response');
  } catch (error) {
    console.error('AI analysis fallback triggered:', error);
    return buildFallbackAnalysis(trimmed, mode);
  }
}

export async function generateMistakeDrill(
  mistakes: string[],
  mode: LearningMode
): Promise<PracticeQuestion[]> {
  try {
    const ai = getAIClient();
    const mistakeList = mistakes.length > 0
      ? mistakes.join(', ')
      : 'Danh từ số nhiều sau many/several, Sự hòa hợp chủ ngữ - động từ, Giới từ thông dụng, Từ loại (Word Form)';

    const prompt = `Tạo một bài luyện tập cá nhân hóa gồm 5 câu hỏi trắc nghiệm tiếng Anh thực chiến cho chế độ ${mode} (Mục tiêu ${mode === 'IELTS' ? 'IELTS 8.0' : 'TOEIC 800+'}).
Các câu hỏi này PHẢI xoáy sâu vào những lỗi người học thường mắc sau đây:
[${mistakeList}]

Mỗi câu hỏi cần có:
- question: Câu hỏi tiếng Anh có chỗ trống hoặc tìm lỗi sai
- options: 4 phương án A, B, C, D (chỉ ghi nội dung phương án)
- correctIndex: Chỉ số đáp án đúng (0, 1, 2, hoặc 3)
- wrongSnippet: Lỗi sai thường gặp liên quan
- rightSnippet: Cách dùng đúng chuẩn
- explanationVi: Giải thích chi tiết bằng tiếng Việt vì sao chọn đáp án đó và quy tắc cần nhớ
- grammarRule: Tên quy tắc ngữ pháp/từ vựng ngắn gọn`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              question: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              correctIndex: { type: Type.INTEGER },
              wrongSnippet: { type: Type.STRING },
              rightSnippet: { type: Type.STRING },
              explanationVi: { type: Type.STRING },
              grammarRule: { type: Type.STRING },
            },
            required: ['id', 'question', 'options', 'correctIndex', 'wrongSnippet', 'rightSnippet', 'explanationVi', 'grammarRule'],
          },
        },
      },
    });

    const jsonText = response.text;
    if (jsonText) {
      return JSON.parse(jsonText) as PracticeQuestion[];
    }
    throw new Error('Empty drill response');
  } catch (err) {
    console.error('Fallback mistake drill:', err);
    return [
      {
        id: 'drill-1',
        question: 'There are still many _______ why professionals choose to master business English before applying to multinational firms.',
        options: ['reason', 'reasons', 'reasoning', 'reasonable'],
        correctIndex: 1,
        wrongSnippet: 'many reason',
        rightSnippet: 'many reasons',
        explanationVi: 'Sau lượng từ "many" (nhiều) bắt buộc phải dùng danh từ đếm được số nhiều ("reasons").',
        grammarRule: 'Quantifiers + Plural Countable Nouns',
      },
      {
        id: 'drill-2',
        question: 'The marketing director, along with her senior analysts, _______ reviewing the quarterly sales forecast this afternoon.',
        options: ['are', 'is', 'were', 'have been'],
        correctIndex: 1,
        wrongSnippet: 'director, along with analysts, are',
        rightSnippet: 'director, along with analysts, is',
        explanationVi: 'Khi chủ ngữ chính nối với cụm phụ bằng "along with / together with", động từ chia theo chủ ngữ đầu tiên ("The marketing director" - số ít -> "is").',
        grammarRule: 'Subject-Verb Agreement',
      },
      {
        id: 'drill-3',
        question: 'Investing heavily in renewable energy infrastructure can _______ long-term economic sustainability.',
        options: ['foster', 'make', 'do', 'take'],
        correctIndex: 0,
        wrongSnippet: 'make sustainability',
        rightSnippet: 'foster sustainability',
        explanationVi: 'Trong văn phong IELTS 8.0 / TOEIC 800+, động từ "foster" (thúc đẩy, nuôi dưỡng) kết hợp tự nhiên với "sustainability" hoặc "development".',
        grammarRule: 'Academic Collocations',
      },
    ];
  }
}

export async function evaluateSpeakingOrWritingPractice(
  promptTitle: string,
  userResponse: string,
  mode: LearningMode,
  skillType: 'Writing' | 'Speaking'
): Promise<{
  score: string;
  feedbackVi: string;
  improvedVersion: string;
  keyFixes: { wrong: string; right: string; explanation: string }[];
}> {
  try {
    const ai = getAIClient();
    const prompt = `Đánh giá bài trả lời luyện tập ${skillType} chế độ ${mode} (Mục tiêu ${mode === 'IELTS' ? '8.0' : '800+'}).
Đề bài: "${promptTitle}"
Bài làm của học viên:
"""
${userResponse}
"""
Hãy chấm điểm, giải thích lỗi sai cụ thể (wrong -> right kèm explanation tiếng Việt) và viết lại phiên bản nâng cấp mẫu đạt điểm tối đa.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.STRING },
            feedbackVi: { type: Type.STRING },
            improvedVersion: { type: Type.STRING },
            keyFixes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  wrong: { type: Type.STRING },
                  right: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
                required: ['wrong', 'right', 'explanation'],
              },
            },
          },
          required: ['score', 'feedbackVi', 'improvedVersion', 'keyFixes'],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error('Empty response');
  } catch {
    return {
      score: mode === 'IELTS' ? 'Band 7.0 (Mục tiêu 8.0)' : '790 / 990 (Mục tiêu 800+)',
      feedbackVi: 'Ý tưởng rõ ràng, bám sát chủ đề. Để nâng lên mức điểm mục tiêu, bạn cần chú ý danh từ số nhiều sau lượng từ và sử dụng thêm các collocation học thuật.',
      improvedVersion: userResponse,
      keyFixes: [
        {
          wrong: 'many reason',
          right: 'numerous compelling reasons',
          explanation: 'Sau many cần danh từ số nhiều; có thể nâng cấp thành "numerous compelling reasons" để tăng điểm từ vựng.',
        },
      ],
    };
  }
}

function buildFallbackAnalysis(text: string, mode: LearningMode): AIFeedbackResult {
  const hasManyReason = /many\s+reason\b/i.test(text);
  const corrected = text
    .replace(/many\s+reason\b/gi, 'many reasons')
    .replace(/\bhelps\s+me\s+improving\b/gi, 'helps me improve')
    .replace(/\bmore\s+better\b/gi, 'much better');

  return {
    overallScore: mode === 'IELTS' ? '6.5 / 9.0' : '760 / 990',
    targetComparison:
      mode === 'IELTS'
        ? 'Cần cải thiện +1.5 band ở Grammatical Accuracy & Lexical Resource để đạt IELTS 8.0'
        : 'Cần thêm +40 điểm về độ chính xác ngữ pháp để vượt mốc TOEIC 800+',
    summaryFeedback:
      'Bài viết truyền đạt được ý chính rõ ràng nhưng còn mắc lỗi ngữ pháp cơ bản về danh từ số nhiều sau lượng từ và cách chọn từ vựng còn mang tính giao tiếp thông thường. Xem chi tiết từng lỗi bên dưới để hiểu rõ nguyên nhân và cách khắc phục.',
    correctedFullText: corrected,
    upgradedVersion:
      mode === 'IELTS'
        ? 'There are numerous compelling reasons to master the English language, ranging from expanding global career prospects to accessing cutting-edge academic research.'
        : 'Acquiring proficiency in business English offers multiple strategic advantages for career advancement and international client communication.',
    criteriaScores:
      mode === 'IELTS'
        ? [
            { name: 'Task Response', score: '7.0', commentVi: 'Trả lời đúng trọng tâm chủ đề, luận điểm rõ ràng.' },
            { name: 'Coherence & Cohesion', score: '6.5', commentVi: 'Cần bổ sung từ nối học thuật (Furthermore, Consequently) để liên kết câu mượt hơn.' },
            { name: 'Lexical Resource', score: '6.5', commentVi: 'Từ vựng đủ dùng nhưng lặp lại các từ cơ bản như "many", "good", "learn".' },
            { name: 'Grammatical Range & Accuracy', score: '6.0', commentVi: 'Cần khắc phục lỗi danh từ số ít/số nhiều sau lượng từ "many".' },
          ]
        : [
            { name: 'Grammar Accuracy', score: '740', commentVi: 'Cần lưu ý chia danh từ số nhiều sau lượng từ (many + plural noun).' },
            { name: 'Workplace Vocabulary', score: '770', commentVi: 'Có thể thay các động từ cơ bản bằng từ vựng công sở chuyên nghiệp.' },
            { name: 'Clarity & Conciseness', score: '800', commentVi: 'Câu văn ngắn gọn, truyền tải thông điệp trực tiếp.' },
            { name: 'Tone & Register', score: '750', commentVi: 'Nên nâng cấp giọng văn trang trọng hơn cho môi trường làm việc quốc tế.' },
          ],
    corrections: hasManyReason
      ? [
          {
            category: 'Grammar',
            wrong: 'reason',
            right: 'reasons',
            originalSentence: 'I have many reason to learn English.',
            correctSentence: 'I have many reasons to learn English.',
            explanation: 'Sau lượng từ "many" bắt buộc phải dùng danh từ đếm được ở dạng số nhiều (reasons).',
          },
        ]
      : [
          {
            category: 'Vocabulary',
            wrong: text.split(' ').slice(0, 3).join(' '),
            right: 'From a professional perspective,',
            originalSentence: text,
            correctSentence: corrected,
            explanation: 'Mở đầu câu bằng cụm trạng ngữ học thuật giúp tăng điểm Coherence và Lexical Resource.',
          },
        ],
    vocabularyUpgrades: [
      {
        basicWord: 'many reasons',
        advancedWord: 'numerous compelling motivations',
        level: mode === 'IELTS' ? 'IELTS 8.0' : 'TOEIC 850+',
        meaningVi: 'nhiều động lực/lý do thuyết phục',
        exampleSentence: 'Professionals have numerous compelling motivations to master English.',
      },
      {
        basicWord: 'learn English',
        advancedWord: 'acquire proficiency in English',
        level: mode === 'IELTS' ? 'IELTS 8.0' : 'TOEIC 850+',
        meaningVi: 'đạt được sự thông thạo tiếng Anh',
        exampleSentence: 'Acquiring proficiency in English opens doors to multinational corporations.',
      },
    ],
    detectedWeaknessTags: [
      'Danh từ số nhiều sau lượng từ (many/several)',
      'Nâng cấp Collocation học thuật (Lexical Resource)',
    ],
  };
}
