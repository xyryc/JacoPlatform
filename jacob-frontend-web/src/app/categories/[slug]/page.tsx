import { Metadata } from 'next';
import CategoryClient from '@/components/sections/CategoryClient';
import { BRAND } from '@/lib/constants';

interface Props {
  params: Promise<{ slug: string }>;
}

const humanizeSlug = (slug: string) =>
  slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const title = `${humanizeSlug(slug)} Services | ${BRAND.name}`;
  const description = `Browse ${humanizeSlug(slug)} services on ${BRAND.name}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  return <CategoryClient slug={slug} />;
}
