-- Run in the Supabase SQL Editor, then grant an existing Auth user access below.
create schema if not exists happy_pay_private;
revoke all on schema happy_pay_private from public;
create table if not exists happy_pay_private.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
create table if not exists happy_pay_private.playlist (
  singleton boolean primary key default true check (singleton),
  config jsonb not null default '{"version":1,"reports":[]}'::jsonb,
  revision integer not null default 0,
  device_hash bytea
);
insert into happy_pay_private.playlist (singleton) values (true) on conflict do nothing;

create or replace function public.happy_pay_admin()
returns jsonb language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (select 1 from happy_pay_private.admins where user_id = auth.uid()) then
    raise sqlstate '42501' using message = 'Acceso administrativo requerido.';
  end if;
  return (select jsonb_build_object('config', config, 'revision', revision)
          from happy_pay_private.playlist);
end;
$$;

create or replace function public.happy_pay_save(data jsonb, expected_revision integer)
returns integer language plpgsql security definer set search_path = ''
as $$
declare updated integer;
begin
  perform public.happy_pay_admin();
  if data->'version' is distinct from '1'::jsonb
     or jsonb_typeof(data->'reports') is distinct from 'array'
     or pg_column_size(data) > 262144 then
    raise sqlstate '22023' using message = 'Configuración inválida o demasiado grande.';
  end if;
  update happy_pay_private.playlist set config = data, revision = revision + 1
    where revision = expected_revision returning revision into updated;
  if updated is null then
    raise sqlstate '40001' using message = 'La lista cambió en otro navegador. Recarga el panel.';
  end if;
  return updated;
end;
$$;

create or replace function public.happy_pay_pair()
returns text language plpgsql security definer set search_path = ''
as $$
declare device_code text := replace(gen_random_uuid()::text, '-', '');
begin
  perform public.happy_pay_admin();
  update happy_pay_private.playlist set device_hash = sha256(convert_to(device_code, 'UTF8'));
  return device_code;
end;
$$;

create or replace function public.happy_pay_display(device_code text, known_revision integer)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare result jsonb;
begin
  select jsonb_build_object('revision', revision,
    'config', case when revision is distinct from known_revision then config else null end)
    into result from happy_pay_private.playlist
    where length(device_code) = 32 and device_hash = sha256(convert_to(device_code, 'UTF8'));
  if result is null then
    raise sqlstate '42501' using message = 'Código de pantalla inválido o revocado.';
  end if;
  return result;
end;
$$;

revoke all on function public.happy_pay_admin() from public, anon, authenticated;
revoke all on function public.happy_pay_save(jsonb, integer) from public, anon, authenticated;
revoke all on function public.happy_pay_pair() from public, anon, authenticated;
revoke all on function public.happy_pay_display(text, integer) from public, anon, authenticated;
grant execute on function public.happy_pay_admin(), public.happy_pay_save(jsonb, integer),
  public.happy_pay_pair() to authenticated;
grant execute on function public.happy_pay_display(text, integer) to anon, authenticated;

-- After creating an email/password user in Authentication > Users, run separately:
-- insert into happy_pay_private.admins (user_id)
-- select id from auth.users where lower(email) = lower('TU_CORREO') on conflict do nothing;
