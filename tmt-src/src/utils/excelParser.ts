import * as XLSX from 'xlsx';
import { Question, QuestionType, TestSection } from '../types/testforge';

export interface ParsedQuestionRow {
  rowNumber: number;
  sectionName: string;
  questionType: QuestionType;
  questionContent: string;
  marks: number;
  negativeMarks: number;
  options: { id: string; text: string }[];
  correctAnswerRaw: string;
  correctAnswers: string | string[];
  explanation?: string;
  warnings: string[];
  errors: string[];
}

export interface IngestionResult {
  success: boolean;
  totalRows: number;
  validRows: ParsedQuestionRow[];
  invalidRows: ParsedQuestionRow[];
  allWarnings: { row: number; warning: string }[];
  allErrors: { row: number; error: string }[];
  groupedSections: Record<string, ParsedQuestionRow[]>;
}

// Invariant 4: Formula Neutralization
export function sanitizeCellValue(val: any): string {
  if (val === null || val === undefined) return '';
  let str = String(val).trim();
  const dangerousPrefixes = ['=', '+', '-', '@'];
  if (dangerousPrefixes.some((p) => str.startsWith(p))) {
    // Defuse formula interpretation by prepending single quote
    return "'" + str;
  }
  return str;
}

// Invariant 1: Header Normalization
const HEADER_SYNONYMS: Record<string, string> = {
  sectionname: 'SectionName',
  section: 'SectionName',
  sectiontitle: 'SectionName',
  questiontype: 'QuestionType',
  type: 'QuestionType',
  qtype: 'QuestionType',
  questioncontent: 'QuestionContent',
  question: 'QuestionContent',
  content: 'QuestionContent',
  questiontext: 'QuestionContent',
  qtext: 'QuestionContent',
  marks: 'Marks',
  mark: 'Marks',
  points: 'Marks',
  negativemarks: 'NegativeMarks',
  negativemark: 'NegativeMarks',
  penalty: 'NegativeMarks',
  optiona: 'Option_A',
  optionb: 'Option_B',
  optionc: 'Option_C',
  optiond: 'Option_D',
  correctanswer: 'CorrectAnswer',
  correct: 'CorrectAnswer',
  answer: 'CorrectAnswer',
  explanation: 'Explanation',
  notes: 'Explanation',
  rationale: 'Explanation',
};

function normalizeHeaderKey(key: string): string {
  const clean = key.toLowerCase().replace(/[^a-z0-9]/g, '');
  return HEADER_SYNONYMS[clean] || key.trim();
}

export function parseSpreadsheetData(data: Record<string, any>[]): IngestionResult {
  const validRows: ParsedQuestionRow[] = [];
  const invalidRows: ParsedQuestionRow[] = [];
  const allWarnings: { row: number; warning: string }[] = [];
  const allErrors: { row: number; error: string }[] = [];
  const groupedSections: Record<string, ParsedQuestionRow[]> = {};

  data.forEach((rawRow, index) => {
    const rowNumber = index + 2; // Row 1 is header
    const normalized: Record<string, string> = {};

    Object.keys(rawRow).forEach((origKey) => {
      const canonicalKey = normalizeHeaderKey(origKey);
      normalized[canonicalKey] = sanitizeCellValue(rawRow[origKey]);
    });

    const warnings: string[] = [];
    const errors: string[] = [];

    // 1. SectionName validation
    const sectionName = (normalized['SectionName'] || '').trim();
    if (!sectionName) {
      errors.push('SectionName is required and cannot be empty.');
    } else if (sectionName.length > 50) {
      warnings.push(`SectionName "${sectionName}" exceeds 50 characters.`);
    }

    // 2. QuestionType validation
    const rawType = (normalized['QuestionType'] || '').trim().toUpperCase();
    const validTypes: QuestionType[] = [
      'SCQ',
      'MCQ',
      'TRUE_FALSE',
      'FILL_BLANKS',
      'SUBJECTIVE',
      'CODING',
    ];
    let questionType: QuestionType = 'SCQ';
    if (!rawType) {
      errors.push('QuestionType is required.');
    } else if (validTypes.includes(rawType as QuestionType)) {
      questionType = rawType as QuestionType;
    } else {
      errors.push(`Invalid QuestionType "${rawType}". Must be one of: ${validTypes.join(', ')}.`);
    }

    // 3. QuestionContent validation
    const questionContent = (normalized['QuestionContent'] || '').trim();
    if (!questionContent) {
      errors.push('QuestionContent is required.');
    }

    // 4. Marks validation
    let marks = 1.0;
    const rawMarks = normalized['Marks'];
    if (rawMarks !== undefined && rawMarks !== '') {
      const parsed = parseFloat(rawMarks);
      if (isNaN(parsed) || parsed <= 0) {
        errors.push(`Marks must be a positive decimal greater than 0 (got: "${rawMarks}").`);
      } else {
        marks = parsed;
      }
    } else {
      warnings.push('Marks left blank; defaulted to 1.0');
    }

    // 5. NegativeMarks validation
    let negativeMarks = 0.0;
    const rawNeg = normalized['NegativeMarks'];
    if (rawNeg !== undefined && rawNeg !== '') {
      const parsed = parseFloat(rawNeg);
      if (isNaN(parsed) || parsed < 0) {
        errors.push(`NegativeMarks must be a non-negative number >= 0 (got: "${rawNeg}").`);
      } else {
        negativeMarks = parsed;
      }
    } else {
      warnings.push('Negative marks left blank; defaulted to 0.0');
    }

    // Options extraction
    let optA = (normalized['Option_A'] || '').trim();
    let optB = (normalized['Option_B'] || '').trim();
    const optC = (normalized['Option_C'] || '').trim();
    const optD = (normalized['Option_D'] || '').trim();

    // Invariant 2: Boolean Standardizing
    if (questionType === 'TRUE_FALSE') {
      if (!optA) optA = 'True';
      if (!optB) optB = 'False';
    }

    const optionsMap: Record<string, string> = {};
    if (optA) optionsMap['A'] = optA;
    if (optB) optionsMap['B'] = optB;
    if (optC) optionsMap['C'] = optC;
    if (optD) optionsMap['D'] = optD;

    const optionsList = Object.entries(optionsMap).map(([id, text]) => ({ id, text }));

    // Conditional requirement for options on choice types
    if (['SCQ', 'MCQ', 'TRUE_FALSE'].includes(questionType)) {
      if (!optionsMap['A'] || !optionsMap['B']) {
        errors.push(`QuestionType ${questionType} requires at least Option_A and Option_B.`);
      }
    }

    // 6. CorrectAnswer validation
    const rawCorrect = (normalized['CorrectAnswer'] || '').trim();
    let correctAnswers: string | string[] = rawCorrect;

    if (!rawCorrect && questionType !== 'SUBJECTIVE') {
      errors.push('CorrectAnswer is required for this question type.');
    } else if (questionType === 'SCQ' || questionType === 'TRUE_FALSE') {
      let upper = rawCorrect.toUpperCase();
      if (questionType === 'TRUE_FALSE') {
        if (upper === 'TRUE' || upper === 'T') upper = 'A';
        else if (upper === 'FALSE' || upper === 'F') upper = 'B';
      }

      // Invariant 3: Empty Option Defense
      if (!optionsMap[upper]) {
        errors.push(
          `Correct answer refers to Option_${upper}, which is blank or undefined in this row.`
        );
      }
      correctAnswers = upper;
    } else if (questionType === 'MCQ') {
      // Delimited answers, e.g. "A,B" or "A, C"
      const splitted = rawCorrect
        .split(/[,;|]/)
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);

      if (splitted.length === 0) {
        errors.push('MCQ requires at least one correct option identifier.');
      } else {
        splitted.forEach((ans) => {
          if (!optionsMap[ans]) {
            errors.push(
              `Correct answer refers to Option_${ans}, which is blank or undefined in this row.`
            );
          }
        });
        correctAnswers = splitted;
      }
    }

    const explanation = (normalized['Explanation'] || '').trim() || undefined;

    const parsedRow: ParsedQuestionRow = {
      rowNumber,
      sectionName: sectionName || 'Unassigned',
      questionType,
      questionContent,
      marks,
      negativeMarks,
      options: optionsList,
      correctAnswerRaw: rawCorrect,
      correctAnswers,
      explanation,
      warnings,
      errors,
    };

    warnings.forEach((w) => allWarnings.push({ row: rowNumber, warning: w }));
    errors.forEach((e) => allErrors.push({ row: rowNumber, error: e }));

    if (errors.length === 0) {
      validRows.push(parsedRow);
      if (!groupedSections[parsedRow.sectionName]) {
        groupedSections[parsedRow.sectionName] = [];
      }
      groupedSections[parsedRow.sectionName].push(parsedRow);
    } else {
      invalidRows.push(parsedRow);
    }
  });

  return {
    success: invalidRows.length === 0 && validRows.length > 0,
    totalRows: data.length,
    validRows,
    invalidRows,
    allWarnings,
    allErrors,
    groupedSections,
  };
}

export function parseExcelOrCsvFile(fileBuffer: ArrayBuffer): IngestionResult {
  const workbook = XLSX.read(fileBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawData: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  return parseSpreadsheetData(rawData);
}

export function parseCsvText(csvText: string): IngestionResult {
  const workbook = XLSX.read(csvText, { type: 'string' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawData: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  return parseSpreadsheetData(rawData);
}

export function generateSampleCsv(): string {
  const headers = [
    'SectionName',
    'QuestionType',
    'QuestionContent',
    'Marks',
    'NegativeMarks',
    'Option_A',
    'Option_B',
    'Option_C',
    'Option_D',
    'CorrectAnswer',
    'Explanation',
  ];

  const rows = [
    [
      'Technical Core',
      'SCQ',
      'Which data structure implements FIFO (First-In, First-Out)?',
      '2.0',
      '0.5',
      'Stack',
      'Queue',
      'Binary Tree',
      'Priority Queue',
      'B',
      'A queue implements FIFO ordering whereas a stack implements LIFO.',
    ],
    [
      'Technical Core',
      'MCQ',
      'Which of the following sorting algorithms exhibit O(n log n) average time complexity?',
      '3.0',
      '1.0',
      'Merge Sort',
      'Quick Sort',
      'Bubble Sort',
      'Heap Sort',
      'A,B,D',
      'Merge Sort, Quick Sort, and Heap Sort have O(n log n) average time complexity.',
    ],
    [
      'Technical Core',
      'TRUE_FALSE',
      'In JavaScript, primitive strings are mutable.',
      '1.0',
      '0.25',
      'True',
      'False',
      '',
      '',
      'B',
      'Strings in JavaScript are immutable; string methods return new strings.',
    ],
    [
      'Quantitative & Logical',
      'FILL_BLANKS',
      'If 3x + 7 = 28, what is the value of x?',
      '2.0',
      '0.0',
      '',
      '',
      '',
      '',
      '7',
      '3x = 28 - 7 = 21, so x = 7.',
    ],
    [
      'Behavioral & Leadership',
      'SUBJECTIVE',
      'Describe a scenario where you resolved an unexpected production outage or project deadlock under tight deadlines.',
      '5.0',
      '0.0',
      '',
      '',
      '',
      '',
      '',
      'Evaluated on crisis management, communication, root-cause diagnosis, and post-mortem actions.',
    ],
    [
      'Coding Sandbox',
      'CODING',
      'Write a function `isPalindrome(s)` that returns true if the input alphanumeric string is a palindrome ignoring case.',
      '10.0',
      '0.0',
      '',
      '',
      '',
      '',
      'true',
      'Normalize the string by stripping non-alphanumeric characters and comparing forward and reversed.',
    ],
  ];

  const csvRows = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))];
  return csvRows.join('\n');
}

export function convertIngestedRowsToSections(
  testId: string,
  groupedSections: Record<string, ParsedQuestionRow[]>
): TestSection[] {
  return Object.entries(groupedSections).map(([sectionTitle, rows], secIdx) => {
    const sectionId = `sec_${testId}_${secIdx + 1}`;
    let totalMarks = 0;

    const questions: Question[] = rows.map((r, qIdx) => {
      totalMarks += r.marks;
      return {
        id: `q_${sectionId}_${qIdx + 1}`,
        sectionId,
        type: r.questionType,
        content: r.questionContent,
        orderIndex: qIdx,
        marks: r.marks,
        negativeMarks: r.negativeMarks,
        options: r.options.length > 0 ? r.options : undefined,
        correctAnswers: r.correctAnswers,
        explanation: r.explanation,
        wordLimit: r.questionType === 'SUBJECTIVE' ? 300 : undefined,
        codingMetadata:
          r.questionType === 'CODING'
            ? {
                language: 'python',
                boilerplate:
                  'def is_palindrome(s: str) -> bool:\n    # Implement solution\n    pass\n',
                testCases: [
                  {
                    id: 'tc1',
                    input: '"A man, a plan, a canal: Panama"',
                    expectedOutput: 'True',
                    isHidden: false,
                  },
                  {
                    id: 'tc2',
                    input: '"race a car"',
                    expectedOutput: 'False',
                    isHidden: false,
                  },
                  {
                    id: 'tc3',
                    input: '"Was it a car or a cat I saw?"',
                    expectedOutput: 'True',
                    isHidden: true,
                  },
                ],
              }
            : undefined,
      };
    });

    return {
      id: sectionId,
      testId,
      title: sectionTitle,
      orderIndex: secIdx,
      durationMin: Math.max(15, questions.length * 3), // 3 min per question default or min 15
      totalMarks,
      questions,
    };
  });
}
