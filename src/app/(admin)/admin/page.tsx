import { routes } from '@/utils/shared/constants';
import { redirect } from 'next/navigation';

export default async function Home() {
  redirect(routes.cities);
}
