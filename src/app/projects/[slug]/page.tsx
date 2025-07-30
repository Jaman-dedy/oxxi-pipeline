import { ServiceDetail } from '@/components/ServiceDetail';
import React, { JSX } from 'react';

interface ServicePageProps {
  params: {
    slug: string;
  };
}

export default function ServicePage({ params }: ServicePageProps): JSX.Element {
  return <ServiceDetail projectSlug={params.slug} />;
}