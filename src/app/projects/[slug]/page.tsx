import { ServiceDetail } from '@/components/ServiceDetail';
import React, { JSX } from 'react';

interface ServicePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ServicePage({ params }: ServicePageProps): Promise<JSX.Element> {
  const { slug } = await params;
  return <ServiceDetail projectSlug={slug} />;
}