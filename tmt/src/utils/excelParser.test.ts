import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeCellValue, parseSpreadsheetData } from './excelParser';
import { evaluateQuestion } from './scoring';
import { Question } from '../types/testforge';

test('Formula Neutralization strips or prefixes dangerous leading characters', () => {
  assert.equal(sanitizeCellValue('=SUM(A1:B2)'), "'=SUM(A1:B2)");
  assert.equal(sanitizeCellValue('+100'), "'+100");
  assert.equal(sanitizeCellValue('-50'), "'-50");
  assert.equal(sanitizeCellValue('@cmd'), "'@cmd");
  assert.equal(sanitizeCellValue('Standard Text'), 'Standard Text');
  assert.equal(sanitizeCellValue(null), '');
});

test('Header Normalization maps flexible column variations and enforces invariants', () => {
  const mockRows = [
    {
      'Section Name': 'Technical Core',
      'question type': 'SCQ',
      'question text': 'What is the speed of light?',
      points: '3.0',
      'negative marks': '0.75',
      'Option A': '300,000 km/s',
      'Option B': '150,000 km/s',
      'Correct Answer': 'A',
    },
    {
      section: 'Aptitude',
      type: 'TRUE_FALSE',
      content: 'Water freezes at 0 degrees Celsius.',
      correct: 'True',
    },
  ];

  const result = parseSpreadsheetData(mockRows);
  assert.equal(result.validRows.length, 2);
  assert.equal(result.validRows[0].sectionName, 'Technical Core');
  assert.equal(result.validRows[0].marks, 3.0);
  assert.equal(result.validRows[0].negativeMarks, 0.75);

  // Invariant 2 check: Boolean Standardizing
  const tfRow = result.validRows[1];
  assert.equal(tfRow.options[0].text, 'True');
  assert.equal(tfRow.options[1].text, 'False');
  assert.equal(tfRow.correctAnswers, 'A');
});

test('Empty Option Defense catches invalid correct answer identifiers (Invariant 3)', () => {
  const invalidRows = [
    {
      SectionName: 'Core',
      QuestionType: 'SCQ',
      QuestionContent: 'Which planet is closest to the Sun?',
      Option_A: 'Mercury',
      Option_B: 'Venus',
      // Option_C is omitted
      CorrectAnswer: 'C',
    },
  ];

  const result = parseSpreadsheetData(invalidRows);
  assert.equal(result.invalidRows.length, 1);
  assert.equal(result.validRows.length, 0);
  assert.ok(
    result.allErrors.some((e) =>
      e.error.includes('Correct answer refers to Option_C, which is blank')
    )
  );
});

test('Scoring engine accurately calculates SCQ, MCQ partial credit and negative marking', () => {
  const scqQuestion: Question = {
    id: 'q1',
    sectionId: 's1',
    type: 'SCQ',
    content: 'Capital of France?',
    orderIndex: 0,
    marks: 4.0,
    negativeMarks: 1.0,
    options: [
      { id: 'A', text: 'Paris' },
      { id: 'B', text: 'Berlin' },
    ],
    correctAnswers: 'A',
  };

  const res1 = evaluateQuestion(scqQuestion, {
    questionId: 'q1',
    status: 'ANSWERED',
    savedAnswer: 'A',
    timeSpentSec: 20,
  });
  assert.equal(res1.isCorrect, true);
  assert.equal(res1.scoreAwarded, 4.0);

  const res2 = evaluateQuestion(scqQuestion, {
    questionId: 'q1',
    status: 'ANSWERED',
    savedAnswer: 'B',
    timeSpentSec: 15,
  });
  assert.equal(res2.isCorrect, false);
  assert.equal(res2.scoreAwarded, -1.0);
  assert.equal(res2.negativeMarksApplied, 1.0);

  const mcqQuestion: Question = {
    id: 'q2',
    sectionId: 's1',
    type: 'MCQ',
    content: 'Select prime numbers:',
    orderIndex: 1,
    marks: 6.0,
    negativeMarks: 2.0,
    correctAnswers: ['A', 'C'],
    options: [
      { id: 'A', text: '2' },
      { id: 'B', text: '4' },
      { id: 'C', text: '5' },
    ],
  };

  const res3 = evaluateQuestion(mcqQuestion, {
    questionId: 'q2',
    status: 'ANSWERED',
    savedAnswer: ['A'],
    timeSpentSec: 30,
  });
  assert.equal(res3.scoreAwarded, 3.0);
  assert.equal(res3.negativeMarksApplied, 0);

  const res4 = evaluateQuestion(mcqQuestion, {
    questionId: 'q2',
    status: 'ANSWERED',
    savedAnswer: ['A', 'B'],
    timeSpentSec: 30,
  });
  assert.equal(res4.scoreAwarded, -2.0);
  assert.equal(res4.negativeMarksApplied, 2.0);
});
