import { type FC, useState } from 'react';
import type { Student } from '../types';
import Button from './Button';
import ErrorMessage from './ErrorMessage';
import { toBooleanOrNull, toNumberOrNull } from '../api';

export const emptyStudent: Student = {
  firstName: '',
  lastName: '',
  userName: '',
  email: '',
  entryYear: null,
  graduateYear: null,
  major: '',
  tuitionFee: null,
  paidTuitionFee: null,
  birthDate: null,
  homeStudent: null,
  sex: '',
};

interface StudentFormProps {
  initialStudent?: Student;
  onSubmit: (student: Student) => Promise<void>;
  onCancel: () => void;
}

const StudentForm: FC<StudentFormProps> = ({
  initialStudent = emptyStudent,
  onSubmit,
  onCancel,
}) => {
  const [studentForm, setStudentForm] = useState<Student>(initialStudent);
  const [submitting, setSubmitting] = useState(false);
  const [savingError, setSavingError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSavingError('');
    try {
      await onSubmit(studentForm);
    } catch (err) {
      setSavingError(
        err instanceof Error ? err.message : 'Unable to save student',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={studentForm.firstName}
          onChange={(e) =>
            setStudentForm({ ...studentForm, firstName: e.target.value })
          }
          className="field"
          placeholder="First name"
          required
        />
        <input
          value={studentForm.lastName}
          onChange={(e) =>
            setStudentForm({ ...studentForm, lastName: e.target.value })
          }
          className="field"
          placeholder="Last name"
          required
        />
        <input
          value={studentForm.userName}
          onChange={(e) =>
            setStudentForm({ ...studentForm, userName: e.target.value })
          }
          className="field"
          placeholder="Username"
          required
        />
        <input
          type="email"
          value={studentForm.email}
          onChange={(e) =>
            setStudentForm({ ...studentForm, email: e.target.value })
          }
          className="field"
          placeholder="Email"
          required
        />
        <input
          value={studentForm.major ?? ''}
          onChange={(e) =>
            setStudentForm({ ...studentForm, major: e.target.value })
          }
          className="field"
          placeholder="Major"
        />
        <input
          type="number"
          value={studentForm.entryYear ?? ''}
          onChange={(e) =>
            setStudentForm({
              ...studentForm,
              entryYear: toNumberOrNull(e.target.value),
            })
          }
          className="field"
          placeholder="Entry year"
        />
        <input
          type="number"
          value={studentForm.graduateYear ?? ''}
          onChange={(e) =>
            setStudentForm({
              ...studentForm,
              graduateYear: toNumberOrNull(e.target.value),
            })
          }
          className="field"
          placeholder="Graduate year"
        />
        <input
          type="number"
          step="0.01"
          value={studentForm.tuitionFee ?? ''}
          onChange={(e) =>
            setStudentForm({
              ...studentForm,
              tuitionFee: toNumberOrNull(e.target.value),
            })
          }
          className="field"
          placeholder="Tuition fee"
        />
        <input
          type="number"
          step="0.01"
          value={studentForm.paidTuitionFee ?? ''}
          onChange={(e) =>
            setStudentForm({
              ...studentForm,
              paidTuitionFee: toNumberOrNull(e.target.value),
            })
          }
          className="field"
          placeholder="Paid tuition fee"
        />
        <input
          type="date"
          value={studentForm.birthDate ?? ''}
          onChange={(e) =>
            setStudentForm({
              ...studentForm,
              birthDate: e.target.value || null,
            })
          }
          className="field"
          placeholder="Birth date"
        />
        <select
          value={
            studentForm.homeStudent == null ? '' : String(studentForm.homeStudent)
          }
          onChange={(e) =>
            setStudentForm({
              ...studentForm,
              homeStudent: toBooleanOrNull(e.target.value),
            })
          }
          className="field"
        >
          <option value="">Residency status</option>
          <option value="true">Home student</option>
          <option value="false">International</option>
        </select>
        <input
          value={studentForm.sex ?? ''}
          onChange={(e) =>
            setStudentForm({ ...studentForm, sex: e.target.value })
          }
          className="field"
          placeholder="Sex"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          isLoading={submitting}
          aria-label="Save student"
        >
          Save Student
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
      {savingError && (
        <ErrorMessage
          message={savingError}
          title="Student save failed"
          tips={[
            'Ensure all required name and contact fields are filled in.',
            'Confirm the username or email is unique before saving.',
            'Try again after refreshing if you recently signed in or changed roles.',
          ]}
          floating
        />
      )}
    </form>
  );
};

export default StudentForm;
