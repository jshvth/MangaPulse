-- Allow authenticated users to view other collectors' shelves

create policy "user_mangas_select_authenticated" on public.user_mangas
for select using (auth.role() = 'authenticated');
