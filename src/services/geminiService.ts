import { AIFeedbackResult, LearningMode, PracticeQuestion } from '../types';

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

  const response = await fetch('/api/ai/analyze-writing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: trimmed,
      title: title.trim(),
      mode,
      topicTag,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Lỗi kết nối đến máy chủ AI.');
  }

  return response.json();
}

export async function askAIAssistant(
  message: string,
  mode: LearningMode,
  history: { role: 'user' | 'model'; text: string }[] = []
): Promise<string> {
  const trimmed = message.trim();
  if (!trimmed) {
    throw new Error('Tin nhắn không được để trống.');
  }

  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: trimmed,
      mode,
      history,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Không thể kết nối đến Trợ lý AI.');
  }

  const data = await response.json();
  return data.text || '';
}

export async function generateSkillPracticeQuestions(
  mode: LearningMode,
  category: string
): Promise<PracticeQuestion[]> {
  const response = await fetch('/api/ai/generate-skill-questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, category }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Lỗi khi tạo câu hỏi trắc nghiệm.');
  }

  return response.json();
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

  const response = await fetch('/api/ai/generate-mistake-drill', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mistakes, mode }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Lỗi khi tạo bài tập khắc phục lỗi.');
  }

  return response.json();
}

export async function generateWritingOrSpeakingTopic(
  mode: LearningMode,
  skillType: 'Writing' | 'Speaking'
): Promise<{ promptTitle: string; sampleCuePoints: string[] }> {
  const response = await fetch('/api/ai/generate-topic', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, skillType }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Lỗi khi tạo đề bài.');
  }

  return response.json();
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
  const response = await fetch('/api/ai/evaluate-practice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      promptTitle,
      userResponse,
      mode,
      skillType,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Lỗi khi chấm điểm bài làm.');
  }

  return response.json();
}
