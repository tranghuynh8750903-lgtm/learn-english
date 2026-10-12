import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI on server-side as mandated by gemini-api skill
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// 1. Analyze English Writing Endpoint
app.post('/api/ai/analyze-writing', async (req, res) => {
  try {
    const { text, title, mode, topicTag } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Nội dung tiếng Anh không được để trống.' });
    }

    const currentMode = mode === 'TOEIC' ? 'TOEIC' : 'IELTS';
    const targetDesc =
      currentMode === 'IELTS'
        ? 'IELTS Writing Band 8.0 (Academic & General: Task Response, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy)'
        : 'TOEIC 800+ / 990 (Business & Workplace English: Grammar Accuracy, Workplace Vocabulary, Clarity & Conciseness, Professional Tone)';

    const prompt = `Bạn là chuyên gia chấm thi và sửa bài tiếng Anh chuẩn quốc tế (${targetDesc}).
Hãy phân tích chi tiết bài viết tiếng Anh sau đây của người học.

Tiêu đề bài viết: "${title || 'Untitled'}"
Chủ đề: "${topicTag || 'General'}"
Chế độ mục tiêu: ${currentMode} (${currentMode === 'IELTS' ? 'Mục tiêu 8.0' : 'Mục tiêu 800+'})

Nội dung người học viết:
"""
${text.trim()}
"""

YÊU CẦU QUAN TRỌNG:
1. Không chỉ trả về con số điểm, mà phải chỉ rõ VÌ SAO bài viết có vấn đề và CÁCH CẢI THIỆN cụ thể từng câu, từng từ.
2. Trong mảng "corrections", liệt kê TẤT CẢ các lỗi ngữ pháp (Grammar), từ vựng (Vocabulary), kết hợp từ (Collocation), hoặc cấu trúc câu (Structure).
   Ví dụ mẫu:
   Nếu người dùng viết: "I have many reason to learn English."
   Thì trả về:
   - category: "Grammar"
   - wrong: "reason"
   - right: "reasons"
   - originalSentence: "I have many reason to learn English."
   - correctSentence: "I have many reasons to learn English."
   - explanation: "Sau many cần danh từ đếm được số nhiều."
3. Trường "overallScore": Nếu mode là IELTS, định dạng kiểu "6.5 / 9.0" hoặc "7.5 / 9.0". Nếu mode là TOEIC, định dạng kiểu "765 / 990" hoặc "835 / 990".
4. Trường "criteriaScores": Trả về đúng 4 tiêu chí chấm điểm phù hợp với ${currentMode} kèm nhận xét tiếng Việt chi tiết, súc tích.
5. Trường "upgradedVersion": Viết lại toàn bộ bài viết trên theo phong cách chuẩn mực ${currentMode === 'IELTS' ? 'IELTS Band 8.0' : 'TOEIC 850+'}.
6. Trường "vocabularyUpgrades": 3-5 từ vựng/cụm từ học thuật hoặc thương mại nâng cấp từ bài viết.
7. Trường "detectedWeaknessTags": Liệt kê 2-4 chủ điểm ngữ pháp/từ vựng người viết cần củng cố (tiếng Việt ngắn gọn).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
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

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error) {
    console.error('Error analyzing writing:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Lỗi khi gọi Gemini AI phân tích bài viết.',
    });
  }
});

// 2. Interactive AI Assistant / Tutor Chat Endpoint
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, mode, history } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Tin nhắn không được để trống.' });
    }

    const currentMode = mode === 'TOEIC' ? 'TOEIC' : 'IELTS';
    const roleInstruction =
      currentMode === 'IELTS'
        ? `Bạn là "IELTS 8.0 Master Tutor" tại EnglishHub AI — một chuyên gia luyện thi IELTS quốc tế tận tâm, thông thái.
Nhiệm vụ của bạn:
- Giải đáp thắc mắc ngữ pháp, từ vựng học thuật (Lexical Resource Band 8.0+), collocations, idioms tự nhiên.
- Hướng dẫn cấu trúc bài viết Writing Task 1, Task 2 và phát triển ý tưởng Speaking Part 1, 2, 3.
- Khi người học đưa ra câu văn bị sai hoặc chưa hay, hãy giải thích rõ ràng tại sao sai (❌ -> ✅) và đưa ra câu nâng cấp chuẩn Band 8.0.
- Giải thích bằng tiếng Việt thân thiện, rõ ràng, dễ hiểu kèm ví dụ tiếng Anh thực tế.`
        : `Bạn là "TOEIC 800+ Executive Coach" tại EnglishHub AI — một chuyên gia luyện thi TOEIC và tiếng Anh thương mại quốc tế.
Nhiệm vụ của bạn:
- Giải thích chi tiết các bẫy ngữ pháp Part 5 & 6 (từ loại, liên từ, phân từ rút gọn, câu điều kiện, thì động từ).
- Chia sẻ chiến thuật làm bài đọc hiểu Part 7 và kỹ năng nghe hiểu Part 3 & 4.
- Cung cấp từ vựng công sở, email thương mại, hợp đồng và đàm phán quốc tế.
- Khi người học đưa ra câu văn sai, chỉ rõ lỗi (❌ -> ✅), giải thích vì sao cần sửa và cung cấp mẫu câu công sở chuyên nghiệp.
- Giải thích bằng tiếng Việt mạch lạc, sắc bén kèm mẹo làm bài thi.`;

    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: `${roleInstruction}\n\nHãy trả lời câu hỏi/yêu cầu sau của người học một cách đầy đủ, có cấu trúc rõ ràng, sinh động:\n"${message}"`,
          },
        ],
      },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: roleInstruction,
      },
    });

    return res.json({ text: response.text });
  } catch (error) {
    console.error('Error in AI chat:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Lỗi khi trò chuyện với Trợ lý AI.',
    });
  }
});

// 3. Generate Skill Practice Questions Endpoint
app.post('/api/ai/generate-skill-questions', async (req, res) => {
  try {
    const { mode, category } = req.body;
    const currentMode = mode === 'TOEIC' ? 'TOEIC' : 'IELTS';
    const isReading = category === 'Reading';
    const isListening = category === 'Listening';

    const prompt = `Hãy tạo 4 câu hỏi trắc nghiệm tiếng Anh thực chiến cho chế độ ${currentMode} (Mục tiêu ${
      currentMode === 'IELTS' ? 'IELTS 8.0' : 'TOEIC 800+'
    }), kỹ năng: "${category || 'Grammar'}".
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
- id: chuỗi định danh duy nhất (ví dụ: "q-1")
- question: Câu hỏi tiếng Anh
- options: 4 phương án trả lời
- correctIndex: Chỉ số đáp án đúng (0, 1, 2, hoặc 3)
- wrongSnippet: Cụm từ sai hoặc bẫy thường gặp
- rightSnippet: Cụm từ đúng chuẩn
- explanationVi: Giải thích chi tiết bằng tiếng Việt vì sao đáp án đó đúng
- grammarRule: Tên chủ điểm ngữ pháp/từ vựng/kỹ năng`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
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

    const parsed = JSON.parse(response.text || '[]');
    return res.json(parsed);
  } catch (error) {
    console.error('Error generating questions:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Lỗi khi tạo câu hỏi trắc nghiệm.',
    });
  }
});

// 4. Generate Mistake Drill Endpoint
app.post('/api/ai/generate-mistake-drill', async (req, res) => {
  try {
    const { mistakes, mode } = req.body;
    const currentMode = mode === 'TOEIC' ? 'TOEIC' : 'IELTS';
    const mistakeList = Array.isArray(mistakes) && mistakes.length > 0
      ? mistakes.join(', ')
      : 'Danh từ số nhiều sau many, Sự hòa hợp chủ ngữ - động từ, Giới từ';

    const prompt = `Tạo một bài luyện tập cá nhân hóa gồm 4 câu hỏi trắc nghiệm tiếng Anh cho chế độ ${currentMode} (Mục tiêu ${
      currentMode === 'IELTS' ? 'IELTS 8.0' : 'TOEIC 800+'
    }).
Các câu hỏi này PHẢI xoáy sâu vào những lỗi thực tế mà người dùng đã mắc phải sau đây:
[${mistakeList}]

Mỗi câu hỏi cần có:
- id: mã câu hỏi
- question: Câu hỏi tiếng Anh
- options: 4 phương án
- correctIndex: Chỉ số đáp án đúng (0, 1, 2, hoặc 3)
- wrongSnippet: Lỗi sai tương ứng
- rightSnippet: Cách dùng đúng chuẩn
- explanationVi: Giải thích chi tiết bằng tiếng Việt vì sao chọn đáp án đó
- grammarRule: Tên quy tắc ngữ pháp/từ vựng`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
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

    const parsed = JSON.parse(response.text || '[]');
    return res.json(parsed);
  } catch (error) {
    console.error('Error generating mistake drill:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Lỗi khi tạo bài tập khắc phục lỗi.',
    });
  }
});

// 5. Generate Writing / Speaking Topic Endpoint
app.post('/api/ai/generate-topic', async (req, res) => {
  try {
    const { mode, skillType } = req.body;
    const currentMode = mode === 'TOEIC' ? 'TOEIC' : 'IELTS';
    const prompt = `Tạo 1 đề bài luyện tập thực tế cho kỹ năng ${skillType || 'Writing'} chế độ ${currentMode} (Mục tiêu ${
      currentMode === 'IELTS' ? 'IELTS 8.0' : 'TOEIC 800+'
    }). Trả về promptTitle (đề bài tiếng Anh rõ ràng) và sampleCuePoints (3 gợi ý triển khai ý bằng tiếng Anh/Việt).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
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

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error) {
    console.error('Error generating topic:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Lỗi khi tạo đề bài.',
    });
  }
});

// 6. Evaluate Writing / Speaking Practice Endpoint
app.post('/api/ai/evaluate-practice', async (req, res) => {
  try {
    const { promptTitle, userResponse, mode, skillType } = req.body;
    const currentMode = mode === 'TOEIC' ? 'TOEIC' : 'IELTS';

    const prompt = `Đánh giá bài trả lời luyện tập ${skillType || 'Writing'} chế độ ${currentMode} (Mục tiêu ${
      currentMode === 'IELTS' ? '8.0' : '800+'
    }).
Đề bài: "${promptTitle || 'Tự chọn'}"
Bài làm của học viên:
"""
${userResponse}
"""
Hãy chấm điểm thực tế, giải thích từng lỗi sai cụ thể trong bài làm của học viên (wrong -> right kèm explanation tiếng Việt) và viết lại phiên bản nâng cấp mẫu đạt điểm tối đa.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
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

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error) {
    console.error('Error evaluating practice:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Lỗi khi chấm điểm bài làm.',
    });
  }
});

// 7. Generate Dynamic Vocab Game Challenges Endpoint
app.post('/api/ai/generate-vocab-game', async (req, res) => {
  try {
    const { mode, gameType } = req.body;
    const currentMode = mode === 'TOEIC' ? 'TOEIC' : 'IELTS';

    if (gameType === 'sprint') {
      const prompt = `Tạo 5 câu hỏi nhanh "Word Sprint / Collocation Challenge" cho chế độ ${currentMode} (Mục tiêu ${
        currentMode === 'IELTS' ? 'IELTS 8.0' : 'TOEIC 800+'
      }).
Mỗi câu có:
- sentence: Câu văn tiếng Anh chứa chỗ trống "_______"
- missingPart: Từ hoặc cụm từ điền vào chỗ trống
- options: 4 phương án lựa chọn
- correctIndex: Chỉ số đáp án đúng (0, 1, 2, 3)
- explanation: Giải thích ngắn bằng tiếng Việt tại sao chọn từ đó`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                sentence: { type: Type.STRING },
                missingPart: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                correctIndex: { type: Type.INTEGER },
                explanation: { type: Type.STRING },
              },
              required: ['id', 'sentence', 'missingPart', 'options', 'correctIndex', 'explanation'],
            },
          },
        },
      });

      return res.json(JSON.parse(response.text || '[]'));
    }

    // Default: Matching pairs
    const prompt = `Tạo 6 cặp từ vựng & nghĩa tiếng Việt học thuật/thương mại đỉnh cao cho chế độ ${currentMode} (Mục tiêu ${
      currentMode === 'IELTS' ? 'IELTS 8.0' : 'TOEIC 800+'
    }).
Mỗi mục gồm:
- id: chuỗi id duy nhất
- word: Từ vựng hoặc collocation tiếng Anh cao cấp (C1/C2 hoặc TOEIC 800+)
- meaningVi: Nghĩa tiếng Việt ngắn gọn, chuẩn xác
- example: Câu ví dụ tiếng Anh ngắn gọn chứa từ đó`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              word: { type: Type.STRING },
              meaningVi: { type: Type.STRING },
              example: { type: Type.STRING },
            },
            required: ['id', 'word', 'meaningVi', 'example'],
          },
        },
      },
    });

    return res.json(JSON.parse(response.text || '[]'));
  } catch (error) {
    console.error('Error generating vocab game:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Lỗi khi tạo thử thách game từ vựng.',
    });
  }
});

// Mount Vite in dev or static files in production
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`EnglishHub AI Server running on port ${port}`);
});
