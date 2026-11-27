-- Apply after setup.sql. Safe to rerun to enable multiple linked screens.
begin;

alter table happy_pay_private.playlist
  add column if not exists pairing_pin text,
  add column if not exists pairing_expires_at timestamptz,
  add column if not exists pairing_attempts integer not null default 0;

create table if not exists happy_pay_private.display_devices (
  device_hash bytea primary key,
  expires_at timestamptz not null default (clock_timestamp() + interval '365 days')
);

create or replace function public.happy_pay_pair()
returns text language plpgsql security definer set search_path = ''
as $$
declare
  random_bits integer;
  pin text;
begin
  perform public.happy_pay_admin();
  random_bits := ('x' || left(gen_random_uuid()::text, 8))::bit(32)::integer;
  pin := lpad(((random_bits::bigint + 2147483648) % 1000000)::text, 6, '0');
  update happy_pay_private.playlist
    set pairing_pin = pin,
        pairing_expires_at = clock_timestamp() + interval '5 minutes',
        pairing_attempts = 0
    where singleton = true;
  return pin;
end;
$$;

create or replace function public.happy_pay_redeem(pin text)
returns text language plpgsql security definer set search_path = ''
as $$
declare
  device_code text;
  playlist happy_pay_private.playlist%rowtype;
begin
  if pin is null or pin !~ '^[0-9]{6}$' then
    return null;
  end if;

  select * into playlist from happy_pay_private.playlist
    where singleton = true for update;
  if playlist.pairing_pin is null or playlist.pairing_expires_at <= clock_timestamp()
    or playlist.pairing_attempts >= 5 then
    return null;
  end if;

  if playlist.pairing_pin <> pin then
    update happy_pay_private.playlist set pairing_attempts = pairing_attempts + 1
      where singleton = true;
    return null;
  end if;

  device_code := replace(gen_random_uuid()::text, '-', '');
  insert into happy_pay_private.display_devices (device_hash)
    values (sha256(convert_to(device_code, 'UTF8')));
  update happy_pay_private.playlist
    set pairing_pin = null, pairing_expires_at = null, pairing_attempts = 0
    where singleton = true;
  return device_code;
end;
$$;

create or replace function public.happy_pay_display(device_code text, known_revision integer)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  code_hash bytea := sha256(convert_to(device_code, 'UTF8'));
  result jsonb;
begin
  select jsonb_build_object('revision', revision,
    'config', case when revision is distinct from known_revision then config else null end)
    into result from happy_pay_private.playlist
    where singleton = true and length(device_code) = 32 and (
      device_hash = code_hash or exists (
        select 1 from happy_pay_private.display_devices
        where device_hash = code_hash and expires_at > clock_timestamp()
      )
    );
  if result is null then
    raise sqlstate '42501' using message = 'Código de pantalla inválido o revocado.';
  end if;
  return result;
end;
$$;

revoke all on function public.happy_pay_pair() from public, anon, authenticated;
grant execute on function public.happy_pay_pair() to authenticated;
revoke all on function public.happy_pay_redeem(text) from public, anon, authenticated;
grant execute on function public.happy_pay_redeem(text) to anon, authenticated;
revoke all on function public.happy_pay_display(text, integer) from public, anon, authenticated;
grant execute on function public.happy_pay_display(text, integer) to anon, authenticated;

commit;
