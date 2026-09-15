create table if not exists study_profiles (
  user_id text primary key,
  total_xp double precision not null default 0,
  level integer not null default 1,
  streak integer not null default 0,
  max_streak integer not null default 0,
  last_study_date date,
  theme text not null default 'dark',
  goal_hours double precision not null default 40,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists study_sessions (
  id serial primary key,
  user_id text not null,
  subject text not null,
  topic text not null,
  session_date date not null,
  start_time text not null,
  end_time text not null,
  duration_minutes integer not null,
  rating integer,
  notes text not null default '',
  source text not null default 'form',
  calendar_synced boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists study_sessions_user_date_idx
  on study_sessions (user_id, session_date desc);

create index if not exists study_sessions_user_id_idx
  on study_sessions (user_id);

create table if not exists study_achievements (
  id serial primary key,
  user_id text not null,
  badge_id text not null,
  name text not null,
  unlocked_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

create index if not exists study_achievements_user_idx
  on study_achievements (user_id);
