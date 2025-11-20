import { useEffect, useMemo, useState } from 'react';

const defaultBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:2800';
const defaultPassword = import.meta.env.VITE_API_PASSWORD || 'team007';

const emptyMessage = { type: 'idle', text: '' };

const parseCollection = (payload, key) => {
  if (Array.isArray(payload)) return payload;
  if (payload?._embedded?.[key]) return payload._embedded[key];
  return [];
};

const SectionCard = ({ title, description, children, actions }) => (
  <section className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
    <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 tracking-tight">{title}</h2>
        {description && <p className="mt-1 text-xs text-slate-600">{description}</p>}
      </div>
      {actions && <div className="text-xs text-slate-500">{actions}</div>}
    </div>
    <div className="px-6 py-4 space-y-4">{children}</div>
  </section>
);

const Input = ({ label, ...props }) => (
  <label className="block text-sm font-medium text-slate-700">
    <span>{label}</span>
    <input
      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-inner focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
      {...props}
    />
  </label>
);

const Toggle = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
    <input
      type="checkbox"
      className="h-4 w-4 rounded border-slate-300 text-yellow-400 focus:ring-yellow-400"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
    />
    <span>{label}</span>
  </label>
);

const Table = ({ headers, rows }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-slate-200 text-sm">
      <thead className="bg-slate-100">
        <tr>
          {headers.map((header) => (
            <th
              key={header}
              className="px-4 py-2 text-left font-semibold text-slate-700 uppercase tracking-wide text-xs"
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.length === 0 && (
          <tr>
            <td className="px-4 py-3 text-center text-slate-500" colSpan={headers.length}>
              No data
            </td>
          </tr>
        )}
        {rows.map((cells, index) => (
          <tr key={index} className="hover:bg-slate-50">
            {cells.map((cell, idx) => (
              <td key={idx} className="px-4 py-3 text-slate-700">
                {cell ?? '—'}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

function App() {
  const [apiBase, setApiBase] = useState(defaultBaseUrl);
  const [apiPassword, setApiPassword] = useState(defaultPassword);
  const [students, setStudents] = useState([]);
  const [modules, setModules] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [grades, setGrades] = useState([]);
  const [message, setMessage] = useState(emptyMessage);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [studentForm, setStudentForm] = useState({
    firstName: '',
    lastName: '',
    userName: '',
    email: '',
  });

  const [moduleForm, setModuleForm] = useState({
    code: '',
    name: '',
    mnc: false,
  });

  const [registrationForm, setRegistrationForm] = useState({
    studentId: '',
    moduleId: '',
  });

  const [gradeForm, setGradeForm] = useState({
    studentId: '',
    moduleId: '',
    score: '',
  });

  const apiClient = useMemo(
    () => ({
      async request(path, options = {}) {
        const response = await fetch(`${apiBase}${path}`, {
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          ...options,
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(errorBody || response.statusText);
        }

        if (response.status === 204) return null;
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) return response.json();
        return response.text();
      },
      get: (path) => apiClient.request(path),
      post: (path, body) =>
        apiClient.request(path, {
          method: 'POST',
          body: JSON.stringify(body),
        }),
      put: (path, body) =>
        apiClient.request(path, {
          method: 'PUT',
          body: JSON.stringify(body),
        }),
      del: (path, body) =>
        apiClient.request(path, {
          method: 'DELETE',
          body: body ? JSON.stringify(body) : undefined,
        }),
    }),
    [apiBase]
  );

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(emptyMessage), 4000);
  };

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [studentData, moduleData, registrationData, gradeData] = await Promise.all([
        apiClient.get('/students'),
        apiClient.get('/modules'),
        apiClient.get('/registrations'),
        apiClient.get('/grades'),
      ]);

      setStudents(parseCollection(studentData, 'students'));
      setModules(parseCollection(moduleData, 'modules'));
      setRegistrations(parseCollection(registrationData, 'registrations'));
      setGrades(parseCollection(gradeData, 'grades'));
      showMessage('success', 'Data refreshed successfully');
    } catch (error) {
      console.error(error);
      showMessage('error', `Failed to fetch data: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateStudent = async (event) => {
    event.preventDefault();
    try {
      await apiClient.post('/students', { ...studentForm, password: apiPassword });
      setStudentForm({ firstName: '', lastName: '', userName: '', email: '' });
      showMessage('success', 'Student created successfully');
      loadAll();
    } catch (error) {
      console.error(error);
      showMessage('error', `Failed to create student: ${error.message}`);
    }
  };

  const handleCreateModule = async (event) => {
    event.preventDefault();
    try {
      await apiClient.post('/modules', { ...moduleForm, password: apiPassword });
      setModuleForm({ code: '', name: '', mnc: false });
      showMessage('success', 'Module created successfully');
      loadAll();
    } catch (error) {
      console.error(error);
      showMessage('error', `Failed to create module: ${error.message}`);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    try {
      await apiClient.post('/registrations', {
        studentId: Number(registrationForm.studentId),
        moduleId: Number(registrationForm.moduleId),
        password: apiPassword,
      });
      setRegistrationForm({ studentId: '', moduleId: '' });
      showMessage('success', 'Student registered successfully');
      loadAll();
    } catch (error) {
      console.error(error);
      showMessage('error', `Failed to register student: ${error.message}`);
    }
  };

  const handleGrade = async (event) => {
    event.preventDefault();
    try {
      await apiClient.post('/grades/upsert', {
        studentId: Number(gradeForm.studentId),
        moduleId: Number(gradeForm.moduleId),
        score: Number(gradeForm.score),
        password: apiPassword,
      });
      setGradeForm({ studentId: '', moduleId: '', score: '' });
      showMessage('success', 'Grade saved successfully');
      loadAll();
    } catch (error) {
      console.error(error);
      showMessage('error', `Failed to save grade: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white shadow-sm">
        {/* UCL-style black top bar */}
        <div className="bg-black">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-2">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center rounded-[2px] bg-yellow-400 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-black">
                Awesome University
              </span>
              <span className="text-xs font-medium text-slate-100 uppercase tracking-[0.25em]">
                Computer Science
              </span>
            </div>
            <span className="text-xs text-slate-300">COMP0010 · Group 007</span>
          </div>
        </div>

        {/* Main header content */}
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Student Grades Management System
            </h1>
            <p className="mt-1 text-sm text-slate-600 max-w-2xl">
              A simple admin interface for managing students, modules, registrations and grades.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
            >
              Settings
            </button>
            <button
              onClick={loadAll}
              className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-black shadow hover:bg-yellow-300 focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
            >
              {isLoading ? 'Refreshing…' : 'Refresh Data'}
            </button>
          </div>
        </div>
      </header>

      {/* Settings modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Connection Settings</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Modify API base URL and shared password. Changes will be used when you refresh data.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Input
                label="API Base URL"
                value={apiBase}
                onChange={(event) => setApiBase(event.target.value)}
                placeholder="http://localhost:8080"
              />
              <Input
                label="Shared Password"
                value={apiPassword}
                onChange={(event) => setApiPassword(event.target.value)}
                placeholder="team007"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSettingsOpen(false);
                  loadAll();
                }}
                className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-black shadow hover:bg-yellow-300 focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
              >
                Save &amp; Refresh
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        {message.type !== 'idle' && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
    message.type === 'success'
        ? 'border-green-200 bg-green-50 text-green-700'
        : 'border-rose-200 bg-rose-50 text-rose-700'
}`}
          >
            {message.text}
          </div>
        )}

        {/* Connection Settings card removed, now in header modal */}

        <SectionCard
          title="Student Management"
          description="Create students or view the current student list."
          actions={<span>POST /students</span>}
        >
          <form onSubmit={handleCreateStudent} className="grid gap-3 md:grid-cols-4">
            <Input
              label="First Name"
              value={studentForm.firstName}
              onChange={(event) =>
                setStudentForm({ ...studentForm, firstName: event.target.value })
              }
              required
            />
            <Input
              label="Last Name"
              value={studentForm.lastName}
              onChange={(event) =>
                setStudentForm({ ...studentForm, lastName: event.target.value })
              }
              required
            />
            <Input
              label="Username"
              value={studentForm.userName}
              onChange={(event) =>
                setStudentForm({ ...studentForm, userName: event.target.value })
              }
              required
            />
            <Input
              label="Email"
              type="email"
              value={studentForm.email}
              onChange={(event) =>
                setStudentForm({ ...studentForm, email: event.target.value })
              }
              required
            />
            <div className="md:col-span-4 flex justify-end">
              <button
                type="submit"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-black focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
              >
                Create Student
              </button>
            </div>
          </form>
          <Table
            headers={['ID', 'First', 'Last', 'Username', 'Email']}
            rows={students.map((student) => [
              student.id,
              student.firstName,
              student.lastName,
              student.userName,
              student.email,
            ])}
          />
        </SectionCard>

        <SectionCard
          title="Module Management"
          description="Create modules and view existing modules."
          actions={<span>POST /modules</span>}
        >
          <form onSubmit={handleCreateModule} className="grid gap-3 md:grid-cols-3">
            <Input
              label="Module Code"
              value={moduleForm.code}
              onChange={(event) => setModuleForm({ ...moduleForm, code: event.target.value })}
              required
            />
            <Input
              label="Module Name"
              value={moduleForm.name}
              onChange={(event) => setModuleForm({ ...moduleForm, name: event.target.value })}
              required
            />
            <div className="flex items-end">
              <Toggle
                label="Mandatory module (mnc)"
                checked={moduleForm.mnc}
                onChange={(checked) => setModuleForm({ ...moduleForm, mnc: checked })}
              />
            </div>
            <div className="md:col-span-3 flex justify-end">
              <button
                type="submit"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-black focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
              >
                Create Module
              </button>
            </div>
          </form>
          <Table
            headers={['ID', 'Code', 'Name', 'Mandatory?']}
            rows={modules.map((module) => [
              module.id,
              module.code,
              module.name,
              module.mnc ? 'Yes' : 'No',
            ])}
          />
        </SectionCard>

        <SectionCard
          title="Registration Management"
          description="Register students to modules, or deregister them (DELETE /registrations)."
          actions={<span>POST /registrations</span>}
        >
          <form onSubmit={handleRegister} className="grid gap-3 md:grid-cols-3">
            <Input
              label="Student ID"
              value={registrationForm.studentId}
              onChange={(event) =>
                setRegistrationForm({ ...registrationForm, studentId: event.target.value })
              }
              required
            />
            <Input
              label="Module ID"
              value={registrationForm.moduleId}
              onChange={(event) =>
                setRegistrationForm({ ...registrationForm, moduleId: event.target.value })
              }
              required
            />
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-black focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
              >
                Register Student
              </button>
            </div>
          </form>
          <Table
            headers={['ID', 'Student ID', 'Module ID']}
            rows={registrations.map((registration) => [
              registration.id,
              registration.student?.id,
              registration.module?.id,
            ])}
          />
        </SectionCard>

        <SectionCard
          title="Grade Management"
          description="Insert or update grades via /grades/upsert."
          actions={<span>POST /grades/upsert</span>}
        >
          <form onSubmit={handleGrade} className="grid gap-3 md:grid-cols-4">
            <Input
              label="Student ID"
              value={gradeForm.studentId}
              onChange={(event) =>
                setGradeForm({ ...gradeForm, studentId: event.target.value })
              }
              required
            />
            <Input
              label="Module ID"
              value={gradeForm.moduleId}
              onChange={(event) =>
                setGradeForm({ ...gradeForm, moduleId: event.target.value })
              }
              required
            />
            <Input
              label="Score"
              type="number"
              min="0"
              max="100"
              value={gradeForm.score}
              onChange={(event) =>
                setGradeForm({ ...gradeForm, score: event.target.value })
              }
              required
            />
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-black focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
              >
                Save Grade
              </button>
            </div>
          </form>
          <Table
            headers={['ID', 'Student', 'Module', 'Score']}
            rows={grades.map((grade) => [
              grade.id,
              grade.student?.id,
              grade.module?.id,
              grade.score,
            ])}
          />
        </SectionCard>
      </main>
    </div>
  );
}

export default App;
