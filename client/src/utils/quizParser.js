/**
 * Client Utility: parseQuizPlainText
 * Validates and parses pasted questions on the client for live preview.
 */
export const parseQuizPlainText = (text) => {
  if (!text || typeof text !== 'string') {
    return {
      valid: false,
      questions: [],
      errors: [{ line: 1, message: 'Input text is empty or invalid.' }],
    };
  }

  const lines = text.split(/\r?\n/);
  const questions = [];
  const errors = [];

  let currentBlock = null;

  const commitBlock = (block) => {
    if (!block) return;

    const blockStartLine = block.startLine;

    // Validate Question Text
    if (!block.text || !block.text.trim()) {
      errors.push({
        line: blockStartLine,
        message: 'Question text is missing after "Q:".',
      });
      return;
    }

    // Validate Options
    if (!block.options || block.options.length < 2) {
      errors.push({
        line: block.optionsLine || blockStartLine,
        message: `Question "${block.text.slice(0, 30)}..." must provide at least 2 options (e.g. A) ... B) ...). Found ${
          block.options ? block.options.length : 0
        }.`,
      });
      return;
    }

    // Validate Answer
    if (block.rawAnswer === undefined || block.rawAnswer === null) {
      errors.push({
        line: block.answerLine || blockStartLine,
        message: `Missing "Answer:" line for question "${block.text.slice(0, 30)}...".`,
      });
      return;
    }

    // Parse correct index
    const correctIndexes = [];
    const answerStr = String(block.rawAnswer).trim().toUpperCase();

    // Check for True / False
    if (
      block.options.length === 2 &&
      block.options[0].toLowerCase() === 'true' &&
      block.options[1].toLowerCase() === 'false'
    ) {
      if (answerStr === 'TRUE' || answerStr === 'T' || answerStr === 'A') {
        correctIndexes.push(0);
      } else if (answerStr === 'FALSE' || answerStr === 'F' || answerStr === 'B') {
        correctIndexes.push(1);
      }
    } else {
      // Letters A, B, C, D...
      const letters = answerStr.match(/[A-Z]/g) || [];
      letters.forEach((letter) => {
        const idx = letter.charCodeAt(0) - 65; // A -> 0, B -> 1
        if (idx >= 0 && idx < block.options.length) {
          if (!correctIndexes.includes(idx)) {
            correctIndexes.push(idx);
          }
        }
      });
    }

    if (correctIndexes.length === 0) {
      errors.push({
        line: block.answerLine || blockStartLine,
        message: `Invalid answer "${block.rawAnswer}". Must be one of the option letters (A, B, C, etc.).`,
      });
      return;
    }

    let type = 'single';
    if (
      block.options.length === 2 &&
      block.options[0].toLowerCase() === 'true' &&
      block.options[1].toLowerCase() === 'false'
    ) {
      type = 'true_false';
    } else if (correctIndexes.length > 1) {
      type = 'multiple';
    }

    questions.push({
      text: block.text.trim(),
      code: block.code ? block.code.trim() : '',
      type,
      options: block.options,
      correctIndexes,
      explanation: block.explanation ? block.explanation.trim() : '',
      marks: block.marks || 1,
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const lineNum = i + 1;
    const trimmed = rawLine.trim();

    if (!trimmed) continue;

    // Check for Question start: "Q:" or "Q1:" or "1."
    if (/^(Q|Question)\s*[:.]/i.test(trimmed)) {
      if (currentBlock) {
        commitBlock(currentBlock);
      }

      const qText = trimmed.replace(/^(Q|Question)\s*[:.]\s*/i, '');
      currentBlock = {
        startLine: lineNum,
        text: qText,
        code: '',
        options: [],
        rawAnswer: null,
        explanation: '',
        marks: 1,
      };
      continue;
    }

    // If no active question block yet and line looks like question without Q:
    if (!currentBlock) {
      if (/^[0-9]+[.):]\s+/.test(trimmed)) {
        currentBlock = {
          startLine: lineNum,
          text: trimmed.replace(/^[0-9]+[.):]\s+/, ''),
          code: '',
          options: [],
          rawAnswer: null,
          explanation: '',
          marks: 1,
        };
        continue;
      }
      errors.push({
        line: lineNum,
        message: 'Line must start with "Q:" or a question number.',
      });
      continue;
    }

    // Check for Options line: e.g. "A) ... B) ..." or single option "A) ..."
    if (/^[A-Za-z][.)]/.test(trimmed) || /\b[A-Za-z][.)]/.test(trimmed)) {
      if (!/^(Answer|Explain|Marks):/i.test(trimmed)) {
        currentBlock.optionsLine = lineNum;

        const matches = [...trimmed.matchAll(/([A-Za-z])[.)]\s*([^A-Za-z.)]+|.+?)(?=\s+[A-Za-z][.)]|$)/g)];
        if (matches.length > 0) {
          matches.forEach((m) => {
            const optVal = m[0].replace(/^[A-Za-z][.)]\s*/, '').trim();
            if (optVal) {
              currentBlock.options.push(optVal);
            }
          });
        } else {
          const singleOpt = trimmed.replace(/^[A-Za-z][.)]\s*/, '').trim();
          if (singleOpt) {
            currentBlock.options.push(singleOpt);
          }
        }
        continue;
      }
    }

    // Check for Answer line
    if (/^(Answer|Ans)\s*[:.]/i.test(trimmed)) {
      currentBlock.answerLine = lineNum;
      currentBlock.rawAnswer = trimmed.replace(/^(Answer|Ans)\s*[:.]\s*/i, '');
      continue;
    }

    // Check for Explanation line
    if (/^(Explain|Explanation)\s*[:.]/i.test(trimmed)) {
      currentBlock.explanation = trimmed.replace(/^(Explain|Explanation)\s*[:.]\s*/i, '');
      continue;
    }

    // Check for Marks line
    if (/^Marks\s*[:.]/i.test(trimmed)) {
      const marksVal = parseInt(trimmed.replace(/^Marks\s*[:.]\s*/i, ''), 10);
      if (!isNaN(marksVal) && marksVal > 0) {
        currentBlock.marks = marksVal;
      }
      continue;
    }

    // Code block fences
    if (trimmed.startsWith('```')) {
      continue;
    }

    // Continuation of text or code
    if (currentBlock.options.length === 0 && !currentBlock.rawAnswer) {
      if (rawLine.startsWith('    ') || rawLine.startsWith('\t')) {
        currentBlock.code += (currentBlock.code ? '\n' : '') + rawLine;
      } else {
        currentBlock.text += ' ' + trimmed;
      }
      continue;
    }

    if (currentBlock.explanation) {
      currentBlock.explanation += ' ' + trimmed;
      continue;
    }
  }

  if (currentBlock) {
    commitBlock(currentBlock);
  }

  if (questions.length === 0 && errors.length === 0) {
    errors.push({ line: 1, message: 'No valid questions found in pasted text.' });
  }

  return {
    valid: errors.length === 0,
    questions,
    errors,
  };
};

export default parseQuizPlainText;
