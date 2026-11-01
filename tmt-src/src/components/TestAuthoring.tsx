import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Question, QuestionType, Test, TestSection } from '../types/testforge';
import { Field, Modal, inputClass, primaryBtn, secondaryBtn } from './Modal';

export const newId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const JOB_ROLE_SUGGESTIONS = [
  'Android Developer',
  'iOS Developer',
  'Frontend Engineer',
  'Backend Engineer',
  'Full-Stack Engineer',
  'QA Engineer',
  'Data Analyst',
  'DevOps Engineer',
  'Product Manager',
  'UI/UX Designer',
  'Customer Support',
  'Sales Executive',
];

const DEFAULT_GUIDELINES =
  'Find a quiet place with a stable internet connection. Do not switch tabs or leave full screen during the test; these actions are recorded. Read each question carefully before answering.';

/* ------------------------------------------------------------------ */
/* Create assessment                                                   */
/* ------------------------------------------------------------------ */

export const CreateTestModal: React.FC<{
  tests: Test[];
  orgId: string;
  authorId: string;
  onCreate: (test: Test) => void;
  onClose: () => void;
}> = ({ tests, orgId, authorId, onCreate, onClose }) => {
  const [title, setTitle] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [description, setDescription] = useState('');
  const [passPercentage, setPassPercentage] = useState(60);
  const [copyFrom, setCopyFrom] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const errors = {
    title: title.trim() ? '' : 'Give the assessment a name.',
    jobRole: jobRole.trim() ? '' : 'Choose or type the job role this test is for.',
    pass:
      passPercentage >= 1 && passPercentage <= 100 ? '' : 'Pass mark must be between 1 and 100.',
  };
  const hasErrors = Object.values(errors).some(Boolean);

  const create = () => {
    setSubmitted(true);
    if (hasErrors) return;
    const id = newId('test');
    const now = new Date().toISOString();
    const source = tests.find((t) => t.id === copyFrom);

    // Copying keeps structure and questions but gives everything fresh ids.
    const sections: TestSection[] = source
      ? source.sections.map((s, sIdx) => {
          const secId = newId('sec');
          return {
            ...s,
            id: secId,
            testId: id,
            orderIndex: sIdx,
            questions: s.questions.map((q, qIdx) => ({
              ...q,
              id: newId('q'),
              sectionId: secId,
              orderIndex: qIdx,
            })),
          };
        })
      : [
          {
            id: newId('sec'),
            testId: id,
            title: 'Section 1',
            description: '',
            orderIndex: 0,
            durationMin: 30,
            questions: [],
          },
        ];

    const test: Test = {
      id,
      orgId,
      authorId,
      jobRole: jobRole.trim(),
      title: title.trim(),
      description: description.trim(),
      guidelines: source?.guidelines || DEFAULT_GUIDELINES,
      totalDurationMin: sections.reduce((a, s) => a + s.durationMin, 0),
      passPercentage,
      negativeMarking: source?.negativeMarking ?? false,
      navigationMode: source?.navigationMode ?? 'FREE',
      shuffleQuestions: source?.shuffleQuestions ?? false,
      isPublished: false,
      sections,
      proctoring: source?.proctoring ?? {
        enforceFullscreen: true,
        maxTabSwitchViolations: 3,
        protectContent: true,
      },
      createdAt: now,
      updatedAt: now,
    };
    onCreate(test);
  };

  return (
    <Modal
      title="New assessment"
      onClose={onClose}
      footer={
        <>
          <button type="button" className={secondaryBtn} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={primaryBtn} onClick={create}>
            Create assessment
          </button>
        </>
      }
    >
      <Field
        label="Assessment name"
        htmlFor="ct-title"
        error={submitted ? errors.title : ''}
      >
        <input
          id="ct-title"
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Android Developer Screening"
          autoFocus
        />
      </Field>

      <Field
        label="Job role"
        htmlFor="ct-role"
        hint="Used to group and find assessments by role."
        error={submitted ? errors.jobRole : ''}
      >
        <input
          id="ct-role"
          className={inputClass}
          value={jobRole}
          onChange={(e) => setJobRole(e.target.value)}
          list="ct-role-list"
          placeholder="Choose or type a role"
        />
        <datalist id="ct-role-list">
          {JOB_ROLE_SUGGESTIONS.map((r) => (
            <option key={r} value={r} />
          ))}
        </datalist>
      </Field>

      <Field label="Description (optional)" htmlFor="ct-desc">
        <textarea
          id="ct-desc"
          className={inputClass}
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What does this test measure?"
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label="Pass mark (%)"
          htmlFor="ct-pass"
          error={submitted ? errors.pass : ''}
        >
          <input
            id="ct-pass"
            type="number"
            inputMode="numeric"
            min={1}
            max={100}
            className={inputClass}
            value={passPercentage}
            onChange={(e) => setPassPercentage(Number(e.target.value))}
          />
        </Field>

        {tests.length > 0 && (
          <Field label="Start from" htmlFor="ct-copy">
            <select
              id="ct-copy"
              className={inputClass}
              value={copyFrom}
              onChange={(e) => setCopyFrom(e.target.value)}
            >
              <option value="">Blank assessment</option>
              {tests.map((t) => (
                <option key={t.id} value={t.id}>
                  Copy of {t.title}
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>
    </Modal>
  );
};

/* ------------------------------------------------------------------ */
/* Add section                                                         */
/* ------------------------------------------------------------------ */

export const SectionModal: React.FC<{
  onSave: (section: { title: string; description: string; durationMin: number }) => void;
  onClose: () => void;
}> = ({ onSave, onClose }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMin, setDurationMin] = useState(15);
  const [submitted, setSubmitted] = useState(false);

  const titleErr = title.trim() ? '' : 'Give the section a name.';
  const durErr = durationMin >= 1 && durationMin <= 300 ? '' : 'Enter 1 to 300 minutes.';

  const save = () => {
    setSubmitted(true);
    if (titleErr || durErr) return;
    onSave({ title: title.trim(), description: description.trim(), durationMin });
  };

  return (
    <Modal
      title="Add section"
      onClose={onClose}
      footer={
        <>
          <button type="button" className={secondaryBtn} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={primaryBtn} onClick={save}>
            Add section
          </button>
        </>
      }
    >
      <Field label="Section name" htmlFor="sec-title" error={submitted ? titleErr : ''}>
        <input
          id="sec-title"
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Kotlin fundamentals"
          autoFocus
        />
      </Field>
      <Field label="Description (optional)" htmlFor="sec-desc">
        <input
          id="sec-desc"
          className={inputClass}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>
      <Field
        label="Time limit (minutes)"
        htmlFor="sec-dur"
        hint="Each section has its own timer."
        error={submitted ? durErr : ''}
      >
        <input
          id="sec-dur"
          type="number"
          inputMode="numeric"
          min={1}
          max={300}
          className={inputClass}
          value={durationMin}
          onChange={(e) => setDurationMin(Number(e.target.value))}
        />
      </Field>
    </Modal>
  );
};

/* ------------------------------------------------------------------ */
/* Add / edit question                                                 */
/* ------------------------------------------------------------------ */

const TYPE_LABELS: Record<Exclude<QuestionType, 'CODING'>, string> = {
  SCQ: 'Single choice',
  MCQ: 'Multiple choice',
  TRUE_FALSE: 'True / False',
  FILL_BLANKS: 'Short answer (exact)',
  SUBJECTIVE: 'Written answer (graded by a reviewer)',
};

const LETTERS = 'ABCDEFGH';

export const QuestionModal: React.FC<{
  test: Test;
  sectionId: string;
  question?: Question;
  onSave: (sectionId: string, question: Question) => void;
  onClose: () => void;
}> = ({ test, sectionId, question, onSave, onClose }) => {
  const editing = !!question;
  const initialType = (question?.type as QuestionType) || 'SCQ';

  const [secId, setSecId] = useState(sectionId);
  const [type, setType] = useState<QuestionType>(initialType);
  const [content, setContent] = useState(question?.content || '');
  const [marks, setMarks] = useState<number>(question?.marks ?? 1);
  const [negative, setNegative] = useState<number>(
    question?.negativeMarks ?? (test.negativeMarking ? 0.25 : 0)
  );
  const [explanation, setExplanation] = useState(question?.explanation || '');
  const [wordLimit, setWordLimit] = useState<number>(question?.wordLimit ?? 200);

  const [options, setOptions] = useState<string[]>(
    question?.options && question.type !== 'TRUE_FALSE'
      ? question.options.map((o) => o.text)
      : ['', '', '', '']
  );
  const toIdx = (ids: string[]) => ids.map((l) => LETTERS.indexOf(l)).filter((i) => i >= 0);
  const [correct, setCorrect] = useState<number[]>(
    question && (question.type === 'SCQ' || question.type === 'MCQ')
      ? toIdx(Array.isArray(question.correctAnswers) ? question.correctAnswers : [String(question.correctAnswers)])
      : []
  );
  const [tfCorrect, setTfCorrect] = useState<'A' | 'B'>(
    question?.type === 'TRUE_FALSE' && question.correctAnswers === 'B' ? 'B' : 'A'
  );
  const [fillAnswer, setFillAnswer] = useState(
    question?.type === 'FILL_BLANKS' ? String(question.correctAnswers || '') : ''
  );
  const [submitted, setSubmitted] = useState(false);

  const filledOptions = options.map((o) => o.trim());
  const choiceType = type === 'SCQ' || type === 'MCQ';

  const errors: Record<string, string> = {};
  if (!content.trim()) errors.content = 'Write the question.';
  if (!(marks > 0)) errors.marks = 'Marks must be more than 0.';
  if (negative < 0) errors.negative = 'Penalty cannot be negative.';
  if (choiceType) {
    if (filledOptions.filter(Boolean).length < 2) errors.options = 'Add at least two answer options.';
    else if (filledOptions.some((o, i) => !o && correct.includes(i)))
      errors.options = 'A correct answer cannot be blank.';
    if (!correct.length) errors.correct = type === 'SCQ' ? 'Mark the correct option.' : 'Mark at least one correct option.';
  }
  if (type === 'FILL_BLANKS' && !fillAnswer.trim()) errors.fill = 'Enter the expected answer.';
  const hasErrors = Object.keys(errors).length > 0;

  const toggleCorrect = (i: number) =>
    setCorrect((prev) =>
      type === 'SCQ' ? [i] : prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    );

  const removeOption = (i: number) => {
    setOptions((prev) => prev.filter((_, idx) => idx !== i));
    setCorrect((prev) => prev.filter((x) => x !== i).map((x) => (x > i ? x - 1 : x)));
  };

  const save = () => {
    setSubmitted(true);
    if (hasErrors) return;
    const targetSection = test.sections.find((s) => s.id === secId);
    const q: Question = {
      id: question?.id || newId('q'),
      sectionId: secId,
      type,
      content: content.trim(),
      orderIndex: question && question.sectionId === secId ? question.orderIndex : targetSection?.questions.length || 0,
      marks,
      negativeMarks: negative,
      explanation: explanation.trim() || undefined,
    };
    if (choiceType) {
      // Re-letter options after dropping blank ones, remapping the correct answers.
      const keep = filledOptions.map((t, i) => ({ t, i })).filter((x) => x.t);
      q.options = keep.map((x, n) => ({ id: LETTERS[n], text: x.t }));
      const correctLetters = keep
        .map((x, n) => (correct.includes(x.i) ? LETTERS[n] : ''))
        .filter(Boolean);
      q.correctAnswers = type === 'SCQ' ? correctLetters[0] : correctLetters;
    } else if (type === 'TRUE_FALSE') {
      q.options = [
        { id: 'A', text: 'True' },
        { id: 'B', text: 'False' },
      ];
      q.correctAnswers = tfCorrect;
    } else if (type === 'FILL_BLANKS') {
      q.correctAnswers = fillAnswer.trim();
    } else if (type === 'SUBJECTIVE') {
      q.wordLimit = wordLimit > 0 ? wordLimit : undefined;
    }
    onSave(secId, q);
  };

  return (
    <Modal
      wide
      title={editing ? 'Edit question' : 'Add question'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={secondaryBtn} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={primaryBtn} onClick={save}>
            {editing ? 'Save changes' : 'Add question'}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Section" htmlFor="q-sec">
          <select id="q-sec" className={inputClass} value={secId} onChange={(e) => setSecId(e.target.value)}>
            {test.sections.map((s, i) => (
              <option key={s.id} value={s.id}>
                {i + 1}. {s.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Question type" htmlFor="q-type">
          <select
            id="q-type"
            className={inputClass}
            value={type}
            disabled={editing && initialType === 'CODING'}
            onChange={(e) => {
              setType(e.target.value as QuestionType);
              setCorrect([]);
            }}
          >
            {(Object.keys(TYPE_LABELS) as (keyof typeof TYPE_LABELS)[]).map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
            {initialType === 'CODING' && <option value="CODING">Coding</option>}
          </select>
        </Field>
      </div>

      <Field label="Question" htmlFor="q-content" error={submitted ? errors.content : ''}>
        <textarea
          id="q-content"
          className={inputClass}
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type the question candidates will see"
          autoFocus
        />
      </Field>

      {choiceType && (
        <fieldset>
          <legend className="text-sm font-semibold text-slate-800 mb-1.5">
            Answer options{' '}
            <span className="font-normal text-slate-500">
              ({type === 'SCQ' ? 'select the one correct answer' : 'select every correct answer'})
            </span>
          </legend>
          <div className="space-y-2">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type={type === 'SCQ' ? 'radio' : 'checkbox'}
                  name="q-correct"
                  checked={correct.includes(i)}
                  onChange={() => toggleCorrect(i)}
                  aria-label={`Option ${LETTERS[i]} is correct`}
                  className="w-4 h-4 accent-[var(--color-accent)] cursor-pointer shrink-0"
                />
                <span className="w-5 text-sm font-semibold text-slate-500 shrink-0">{LETTERS[i]}</span>
                <input
                  className={inputClass}
                  value={opt}
                  onChange={(e) =>
                    setOptions((prev) => prev.map((o, idx) => (idx === i ? e.target.value : o)))
                  }
                  aria-label={`Option ${LETTERS[i]} text`}
                  placeholder={`Option ${LETTERS[i]}`}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(i)}
                    aria-label={`Remove option ${LETTERS[i]}`}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {options.length < LETTERS.length && (
            <button
              type="button"
              onClick={() => setOptions((prev) => [...prev, ''])}
              className="mt-2 text-sm font-semibold text-accent hover:text-accent-hover flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add option
            </button>
          )}
          {submitted && (errors.options || errors.correct) && (
            <p role="alert" className="text-[13px] text-red-600 mt-1.5">
              {errors.options || errors.correct}
            </p>
          )}
        </fieldset>
      )}

      {type === 'TRUE_FALSE' && (
        <fieldset>
          <legend className="text-sm font-semibold text-slate-800 mb-1.5">Correct answer</legend>
          <div className="flex gap-6">
            {(['A', 'B'] as const).map((v) => (
              <label key={v} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="q-tf"
                  checked={tfCorrect === v}
                  onChange={() => setTfCorrect(v)}
                  className="w-4 h-4 accent-[var(--color-accent)]"
                />
                {v === 'A' ? 'True' : 'False'}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {type === 'FILL_BLANKS' && (
        <Field
          label="Expected answer"
          htmlFor="q-fill"
          hint="Matched exactly, ignoring upper/lower case."
          error={submitted ? errors.fill : ''}
        >
          <input
            id="q-fill"
            className={inputClass}
            value={fillAnswer}
            onChange={(e) => setFillAnswer(e.target.value)}
          />
        </Field>
      )}

      {type === 'SUBJECTIVE' && (
        <Field
          label="Word limit"
          htmlFor="q-words"
          hint="A reviewer scores written answers in the Submissions tab."
        >
          <input
            id="q-words"
            type="number"
            inputMode="numeric"
            min={0}
            className={inputClass}
            value={wordLimit}
            onChange={(e) => setWordLimit(Number(e.target.value))}
          />
        </Field>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Marks" htmlFor="q-marks" error={submitted ? errors.marks : ''}>
          <input
            id="q-marks"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.25"
            className={inputClass}
            value={marks}
            onChange={(e) => setMarks(Number(e.target.value))}
          />
        </Field>
        <Field
          label="Penalty for a wrong answer"
          htmlFor="q-neg"
          hint={test.negativeMarking ? undefined : 'Only applies when negative marking is on.'}
          error={submitted ? errors.negative : ''}
        >
          <input
            id="q-neg"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.25"
            className={inputClass}
            value={negative}
            onChange={(e) => setNegative(Number(e.target.value))}
          />
        </Field>
      </div>

      <Field label="Explanation (optional)" htmlFor="q-exp" hint="Shown to reviewers with the answer.">
        <textarea
          id="q-exp"
          className={inputClass}
          rows={2}
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
        />
      </Field>
    </Modal>
  );
};
