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

  const ai = getAIClient();
  const targetDesc =
    mode === 'IELTS'
      ? 'IELTS Writing Band 8.0 (Academic & General: Task Response, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy)'
      : 'TOEIC 800+ / 990 (Business & Workplace English: Grammar Accuracy, Workplace Vocabulary, Clarity & Conciseness, Professional Tone)';

  const prompt = `Bạn là chuyên gia chấm thi và sửa bài tiếng Anh chuẩn quốc tế (${targetDesc}).
Hãy phân tích chi tiết bài viết tiếng Anh sau đây của người học.

Tiêu đề bài viết: "${title || 'Untitled'}"
Chủ đề: "${topicTag}"
Chế độ mục tiêu: ${mode} (${mode === 'IELTS' ? 'Mục tiêu 8.0' : 'Mục tiêu 800+'})

Nội dung người học viết:
"""
${trimmed}
"""

YÊU CẦU QUAN TRỌNG:
1. Không chỉ trả về điểm số mà phải cho người học thấy VÌ SAO bài viết có vấn đề và CÁCH CẢI THIỆN cụ thể.
2. Trong mảng "corrections", liệt kê từng lỗi ngữ pháp (Grammar), từ vựng (Vocabulary), kết hợp từ (Collocation), hoặc cấu trúc câu (Structure).
   Ví dụ:
   Nếu người dùng viết: "I have many reason to learn English."
   Thì trả về:
   - category: "Grammar"
   - wrong: "reason"
   - right: "reasons"
   - originalSentence: "I have many reason to learn English."
   - correctSentence: "I have many reasons to learn English."
   - explanation: "Sau many cần danh từ số nhiều."
3. Trường "overallScore": Nếu mode là IELTS, định dạng kiểu "6.5 / 9.0" hoặc "7.5 / 9.0". Nếu mode là TOEIC, định dạng kiểu "765 / 990" hoặc "835 / 990".
4. Trường "criteriaScores": Trả về 4 tiêu chí chấm điểm phù hợp với ${mode} kèm nhận xét tiếng Việt.
5. Trường "detectedWeaknessTags": Liệt kê các chủ điểm ngữ pháp/từ vựng người viết mắc lỗi trong bài này để tạo bài luyện tập cá nhân hóa.`;

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
              required: [
                'category',
                'wrong',
                'right',
                'originalSentence',
                'correctSentence',
                'explanation',
              ],
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
              required: [
                'basicWord',
                'advancedWord',
                'level',
                'meaningVi',
                'exampleSentence',
              ],
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
  if (!jsonText) {
    throw new Error('Không nhận được phản hồi từ AI. Vui lòng thử lại.');
  }
  return JSON.parse(jsonText) as AIFeedbackResult;
}

export async function generateSkillPracticeQuestions(
  mode: LearningMode,
  category: string
): Promise<PracticeQuestion[]> {
  const ai = getAIClient();
  const isReading = category === 'Reading';
  const isListening = category === 'Listening';

  const prompt = `Hãy tạo 4 câu hỏi trắc nghiệm tiếng Anh thực chiến cho chế độ ${mode} (Mục tiêu ${
    mode === 'IELTS' ? 'IELTS 8.0' : 'TOEIC 800+'
  }), kỹ năng: "${category}".
${
  isReading
    ? 'Mỗi câu hỏi PHẢI có trường "contextPassage" (đoạn văn đọc hiểu tiếng Anh khoảng 70-110 từ) để người học đọc và trả lời.'
    : ''
}
${
  isListening
    ? 'Mỗi câu hỏi PHẢI có trường "audioScript" (đoạn hội thoại hoặc bài nói tiếng Anh khoảng 50-80 từ) để phát âm thanh cho người học nghe.'
    : ''
}
Mỗi câu hỏi gồm:
- id: chuỗi định danh duy nhất
- question: Câu hỏi tiếng Anh
- options: 4 phương án trả lời
- correctIndex: Chỉ số đáp án đúng (0, 1, 2, hoặc 3)
- wrongSnippet: Cụm từ sai hoặc bẫy thường gặp
- rightSnippet: Cụm từ đúng chuẩn
- explanationVi: Giải thích chi tiết bằng tiếng Việt vì sao đáp án đó đúng
- grammarRule: Tên chủ điểm ngữ pháp/từ vựng/kỹ năng`;

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
            contextPassage: { type: Type.STRING },
            audioScript: { type: Type.STRING },
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
          required: [
            'id',
            'question',
            'options',
            'correctIndex',
            'wrongSnippet',
            'rightSnippet',
            'explanationVi',
            'grammarRule',
          ],
        },
      },
    },
  });

  if (!response.text) {
    throw new Error('Không thể tạo câu hỏi lúc này.');
  }
  return JSON.parse(response.text) as PracticeQuestion[];
}

export async function generateMistakeDrill(
  mistakes: string[],
  mode: LearningMode
): Promise<PracticeQuestion[]> {
  if (mistakes.length === 0) {
    throw new Error(
      'Bạn chưa có lỗi nào được ghi nhận. Hãy kiểm tra ít nhất 1 bài viết tại mục ✍️ Write trước để AI biết những lỗi bạn thường mắc!'
    );
  }

  const ai = getAIClient();
  const mistakeList = mistakes.join(', ');

  const prompt = `Tạo một bài luyện tập cá nhân hóa gồm 5 câu hỏi trắc nghiệm tiếng Anh cho chế độ ${mode} (Mục tiêu ${
    mode === 'IELTS' ? 'IELTS 8.0' : 'TOEIC 800+'
  }).
Các câu hỏi này PHẢI xoáy sâu vào những lỗi thực tế mà người dùng đã mắc phải sau đây:
[${mistakeList}]

Mỗi câu hỏi cần có:
- id: mã câu hỏi
- question: Câu hỏi tiếng Anh có chỗ trống hoặc chọn câu đúng
- options: 4 phương án
- correctIndex: Chỉ số đáp án đúng (0, 1, 2, hoặc 3)
- wrongSnippet: Lỗi sai tương ứng
- rightSnippet: Cách dùng đúng chuẩn
- explanationVi: Giải thích chi tiết bằng tiếng Việt vì sao chọn đáp án đó
- grammarRule: Tên quy tắc ngữ pháp/từ vựng`;

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
          required: [
            'id',
            'question',
            'options',
            'correctIndex',
            'wrongSnippet',
            'rightSnippet',
            'explanationVi',
            'grammarRule',
          ],
        },
      },
    },
  });

  if (!response.text) {
    throw new Error('Không nhận được dữ liệu bài tập từ AI.');
  }
  return JSON.parse(response.text) as PracticeQuestion[];
}

export async function generateWritingOrSpeakingTopic(
  mode: LearningMode,
  skillType: 'Writing' | 'Speaking'
): Promise<{ promptTitle: string; sampleCuePoints: string[] }> {
  const ai = getAIClient();
  const prompt = `Tạo 1 đề bài luyện tập thực tế cho kỹ năng ${skillType} chế độ ${mode} (Mục tiêu ${
    mode === 'IELTS' ? 'IELTS 8.0' : 'TOEIC 800+'
  }). Trả về promptTitle (đề bài bằng tiếng Anh) và sampleCuePoints (3 gợi ý triển khai ý bằng tiếng Anh/Việt).`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          promptTitle: { type: Type.STRING },
          sampleCuePoints: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ['promptTitle', 'sampleCuePoints'],
      },
    },
  });

  if (!response.text) {
    throw new Error('Không thể tạo đề bài lúc này.');
  }
  return JSON.parse(response.text);
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
  const ai = getAIClient();
  const prompt = `Đánh giá bài trả lời luyện tập ${skillType} chế độ ${mode} (Mục tiêu ${
    mode === 'IELTS' ? '8.0' : '800+'
  }).
Đề bài: "${promptTitle || 'Tự chọn'}"
Bài làm của học viên:
"""
${userResponse}
"""
Hãy chấm điểm thực tế, giải thích từng lỗi sai cụ thể trong bài làm của học viên (wrong -> right kèm explanation tiếng Việt) và viết lại phiên bản nâng cấp mẫu.`;

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

  if (!response.text) {
    throw new Error('Không nhận được kết quả chấm từ AI.');
  }
  return JSON.parse(response.text);
}
