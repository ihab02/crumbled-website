import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Flavors | Crumbled',
  description: 'Explore our delicious cookie flavors',
};

export default function FlavorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 