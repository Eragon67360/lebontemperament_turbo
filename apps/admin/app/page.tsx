import RouteNames from '@/utils/routes';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function Home() {
  const supabase = await createClient();

  const { data } = await supabase.auth.getUser();
  if (data.user) {
    redirect(RouteNames.DASHBOARD.ROOT);
  } else {
    redirect(RouteNames.AUTH.LOGIN);
  }
}
