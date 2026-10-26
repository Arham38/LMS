import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import courseService from '../../services/course.service';
import {
  PageHeader,
  Card,
  CardHeader,
  CardContent,
  FormField,
  Input,
  Textarea,
  Select,
  Checkbox,
  Button,
  useToast,
  Skeleton,
} from '../../components/ui';

const courseFormSchema = z.object({
  title: z.string().trim().min(3, 'Title is required').max(120),
  tagline: z.string().trim().min(3, 'Tagline is required').max(200),
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced', 'All Levels']),
  durationWeeks: z.coerce.number().int().min(1).max(52),
  schedule: z.string().trim().min(3, 'Schedule is required (e.g. Tue & Thu 8 to 10 PM PKT)'),
  startDate: z.string().min(1, 'Start date is required'),
  seatsTotal: z.coerce.number().int().min(1).max(500),
  fee: z.coerce.number().min(0, 'Fee cannot be negative'),
  installmentsAllowed: z.boolean().default(false),
  installmentPlan: z.string().trim().optional(),
  isPublished: z.boolean().default(false),
  isEnrollmentOpen: z.boolean().default(true),
  syllabus: z
    .array(
      z.object({
        order: z.coerce.number().default(1),
        title: z.string().trim().min(1, 'Module title is required'),
        topicsText: z.string().optional(), // Entered as comma-separated or newline-separated
      })
    )
    .default([]),
  outcomesText: z.string().optional(),
  requirementsText: z.string().optional(),
});

export const AdminCourseEditorPage = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const toast = useToast();

  const [loadingCourse, setLoadingCourse] = useState(isEditing);
  const [serverError, setServerError] = useState('');

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      title: '',
      tagline: '',
      description: '',
      level: 'All Levels',
      durationWeeks: 12,
      schedule: 'Tue & Thu 8:00 PM - 10:00 PM PKT',
      startDate: new Date().toISOString().split('T')[0],
      seatsTotal: 25,
      fee: 24000,
      installmentsAllowed: false,
      installmentPlan: '',
      isPublished: true,
      isEnrollmentOpen: true,
      syllabus: [
        { order: 1, title: 'Foundations & Architecture', topicsText: 'Event Loop, Async I/O, Express Middleware' },
        { order: 2, title: 'Database Modeling & Performance', topicsText: 'Schemas, Aggregations, Indexing' },
      ],
      outcomesText: 'Build and deploy REST APIs\nModel MongoDB production schemas\nDeploy with Docker and cloud',
      requirementsText: 'Basic programming familiarity\nLaptop with 8GB RAM',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'syllabus',
  });

  useEffect(() => {
    if (!isEditing) return;

    const fetchCourse = async () => {
      setLoadingCourse(true);
      try {
        const data = await courseService.getAdminCourseById(id);
        reset({
          title: data.title || '',
          tagline: data.tagline || '',
          description: data.description || '',
          level: data.level || 'All Levels',
          durationWeeks: data.durationWeeks || 12,
          schedule: data.schedule || '',
          startDate: data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : '',
          seatsTotal: data.seatsTotal || 25,
          fee: data.fee || 0,
          installmentsAllowed: !!data.installmentsAllowed,
          installmentPlan: data.installmentPlan || '',
          isPublished: !!data.isPublished,
          isEnrollmentOpen: !!data.isEnrollmentOpen,
          syllabus: (data.syllabus || []).map((m) => ({
            order: m.order,
            title: m.title,
            topicsText: (m.topics || []).join(', '),
          })),
          outcomesText: (data.outcomes || []).join('\n'),
          requirementsText: (data.requirements || []).join('\n'),
        });
      } catch (err) {
        toast.error(err.message || 'Failed to load course details.');
        navigate('/admin/courses');
      } finally {
        setLoadingCourse(false);
      }
    };

    fetchCourse();
  }, [id, isEditing, reset]);

  const onSubmit = async (values) => {
    setServerError('');
    try {
      // Parse syllabus topics and lists
      const syllabus = (values.syllabus || []).map((m, idx) => ({
        order: idx + 1,
        title: m.title,
        topics: (m.topicsText || '')
          .split(/[,\n]/)
          .map((t) => t.trim())
          .filter(Boolean),
      }));

      const outcomes = (values.outcomesText || '')
        .split('\n')
        .map((o) => o.trim())
        .filter(Boolean);

      const requirements = (values.requirementsText || '')
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean);

      const payload = {
        title: values.title,
        tagline: values.tagline,
        description: values.description,
        level: values.level,
        durationWeeks: values.durationWeeks,
        schedule: values.schedule,
        startDate: new Date(values.startDate),
        seatsTotal: values.seatsTotal,
        fee: values.fee,
        installmentsAllowed: values.installmentsAllowed,
        installmentPlan: values.installmentPlan,
        isPublished: values.isPublished,
        isEnrollmentOpen: values.isEnrollmentOpen,
        syllabus,
        outcomes,
        requirements,
      };

      if (isEditing) {
        await courseService.updateCourse(id, payload);
        toast.success('Course updated successfully.');
      } else {
        await courseService.createCourse(payload);
        toast.success('Course created successfully.');
      }

      navigate('/admin/courses');
    } catch (err) {
      setServerError(err.message || 'Failed to save course.');
    }
  };

  if (loadingCourse) {
    return (
      <div className="py-8 space-y-4 max-w-form">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title={isEditing ? 'Edit Bootcamp Course' : 'Create New Bootcamp'}
        description="Configure cohort parameters, schedule, curriculum topics, and seat capacity."
        breadcrumbs={[
          { label: 'Admin', to: '/admin/dashboard' },
          { label: 'Courses', to: '/admin/courses' },
          { label: isEditing ? 'Edit' : 'New' },
        ]}
      />

      {serverError && (
        <div className="p-3.5 bg-danger-soft border border-danger/30 rounded text-xs text-danger flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        {/* SECTION 1: BASIC INFORMATION */}
        <Card>
          <CardHeader title="1. Basic Information" subtitle="Course title, level, and overview summary." />
          <CardContent className="space-y-4">
            <FormField id="c-title" label="Course Title" required error={errors.title?.message}>
              <Input id="c-title" placeholder="e.g. MERN Full-Stack Bootcamp (Batch 04)" hasError={!!errors.title} {...register('title')} />
            </FormField>

            <FormField id="c-tagline" label="Short Tagline" required error={errors.tagline?.message} helperText="Appears on course cards and marketing listings">
              <Input id="c-tagline" placeholder="e.g. Master modern full-stack web engineering..." hasError={!!errors.tagline} {...register('tagline')} />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField id="c-level" label="Skill Level" required>
                <Select id="c-level" {...register('level')}>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="All Levels">All Levels</option>
                </Select>
              </FormField>

              <FormField id="c-duration" label="Duration (Weeks)" required error={errors.durationWeeks?.message}>
                <Input id="c-duration" type="number" min={1} max={52} {...register('durationWeeks')} />
              </FormField>
            </div>

            <FormField id="c-desc" label="Full Description" required error={errors.description?.message} helperText="Detailed curriculum narrative and teaching style">
              <Textarea id="c-desc" rows={4} {...register('description')} />
            </FormField>
          </CardContent>
        </Card>

        {/* SECTION 2: SCHEDULE, CAPACITY & TUITION */}
        <Card>
          <CardHeader title="2. Schedule, Capacity & Fee" subtitle="Tuition fee in PKR, class schedule, and maximum seats." />
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField id="c-fee" label="Tuition Fee (PKR)" required error={errors.fee?.message}>
                <Input id="c-fee" type="number" placeholder="24000" {...register('fee')} />
              </FormField>

              <FormField id="c-seats" label="Total Seats Cap" required error={errors.seatsTotal?.message} helperText="Strict cohort limit">
                <Input id="c-seats" type="number" min={1} max={500} {...register('seatsTotal')} />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField id="c-start" label="Start Date" required error={errors.startDate?.message}>
                <Input id="c-start" type="date" {...register('startDate')} />
              </FormField>

              <FormField id="c-sched" label="Class Schedule" required error={errors.schedule?.message} helperText="e.g. Tue & Thu 8:00 PM - 10:00 PM PKT">
                <Input id="c-sched" placeholder="Tue & Thu 8:00 PM - 10:00 PM PKT" {...register('schedule')} />
              </FormField>
            </div>

            <div className="pt-2 border-t border-line space-y-3">
              <Checkbox
                id="c-installments"
                label="Allow installment payments for this cohort"
                {...register('installmentsAllowed')}
              />

              <FormField id="c-inst-plan" label="Installment Plan Terms" helperText="e.g. 2 equal installments of Rs. 12,000">
                <Input id="c-inst-plan" placeholder="2 installments of Rs. 12,000 (Week 1 and Week 8)" {...register('installmentPlan')} />
              </FormField>
            </div>

            <div className="pt-2 border-t border-line flex flex-wrap gap-6">
              <Checkbox
                id="c-published"
                label="Course is Published (visible on website)"
                {...register('isPublished')}
              />
              <Checkbox
                id="c-enroll-open"
                label="Admissions are Open (accepting enrollments)"
                {...register('isEnrollmentOpen')}
              />
            </div>
          </CardContent>
        </Card>

        {/* SECTION 3: SYLLABUS BUILDER */}
        <Card>
          <CardHeader
            title="3. Syllabus Builder"
            subtitle="Define numbered editorial modules and topic lists."
            action={
              <Button
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={Plus}
                onClick={() => append({ order: fields.length + 1, title: '', topicsText: '' })}
              >
                Add Module
              </Button>
            }
          />
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 bg-surface-alt/40 border border-line rounded space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-accent">
                    MODULE {String(index + 1).padStart(2, '0')}
                  </span>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-xs text-danger hover:underline inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                <FormField id={`mod-title-${index}`} label="Module Title" required>
                  <Input
                    id={`mod-title-${index}`}
                    placeholder="e.g. Node.js Core & Asynchronous Runtime"
                    {...register(`syllabus.${index}.title`)}
                  />
                </FormField>

                <FormField id={`mod-topics-${index}`} label="Topics (comma or newline separated)">
                  <Input
                    id={`mod-topics-${index}`}
                    placeholder="Event Loop, Libuv, Streams, Express Router"
                    {...register(`syllabus.${index}.topicsText`)}
                  />
                </FormField>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* SECTION 4: OUTCOMES & PREREQUISITES */}
        <Card>
          <CardHeader title="4. Outcomes & Prerequisites" subtitle="Lists of learning targets and student requirements (one per line)." />
          <CardContent className="space-y-4">
            <FormField id="c-outcomes" label="What Students Will Build & Master (One per line)">
              <Textarea
                id="c-outcomes"
                rows={3}
                placeholder="Build production REST APIs with Node.js&#10;Model complex MongoDB schemas&#10;Write automated tests with Jest"
                {...register('outcomesText')}
              />
            </FormField>

            <FormField id="c-reqs" label="Hardware & Skill Prerequisites (One per line)">
              <Textarea
                id="c-reqs"
                rows={3}
                placeholder="Basic JavaScript familiarity&#10;Laptop with 8GB RAM and stable broadband"
                {...register('requirementsText')}
              />
            </FormField>
          </CardContent>
        </Card>

        {/* Submit Actions */}
        <div className="flex items-center justify-between pt-4">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={() => navigate('/admin/courses')}
            leftIcon={ArrowLeft}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
          >
            {isEditing ? 'Save Course Changes' : 'Create Bootcamp Course'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminCourseEditorPage;
