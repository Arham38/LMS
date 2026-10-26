import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Edit,
  Download,
  Search,
  Mail,
  Lock,
  MoreVertical,
  ExternalLink,
  Info,
} from 'lucide-react';
import {
  Button,
  IconButton,
  Spinner,
  FormField,
  Input,
  Textarea,
  Select,
  Checkbox,
  Radio,
  Badge,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Avatar,
  Tabs,
  Table,
  Pagination,
  Modal,
  ConfirmDialog,
  DropdownMenu,
  useToast,
  Skeleton,
  EmptyState,
  Breadcrumbs,
  Tooltip,
  ProgressBar,
  StatStrip,
  PageHeader,
} from '../../components/ui';
import { Wordmark } from '../../config/brand';

export const StyleguidePage = () => {
  const toast = useToast();

  // Component state toggles
  const [activeTab, setActiveTab] = useState('components');
  const [btnLoading, setBtnLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableEmpty, setTableEmpty] = useState(false);
  const [tablePage, setTablePage] = useState(1);
  const [progressVal, setProgressVal] = useState(65);
  const [radioVal, setRadioVal] = useState('jazzcash');
  const [checkboxVal, setCheckboxVal] = useState(true);

  const styleguideTabs = [
    { id: 'components', label: 'All UI Components' },
    { id: 'tokens', label: 'Design Tokens & Typography' },
    { id: 'tables-data', label: 'Data Tables & Skeletons' },
    { id: 'dialogs', label: 'Modals, Confirms & Toasts' },
  ];

  const sampleTableData = [
    {
      id: 'STU-001',
      name: 'Ahmed Tariq',
      email: 'ahmed.tariq@gmail.com',
      course: 'MERN Full-Stack',
      amount: 'Rs. 24,000',
      status: 'Approved',
      date: '2026-10-24',
    },
    {
      id: 'STU-002',
      name: 'Fatima Noor',
      email: 'fatima.noor@outlook.com',
      course: 'Python for Engineers',
      amount: 'Rs. 20,000',
      status: 'Pending',
      date: '2026-10-25',
    },
    {
      id: 'STU-003',
      name: 'Bilal Hassan',
      email: 'bilal.hassan@yahoo.com',
      course: 'Applied AI & Deep Learning',
      amount: 'Rs. 28,000',
      status: 'Approved',
      date: '2026-10-25',
    },
    {
      id: 'STU-004',
      name: 'Zainab Bibi',
      email: 'zainab.b@gmail.com',
      course: 'MERN Full-Stack',
      amount: 'Rs. 24,000',
      status: 'Rejected',
      date: '2026-10-26',
    },
  ];

  const tableColumns = [
    {
      key: 'id',
      header: 'ID',
      width: '100px',
      render: (val) => <span className="font-mono text-xs text-ink-muted">{val}</span>,
    },
    {
      key: 'name',
      header: 'Student',
      render: (val, row) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={val} size="sm" />
          <div className="flex flex-col">
            <span className="font-medium text-ink">{val}</span>
            <span className="text-[11px] text-ink-muted font-mono">{row.email}</span>
          </div>
        </div>
      ),
    },
    { key: 'course', header: 'Course' },
    {
      key: 'amount',
      header: 'Tuition Fee',
      align: 'right',
      render: (val) => <span className="font-medium">{val}</span>,
    },
    {
      key: 'status',
      header: 'Enrollment Status',
      render: (val) => {
        const variants = {
          Approved: 'success',
          Pending: 'warning',
          Rejected: 'danger',
        };
        return <Badge variant={variants[val] || 'neutral'} dot>{val}</Badge>;
      },
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (_, row) => (
        <DropdownMenu
          align="right"
          trigger={<IconButton icon={MoreVertical} size="sm" aria-label="Row actions" />}
          items={[
            { label: 'View Profile', onClick: () => toast.info(`Viewing ${row.name}`) },
            { label: 'Verify Payment', onClick: () => toast.success(`Payment verified for ${row.name}`) },
            { divider: true },
            {
              label: 'Delete Record',
              variant: 'danger',
              onClick: () => setIsConfirmOpen(true),
            },
          ]}
        />
      ),
    },
  ];

  const statItems = [
    { label: 'Total Enrolled', value: '148', change: '+12%', changeType: 'increase', helper: 'vs. last cohort' },
    { label: 'Active Sessions', value: '4', change: 'Live today', changeType: 'neutral' },
    { label: 'Tuition Revenue', value: 'Rs. 3.4M', change: '+18.4%', changeType: 'increase', helper: 'JazzCash & IBFT' },
    { label: 'Pending Proofs', value: '7', change: '-2', changeType: 'decrease', helper: 'Requires review' },
  ];

  return (
    <div className="min-h-screen bg-paper text-ink p-6 md:p-10 max-w-6xl mx-auto space-y-12">
      {/* Header */}
      <div className="border-b border-line pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Wordmark textSize="text-xl" />
            <Badge variant="accent">Dev Styleguide</Badge>
          </div>
          <p className="text-sm text-ink-muted">
            Living component verification suite adhering strictly to <code className="text-xs bg-surface-alt px-1 py-0.5 rounded">docs/DESIGN_SYSTEM.md</code>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setBtnLoading(!btnLoading)}
          >
            Toggle Button Loading ({btnLoading ? 'ON' : 'OFF'})
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={styleguideTabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* TAB 1: ALL UI COMPONENTS */}
      {activeTab === 'components' && (
        <div className="space-y-12">
          {/* Section: Buttons */}
          <section className="space-y-4">
            <h3 className="font-display font-semibold text-lg text-ink border-b border-line pb-2">
              1. Buttons (Variants, Sizes & States)
            </h3>
            <p className="text-xs text-ink-muted">
              Heights 36px (sm), 40px (md), 44px (lg). Visible focus ring, spinner inside on loading without layout jump.
            </p>

            <div className="flex flex-wrap gap-4 items-center p-5 bg-surface border border-line rounded-lg">
              <Button variant="primary" size="sm" isLoading={btnLoading}>
                Primary (sm 36)
              </Button>
              <Button variant="primary" size="md" isLoading={btnLoading} leftIcon={Plus}>
                Primary (md 40)
              </Button>
              <Button variant="primary" size="lg" isLoading={btnLoading} rightIcon={ExternalLink}>
                Primary (lg 44)
              </Button>
              <Button variant="secondary" size="md" isLoading={btnLoading}>
                Secondary (md)
              </Button>
              <Button variant="ghost" size="md" isLoading={btnLoading}>
                Ghost (md)
              </Button>
              <Button variant="danger" size="md" isLoading={btnLoading} leftIcon={Trash2}>
                Danger Action
              </Button>
              <Button variant="primary" size="md" disabled>
                Disabled
              </Button>
            </div>
          </section>

          {/* Section: Icon Buttons */}
          <section className="space-y-4">
            <h3 className="font-display font-semibold text-lg text-ink border-b border-line pb-2">
              2. Icon Buttons
            </h3>
            <div className="flex items-center gap-3 p-5 bg-surface border border-line rounded-lg">
              <IconButton icon={Plus} variant="primary" size="sm" aria-label="Add item" />
              <IconButton icon={Edit} variant="secondary" size="md" aria-label="Edit item" />
              <IconButton icon={Trash2} variant="danger" size="md" aria-label="Delete item" />
              <IconButton icon={MoreVertical} variant="ghost" size="md" aria-label="More options" />
              <IconButton icon={Download} variant="secondary" size="lg" aria-label="Download" />
            </div>
          </section>

          {/* Section: Form Fields & Inputs */}
          <section className="space-y-4">
            <h3 className="font-display font-semibold text-lg text-ink border-b border-line pb-2">
              3. Form Controls & Validation States
            </h3>
            <p className="text-xs text-ink-muted">
              Labels above, helper text below, errors with AlertCircle icon in danger color. Max width 560px for forms.
            </p>

            <div className="p-6 bg-surface border border-line rounded-lg max-w-form space-y-4">
              <FormField id="demo-name" label="Full Name" required helperText="As it appears on your CNIC or degree.">
                <Input id="demo-name" placeholder="Muhammad Ali" />
              </FormField>

              <FormField id="demo-email" label="Email Address" required>
                <Input id="demo-email" type="email" placeholder="name@domain.com" leftIcon={Mail} />
              </FormField>

              <FormField id="demo-error" label="Student ID (Validation Error State)" error="Student ID must follow format STU-XXXX">
                <Input id="demo-error" hasError defaultValue="INVALID-123" />
              </FormField>

              <FormField id="demo-course" label="Select Bootcamp">
                <Select id="demo-course">
                  <option value="mern">MERN Full-Stack Bootcamp — Rs. 24,000</option>
                  <option value="python">Python for Engineers — Rs. 20,000</option>
                  <option value="ai">Applied AI & Deep Learning — Rs. 28,000</option>
                </Select>
              </FormField>

              <FormField id="demo-notes" label="Additional Comments / Experience" helperText="Briefly describe your programming background.">
                <Textarea id="demo-notes" placeholder="Describe your experience with JavaScript or Python..." />
              </FormField>

              <div className="pt-2 border-t border-line space-y-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink block">
                  Payment Channels & Options
                </span>
                <Radio
                  id="pay-jazzcash"
                  name="payment_opt"
                  value="jazzcash"
                  label="JazzCash Mobile Account"
                  description="Instant verification using 0300-1234567"
                  checked={radioVal === 'jazzcash'}
                  onChange={() => setRadioVal('jazzcash')}
                />
                <Radio
                  id="pay-ibft"
                  name="payment_opt"
                  value="ibft"
                  label="Direct Bank Transfer (IBFT)"
                  description="Meezan Bank or HBL online transfer"
                  checked={radioVal === 'ibft'}
                  onChange={() => setRadioVal('ibft')}
                />

                <div className="pt-2">
                  <Checkbox
                    id="terms-check"
                    label="I understand that all bootcamp lectures are conducted live without video recordings."
                    checked={checkboxVal}
                    onChange={(e) => setCheckboxVal(e.target.checked)}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section: Badges */}
          <section className="space-y-4">
            <h3 className="font-display font-semibold text-lg text-ink border-b border-line pb-2">
              4. Status Badges
            </h3>
            <div className="flex flex-wrap gap-3 p-5 bg-surface border border-line rounded-lg items-center">
              <Badge variant="primary" dot>Primary (Admin)</Badge>
              <Badge variant="success" dot>Approved (Success)</Badge>
              <Badge variant="warning" dot>Pending Verification</Badge>
              <Badge variant="danger" dot>Payment Rejected</Badge>
              <Badge variant="info" dot>Live Session Now</Badge>
              <Badge variant="accent" dot>6 Seats Left</Badge>
              <Badge variant="neutral">Neutral Tag</Badge>
            </div>
          </section>

          {/* Section: Avatars */}
          <section className="space-y-4">
            <h3 className="font-display font-semibold text-lg text-ink border-b border-line pb-2">
              5. Avatars
            </h3>
            <div className="flex items-center gap-4 p-5 bg-surface border border-line rounded-lg">
              <Avatar name="Ali Khan" size="sm" />
              <Avatar name="Babar Azam" size="md" />
              <Avatar name="Shaheen Afridi" size="lg" />
              <Avatar name="CodeCraft Admin" size="xl" />
            </div>
          </section>

          {/* Section: Progress Bar */}
          <section className="space-y-4">
            <h3 className="font-display font-semibold text-lg text-ink border-b border-line pb-2">
              6. Thin Progress Bar
            </h3>
            <div className="p-5 bg-surface border border-line rounded-lg space-y-4 max-w-md">
              <ProgressBar
                value={progressVal}
                max={100}
                label="Bootcamp Attendance Rate"
                showPercentage
              />
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setProgressVal(Math.max(0, progressVal - 10))}>
                  -10%
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setProgressVal(Math.min(100, progressVal + 10))}>
                  +10%
                </Button>
              </div>
            </div>
          </section>

          {/* Section: Cards */}
          <section className="space-y-4">
            <h3 className="font-display font-semibold text-lg text-ink border-b border-line pb-2">
              7. Cards (Header, Content & Footer)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader
                  title="Upcoming Live Lecture"
                  subtitle="Google Meet link active 15m prior"
                  action={<Badge variant="info" dot>Tonight</Badge>}
                />
                <CardContent className="space-y-2 text-xs">
                  <p className="text-ink font-medium">Session 14: MongoDB Aggregation Pipelines</p>
                  <p className="text-ink-muted">Scheduled for 8:00 PM PKT. Attendance is logged automatically.</p>
                </CardContent>
                <CardFooter>
                  <span>Instructor: Admin</span>
                  <Button variant="primary" size="sm">Enter Classroom</Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader title="Tuition Ledger Summary" subtitle="Cohort 04 Financial Status" />
                <CardContent className="text-xs space-y-2">
                  <div className="flex justify-between py-1 border-b border-line">
                    <span className="text-ink-muted">Confirmed Collections</span>
                    <span className="font-medium tabular-nums text-success">Rs. 456,000</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-ink-muted">Pending Verifications</span>
                    <span className="font-medium tabular-nums text-warning">Rs. 48,000</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <span>Updated 10m ago</span>
                  <Button variant="secondary" size="sm">Download CSV</Button>
                </CardFooter>
              </Card>
            </div>
          </section>
        </div>
      )}

      {/* TAB 2: TOKENS & TYPOGRAPHY */}
      {activeTab === 'tokens' && (
        <div className="space-y-8">
          <section className="space-y-4">
            <h3 className="font-display font-semibold text-lg text-ink border-b border-line pb-2">
              Color Token Swatches
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {[
                { name: 'paper', hex: '#FAF7F2', bg: 'bg-paper', border: 'border border-line' },
                { name: 'surface', hex: '#FFFFFF', bg: 'bg-surface', border: 'border border-line' },
                { name: 'surface-alt', hex: '#F3EEE6', bg: 'bg-surface-alt' },
                { name: 'ink', hex: '#14181F', bg: 'bg-ink', text: 'text-surface' },
                { name: 'ink-muted', hex: '#5E6573', bg: 'bg-[#5E6573]', text: 'text-surface' },
                { name: 'line', hex: '#E7E2D9', bg: 'bg-[#E7E2D9]' },
                { name: 'primary', hex: '#12372A', bg: 'bg-primary', text: 'text-surface' },
                { name: 'primary-soft', hex: '#E3EEE8', bg: 'bg-primary-soft' },
                { name: 'accent', hex: '#D9480F', bg: 'bg-accent', text: 'text-surface' },
                { name: 'accent-soft', hex: '#FDEBDD', bg: 'bg-accent-soft' },
                { name: 'success', hex: '#2F7D4F', bg: 'bg-success', text: 'text-surface' },
                { name: 'warning', hex: '#B7791F', bg: 'bg-warning', text: 'text-surface' },
                { name: 'danger', hex: '#B42318', bg: 'bg-danger', text: 'text-surface' },
                { name: 'info', hex: '#1D5FA6', bg: 'bg-info', text: 'text-surface' },
              ].map((token) => (
                <div key={token.name} className="p-3 bg-surface border border-line rounded-lg text-xs space-y-2">
                  <div className={`h-12 rounded ${token.bg} ${token.border || ''}`} />
                  <div>
                    <span className="font-semibold block text-ink">{token.name}</span>
                    <span className="text-[11px] font-mono text-ink-muted">{token.hex}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="font-display font-semibold text-lg text-ink border-b border-line pb-2">
              Typography Hierarchy
            </h3>
            <div className="p-6 bg-surface border border-line rounded-lg space-y-6">
              <div>
                <span className="text-xs font-mono text-ink-muted uppercase">Display H1 (Fraunces 600, 44px / 60px)</span>
                <h1 className="font-display font-semibold text-4xl text-ink mt-1">
                  Modern Software Engineering Bootcamps
                </h1>
              </div>

              <div>
                <span className="text-xs font-mono text-ink-muted uppercase">Display H2 (Fraunces 600, 32px)</span>
                <h2 className="font-display font-semibold text-3xl text-ink mt-1">
                  Intensive live training with real code reviews
                </h2>
              </div>

              <div>
                <span className="text-xs font-mono text-ink-muted uppercase">Body & Paragraph (Manrope 400, 16px, max 68ch)</span>
                <p className="text-base text-ink-muted mt-1 leading-relaxed max-w-prose">
                  CodeCraft Academy is built for software engineers who require production standards. Every cohort is capped at 25 students to guarantee individual attention during code debugging and architectural reviews.
                </p>
              </div>

              <div>
                <span className="text-xs font-mono text-ink-muted uppercase">Monospace (JetBrains Mono, IDs & Code)</span>
                <p className="font-mono text-sm text-ink mt-1">
                  TXN_ID: PK-JC-98234812398 • SHA256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                </p>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* TAB 3: TABLES & SKELETONS */}
      {activeTab === 'tables-data' && (
        <div className="space-y-8">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-semibold text-lg text-ink">
                  Admin Data Table (44px rows, sticky header, pagination)
                </h3>
                <p className="text-xs text-ink-muted">
                  Includes skeleton loader state, empty state, and kebab actions.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setTableLoading(!tableLoading)}
                >
                  Toggle Skeleton ({tableLoading ? 'ON' : 'OFF'})
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setTableEmpty(!tableEmpty)}
                >
                  Toggle Empty ({tableEmpty ? 'EMPTY' : 'DATA'})
                </Button>
              </div>
            </div>

            <Table
              columns={tableColumns}
              data={tableEmpty ? [] : sampleTableData}
              isLoading={tableLoading}
              emptyTitle="No Student Enrollments Found"
              emptyDescription="No applications have been submitted for this batch yet."
              emptyActionLabel="Create Enrollment Request"
              onEmptyAction={() => toast.info('Enrollment trigger clicked')}
              pagination={{
                page: tablePage,
                limit: 4,
                total: tableEmpty ? 0 : 28,
                totalPages: tableEmpty ? 1 : 7,
              }}
              onPageChange={(p) => setTablePage(p)}
            />
          </section>

          <section className="space-y-4">
            <h3 className="font-display font-semibold text-lg text-ink border-b border-line pb-2">
              Stat Strip (Compact Admin Overview)
            </h3>
            <StatStrip items={statItems} />
          </section>
        </div>
      )}

      {/* TAB 4: MODALS, CONFIRMS & TOASTS */}
      {activeTab === 'dialogs' && (
        <div className="space-y-8">
          <section className="space-y-4">
            <h3 className="font-display font-semibold text-lg text-ink border-b border-line pb-2">
              Accessible Dialogs & Destructive Confirmations
            </h3>
            <p className="text-xs text-ink-muted">
              Never use window.alert, window.confirm or window.prompt. Modals feature focus trap, 200ms fade with 4px rise, and Escape-key closure.
            </p>

            <div className="flex flex-wrap gap-4 p-5 bg-surface border border-line rounded-lg">
              <Button variant="secondary" size="md" onClick={() => setIsModalOpen(true)}>
                Open Standard Modal
              </Button>
              <Button variant="danger" size="md" onClick={() => setIsConfirmOpen(true)}>
                Trigger Destructive ConfirmDialog
              </Button>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="font-display font-semibold text-lg text-ink border-b border-line pb-2">
              Toast Notification System
            </h3>
            <p className="text-xs text-ink-muted">
              Auto-dismiss after 4 seconds, aria-live polite, fixed bottom-right.
            </p>

            <div className="flex flex-wrap gap-3 p-5 bg-surface border border-line rounded-lg">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => toast.success('Tuition proof approved. Student now has full course access.', 'Enrollment Approved')}
              >
                Trigger Success Toast
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => toast.error('Payment receipt image could not be verified. Please retry.', 'Invalid Transaction ID')}
              >
                Trigger Error Toast
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => toast.warning('Live class starts in 15 minutes on Zoom.', 'Upcoming Class')}
              >
                Trigger Warning Toast
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => toast.info('New assignment published: Mongo Aggregations.', 'Course Update')}
              >
                Trigger Info Toast
              </Button>
            </div>
          </section>

          {/* Standard Modal Demo */}
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Add Manual Enrollment"
            description="Manually enroll an off-platform student after offline fee settlement."
          >
            <div className="space-y-4 text-xs">
              <FormField id="modal-email" label="Student Email" required>
                <Input id="modal-email" placeholder="student@example.com" />
              </FormField>
              <FormField id="modal-batch" label="Select Batch">
                <Select id="modal-batch">
                  <option>MERN Full-Stack Bootcamp (Batch 04)</option>
                  <option>Python for Engineers (Batch 02)</option>
                </Select>
              </FormField>
              <div className="pt-4 flex justify-end gap-2">
                <Button variant="secondary" size="md" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    setIsModalOpen(false);
                    toast.success('Student enrolled successfully');
                  }}
                >
                  Confirm Enrollment
                </Button>
              </div>
            </div>
          </Modal>

          {/* Destructive ConfirmDialog Demo */}
          <ConfirmDialog
            isOpen={isConfirmOpen}
            onClose={() => setIsConfirmOpen(false)}
            title="Delete Student Record"
            message="Are you sure you want to permanently remove this student? All homework submissions and attendance records will be purged immediately."
            confirmText="Delete Record"
            cancelText="Cancel"
            isDestructive={true}
            isLoading={confirmLoading}
            onConfirm={() => {
              setConfirmLoading(true);
              setTimeout(() => {
                setConfirmLoading(false);
                setIsConfirmOpen(false);
                toast.success('Record permanently deleted.');
              }, 800);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default StyleguidePage;
