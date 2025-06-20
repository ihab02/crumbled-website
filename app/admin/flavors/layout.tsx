import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Manage Flavors | Crumbled Admin',
  description: 'Manage cookie flavors in the admin dashboard',
};

export default function AdminFlavorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 