import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface QuizQuestion {
  question: string;
  correctAnswer: string;
  options?: string[];
  explanation: string;
  sourceReference: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

export async function generateQuestions(
  content: string,
  questionCount: number,
  difficulty: string,
  quizType: 'FLASHCARD' | 'MULTIPLE_CHOICE',
  topicFocus?: string
): Promise<QuizQuestion[]> {
  const prompt = buildPrompt(content, questionCount, difficulty, quizType, topicFocus);

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    console.log('Claude API Response (first 500 chars):', responseText.substring(0, 500));
    const questions = parseQuestionsFromResponse(responseText, quizType);

    return questions;
  } catch (error: any) {
    console.error('Error calling Claude API:', error);
    if (error.status === 401 || error.message?.includes('API key')) {
      throw new Error('Invalid or missing Anthropic API key. Please configure ANTHROPIC_API_KEY in your .env file.');
    }
    if (error.status === 429) {
      throw new Error('API rate limit exceeded. Please try again later.');
    }
    throw new Error(`Failed to generate questions: ${error.message || 'Unknown error'}`);
  }
}

function buildPrompt(
  content: string,
  questionCount: number,
  difficulty: string,
  quizType: string,
  topicFocus?: string
): string {
  const typeInstructions = quizType === 'MULTIPLE_CHOICE'
    ? 'Create multiple choice questions with 4 options (1 correct, 3 plausible distractors).'
    : 'Create flashcard-style questions with a question and a concise answer.';

  // Limit content to 100k characters to avoid token limits
  const limitedContent = content.substring(0, 100000);

  return `You are an expert educational quiz generator. Create ${questionCount} ${difficulty.toLowerCase()} difficulty ${quizType.toLowerCase().replace('_', ' ')} questions based on the following content.

${topicFocus ? `Focus specifically on: ${topicFocus}` : 'Cover various topics from the content.'}

${typeInstructions}

Content to analyze:

${limitedContent}

Requirements:
- Questions should test understanding at the ${difficulty.toLowerCase()} level
- Include detailed explanations with specific references to the source content
- Ensure questions are clear and unambiguous
- For multiple choice, make all options plausible
- Vary question types (definitions, applications, analysis, etc.)

IMPORTANT: Return ONLY a valid JSON array. Do not include any markdown, explanations, or text outside the JSON array. Start your response with [ and end with ].

The JSON array must have this exact structure:

[
  {
    "question": "The question text",
    "correctAnswer": "The correct answer",
    ${quizType === 'MULTIPLE_CHOICE' ? '"options": ["option1", "option2", "option3", "option4"],' : ''}
    "explanation": "Detailed explanation referencing the source",
    "sourceReference": "Reference to where in the content this comes from",
    "difficulty": "${difficulty.toUpperCase()}"
  }
]

Return the JSON array now:`;
}

function parseQuestionsFromResponse(response: string, quizType: 'FLASHCARD' | 'MULTIPLE_CHOICE'): QuizQuestion[] {
  try {
    // Try to extract JSON from markdown code blocks first
    let jsonText = response;
    
    // Remove markdown code blocks if present
    const codeBlockMatch = response.match(/```(?:json)?\s*(\[[\s\S]*\])\s*```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1];
    } else {
      // Try to find JSON array in the response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }
    }

    if (!jsonText || !jsonText.trim().startsWith('[')) {
      console.error('No JSON array found in response. Response:', response.substring(0, 1000));
      throw new Error('AI response does not contain a valid JSON array');
    }

    // Clean up common JSON issues
    jsonText = cleanJsonText(jsonText);

    let questions;
    try {
      questions = JSON.parse(jsonText);
    } catch (parseError: any) {
      // If parsing fails, try to fix common issues and parse again
      console.warn('Initial JSON parse failed, attempting to fix common issues...');
      console.error('Parse error:', parseError.message);
      
      // Log the problematic area
      const errorPosMatch = parseError.message.match(/position (\d+)/);
      const errorPos = errorPosMatch ? parseInt(errorPosMatch[1]) : 0;
      if (errorPos > 0) {
        const start = Math.max(0, errorPos - 500);
        const end = Math.min(jsonText.length, errorPos + 500);
        console.error('Problematic JSON area (position', errorPos, '):', jsonText.substring(start, end));
      }
      
      // Try multiple fix strategies
      let fixedJson = jsonText;
      
      // Strategy 1: Fix common issues
      fixedJson = fixCommonJsonIssues(fixedJson);
      
      try {
        questions = JSON.parse(fixedJson);
        console.log('Successfully parsed after fixCommonJsonIssues');
      } catch (secondError: any) {
        console.warn('First fix attempt failed, trying advanced fixes...');
        
        // Strategy 2: Try to escape unescaped quotes in string values more aggressively
        fixedJson = escapeUnescapedQuotes(fixedJson);
        
        try {
          questions = JSON.parse(fixedJson);
          console.log('Successfully parsed after escapeUnescapedQuotes');
        } catch (thirdError: any) {
          console.warn('Second fix attempt failed, trying to extract individual questions...');
          
          // Strategy 3: Try to extract and parse individual question objects
          try {
            questions = extractIndividualQuestions(fixedJson, quizType);
            console.log('Successfully extracted', questions.length, 'individual questions');
          } catch (extractError: any) {
            // Final fallback: Log everything for debugging
            console.error('All parsing strategies failed');
            console.error('Original JSON length:', jsonText.length);
            console.error('Fixed JSON length:', fixedJson.length);
            console.error('First 2000 chars:', jsonText.substring(0, 2000));
            console.error('Last 2000 chars:', jsonText.substring(Math.max(0, jsonText.length - 2000)));
            console.error('Third error:', thirdError.message);
            console.error('Extract error:', extractError.message);
            throw new Error(`Failed to parse JSON after multiple attempts: ${parseError.message}`);
          }
        }
      }
    }
    
    // Validate structure
    if (!Array.isArray(questions)) {
      console.error('Parsed response is not an array:', typeof questions);
      throw new Error('Response is not an array');
    }

    if (questions.length === 0) {
      throw new Error('No questions generated');
    }

    // Validate and fix each question
    const validatedQuestions = questions.map((q: any, index: number) => {
      // Ensure required fields exist
      if (!q.question || !q.correctAnswer || !q.explanation) {
        throw new Error(`Question ${index + 1} is missing required fields (question, correctAnswer, or explanation)`);
      }

      // Set difficulty if missing
      if (!q.difficulty) {
        q.difficulty = 'MEDIUM';
      }

      // For multiple choice, ensure options array exists and has 4 items
      if (quizType === 'MULTIPLE_CHOICE') {
        if (!q.options || !Array.isArray(q.options)) {
          throw new Error(`Question ${index + 1} must have an options array for multiple choice`);
        }
        if (q.options.length !== 4) {
          console.warn(`Question ${index + 1} has ${q.options.length} options, expected 4. Fixing...`);
          // Pad or truncate to 4 options
          while (q.options.length < 4) {
            q.options.push('Option ' + (q.options.length + 1));
          }
          q.options = q.options.slice(0, 4);
        }
      }

      // Ensure sourceReference exists
      if (!q.sourceReference) {
        q.sourceReference = 'Content reference';
      }

      return q as QuizQuestion;
    });

    return validatedQuestions;
  } catch (error: any) {
    console.error('Error parsing questions:', error);
    console.error('Response that failed (first 5000 chars):', response.substring(0, 5000));
    if (error.message) {
      throw new Error(`Failed to parse questions: ${error.message}`);
    }
    throw new Error('Failed to parse questions from AI response');
  }
}

function cleanJsonText(jsonText: string): string {
  // Remove any leading/trailing whitespace
  let cleaned = jsonText.trim();
  
  // Remove BOM if present
  if (cleaned.charCodeAt(0) === 0xFEFF) {
    cleaned = cleaned.slice(1);
  }
  
  // Ensure it starts with [
  if (!cleaned.startsWith('[')) {
    const startIndex = cleaned.indexOf('[');
    if (startIndex !== -1) {
      cleaned = cleaned.substring(startIndex);
    }
  }
  
  // Ensure it ends with ]
  if (!cleaned.endsWith(']')) {
    const endIndex = cleaned.lastIndexOf(']');
    if (endIndex !== -1) {
      cleaned = cleaned.substring(0, endIndex + 1);
    }
  }
  
  return cleaned;
}

function fixCommonJsonIssues(jsonText: string): string {
  let fixed = jsonText;
  
  // Remove trailing commas before closing braces/brackets (most common issue)
  fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
  
  // Fix unescaped newlines, tabs, and carriage returns in string values
  // This is safer than the regex approach - we'll process character by character in a smarter way
  let result = '';
  let inString = false;
  let escapeNext = false;
  
  for (let i = 0; i < fixed.length; i++) {
    const char = fixed[i];
    const prevChar = i > 0 ? fixed[i - 1] : '';
    
    if (escapeNext) {
      result += char;
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      result += char;
      escapeNext = true;
      continue;
    }
    
    if (char === '"' && prevChar !== '\\') {
      inString = !inString;
      result += char;
      continue;
    }
    
    if (inString) {
      // Escape unescaped control characters in strings
      if (char === '\n' && prevChar !== '\\') {
        result += '\\n';
      } else if (char === '\r' && prevChar !== '\\') {
        result += '\\r';
      } else if (char === '\t' && prevChar !== '\\') {
        result += '\\t';
      } else if (char === '"' && prevChar !== '\\') {
        // This shouldn't happen if we're tracking inString correctly, but handle it
        result += '\\"';
      } else {
        result += char;
      }
    } else {
      result += char;
    }
  }
  
  fixed = result;
  
  return fixed;
}

function escapeUnescapedQuotes(jsonText: string): string {
  // This is a more aggressive approach to fix unescaped quotes
  // We'll look for patterns like "key": "value with "quotes" inside"
  let result = '';
  let inString = false;
  let escapeNext = false;
  let quoteCount = 0;
  
  for (let i = 0; i < jsonText.length; i++) {
    const char = jsonText[i];
    const prevChar = i > 0 ? jsonText[i - 1] : '';
    
    if (escapeNext) {
      result += char;
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      result += char;
      escapeNext = true;
      continue;
    }
    
    if (char === '"') {
      if (prevChar !== '\\') {
        inString = !inString;
        quoteCount++;
      }
      result += char;
      continue;
    }
    
    // If we're in a string and encounter a quote-like character that might be unescaped
    if (inString && char === '"' && prevChar !== '\\') {
      // Check if this looks like it might be an unescaped quote in the middle of a string value
      // Look ahead to see if we're near a colon or comma (which would indicate a new key)
      let lookAhead = '';
      for (let j = i + 1; j < Math.min(i + 20, jsonText.length); j++) {
        lookAhead += jsonText[j];
        if (jsonText[j] === ':' || jsonText[j] === ',') break;
      }
      
      // If we don't see a colon nearby, this might be an unescaped quote
      if (!lookAhead.includes(':')) {
        result += '\\"';
        continue;
      }
    }
    
    result += char;
  }
  
  return result;
}

function extractIndividualQuestions(jsonText: string, quizType: 'FLASHCARD' | 'MULTIPLE_CHOICE'): QuizQuestion[] {
  // Try to extract individual question objects using regex
  // Look for patterns like { "question": "...", "correctAnswer": "...", ... }
  const questionPattern = /\{\s*"question"\s*:\s*"([^"]*(?:\\.[^"]*)*)"\s*,\s*"correctAnswer"\s*:\s*"([^"]*(?:\\.[^"]*)*)"\s*(?:,\s*"options"\s*:\s*\[([^\]]*)\])?\s*,\s*"explanation"\s*:\s*"([^"]*(?:\\.[^"]*)*)"\s*(?:,\s*"sourceReference"\s*:\s*"([^"]*(?:\\.[^"]*)*)")?\s*(?:,\s*"difficulty"\s*:\s*"([^"]*)")?\s*\}/g;
  
  const questions: QuizQuestion[] = [];
  let match;
  let questionIndex = 0;
  
  // Try a simpler pattern - find each object between { and }
  const objectPattern = /\{[\s\S]*?\}(?=\s*[,}\]]|$)/g;
  const objects = jsonText.match(objectPattern);
  
  if (objects) {
    for (const objStr of objects) {
      try {
        const obj = JSON.parse(objStr);
        if (obj.question && obj.correctAnswer && obj.explanation) {
          // Validate and fix the question object
          const question: QuizQuestion = {
            question: String(obj.question),
            correctAnswer: String(obj.correctAnswer),
            explanation: String(obj.explanation),
            sourceReference: obj.sourceReference ? String(obj.sourceReference) : 'Content reference',
            difficulty: (obj.difficulty || 'MEDIUM').toUpperCase() as 'EASY' | 'MEDIUM' | 'HARD',
          };
          
          if (quizType === 'MULTIPLE_CHOICE') {
            if (Array.isArray(obj.options)) {
              question.options = obj.options.map((o: any) => String(o)).slice(0, 4);
              while (question.options && question.options.length < 4) {
                question.options.push('Option ' + (question.options.length + 1));
              }
            } else {
              throw new Error('Missing options array');
            }
          }
          
          questions.push(question);
          questionIndex++;
        }
      } catch (e) {
        // Skip this object and continue
        console.warn(`Failed to parse question object ${questionIndex + 1}:`, e);
      }
    }
  }
  
  if (questions.length === 0) {
    throw new Error('Could not extract any valid questions from the response');
  }
  
  return questions;
}

