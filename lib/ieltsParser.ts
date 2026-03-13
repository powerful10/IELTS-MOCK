export interface QuestionData {
  questionText: string;
  questionType: 'multiple_choice' | 'true_false_not_given' | 'matching_headings' | 'matching_information' | 'sentence_completion' | 'summary_completion' | 'short_answer';
  options?: string[];
  correctAnswer: string;
  explanation: string;
  order: number;
}

export interface ParsedSection {
  title: string;
  content: string;
  questions: QuestionData[];
}

export interface ParsedMock {
  title: string;
  type: 'reading' | 'listening';
  sections: ParsedSection[];
}

export function parseIeltstext(text: string, type: 'reading' | 'listening'): ParsedMock {
  const sections: ParsedSection[] = [];
  let currentTitle = "New Test";
  
  // Try to find a title
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length > 0) {
    currentTitle = lines[0].substring(0, 100);
  }

  // Basic segmentation by "Reading Passage" or "Section/Part"
  const sectionSplitter = type === 'reading' 
    ? /READING PASSAGE \d+/gi 
    : /PART \d+|SECTION \d+/gi;

  const splitPoints = [...text.matchAll(sectionSplitter)];
  
  if (splitPoints.length > 0) {
    for (let i = 0; i < splitPoints.length; i++) {
        const start = splitPoints[i].index!;
        const end = splitPoints[i+1] ? splitPoints[i+1].index! : text.length;
        const sectionText = text.substring(start, end);
        const header = splitPoints[i][0];

        // Within each section, split by "Questions X-Y"
        const questionHeaderMatch = sectionText.match(/Questions\s+\d+[-–]\d+/i);
        let content = sectionText;
        let questionDataText = sectionText;

        if (questionHeaderMatch) {
            const qHeaderIdx = questionHeaderMatch.index!;
            content = sectionText.substring(0, qHeaderIdx).replace(sectionSplitter, '').trim();
            questionDataText = sectionText.substring(qHeaderIdx);
        }

        sections.push({
          title: header,
          content: content,
          questions: extractQuestions(questionDataText)
        });
    }
  } else {
    // Fallback if no clear sections found
    const questionHeaderMatch = text.match(/Questions\s+\d+[-–]\d+/i);
    let content = text;
    let questionDataText = text;

    if (questionHeaderMatch) {
        const qHeaderIdx = questionHeaderMatch.index!;
        content = text.substring(0, qHeaderIdx).trim();
        questionDataText = text.substring(qHeaderIdx);
    }

    sections.push({
      title: "Test Section",
      content: content,
      questions: extractQuestions(questionDataText)
    });
  }

  return {
    title: currentTitle,
    type,
    sections: sections.slice(0, type === 'reading' ? 3 : 4) // Ensure we don't exceed IELTS limits
  };
}

function extractQuestions(text: string): QuestionData[] {
  const questions: QuestionData[] = [];
  
  // Multi-pass extraction
  // 1. Clean up text - remove excessive whitespace but keep some structure
  const cleanText = text.replace(/\s+/g, ' ');

  // 2. Identify potential question starts (\d+ followed by punctuation)
  const qStarts = [...cleanText.matchAll(/(\d+)\s*[\.)]/g)];
  
  for (let i = 0; i < qStarts.length; i++) {
    const current = qStarts[i];
    const next = qStarts[i + 1];
    
    const startIdx = current.index!;
    const endIdx = next ? next.index! : cleanText.length;
    
    const qNum = parseInt(current[1]);
    const qRaw = cleanText.substring(startIdx, endIdx).trim();
    
    // Skip if it looks like just a date or some other number
    if (qRaw.length < 10 && !next) continue;

    // Remove the number from the start for analysis
    const qContent = qRaw.replace(/^\d+\s*[\.)]\s*/, '').trim();
    
    // Determine type
    let qType: QuestionData['questionType'] = 'short_answer';
    let options: string[] = [];

    // Check for Multiple Choice (A, B, C, D)
    const optionMatches = [...qContent.matchAll(/([A-D])\s*[\.)]\s*([^A-D\n]+)/g)];
    if (optionMatches.length >= 2) {
      qType = 'multiple_choice';
      options = optionMatches.map(m => m[2].trim());
    } 
    // Check for TFNG
    else if (/\b(TRUE|FALSE|NOT GIVEN|YES|NO|NOT\s+GIVEN)\b/i.test(qContent)) {
      qType = 'true_false_not_given';
      options = ['True', 'False', 'Not Given'];
    }
    // Check for Gap Fill (underscores or dots)
    else if (qContent.includes('____') || qContent.includes('....') || qContent.includes('........')) {
      qType = 'sentence_completion';
    }

    questions.push({
      questionText: qContent,
      questionType: qType,
      options: options.length > 0 ? options : undefined,
      correctAnswer: '',
      explanation: '',
      order: qNum
    });
  }

  // Sort by order to be safe
  return questions.sort((a, b) => a.order - b.order);
}
