import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Construction } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';

export const PhasePlaceholder = ({
  title,
  subtitle,
  phaseNumber,
  phaseName,
  breadcrumbs = [],
}) => {
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader
        title={title}
        description={subtitle}
        breadcrumbs={breadcrumbs}
      />

      <EmptyState
        icon={Construction}
        title={`Under Construction (${phaseName || `Phase ${phaseNumber}`})`}
        description={`This module will be fully built in Phase ${phaseNumber}. Foundation and design system tokens are active.`}
        actionLabel="Explore UI Styleguide"
        onAction={() => navigate('/dev/styleguide')}
      />
    </div>
  );
};

export default PhasePlaceholder;
