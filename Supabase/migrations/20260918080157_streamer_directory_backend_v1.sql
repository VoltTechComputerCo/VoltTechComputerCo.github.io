create table if not exists public.streamers (
  login text primary key,
  display_name text,
  profile_image_url text,
  description text,
  enabled boolean not null default true,
  sort_priority integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_profile_sync_at timestamptz,
  constraint streamers_login_lowercase check (login = lower(login)),
  constraint streamers_login_length check (char_length(login) between 1 and 60)
);

create table if not exists public.streamer_status (
  streamer_login text primary key references public.streamers(login) on delete cascade,
  is_live boolean not null default false,
  viewer_count integer not null default 0 check (viewer_count >= 0),
  game_name text not null default '',
  title text not null default '',
  started_at timestamptz,
  last_live_at timestamptz,
  activity_score numeric(8,2) not null default 0 check (activity_score >= 0 and activity_score <= 100),
  checked_at timestamptz not null default now()
);

create index if not exists streamer_status_live_activity_idx
  on public.streamer_status (is_live desc, activity_score desc, viewer_count desc);
create index if not exists streamers_enabled_priority_idx
  on public.streamers (enabled, sort_priority desc, login);

alter table public.streamers enable row level security;
alter table public.streamer_status enable row level security;

drop policy if exists "Public can read enabled streamers" on public.streamers;
create policy "Public can read enabled streamers"
on public.streamers for select to anon, authenticated
using (enabled = true);

drop policy if exists "Public can read enabled streamer status" on public.streamer_status;
create policy "Public can read enabled streamer status"
on public.streamer_status for select to anon, authenticated
using (
  exists (
    select 1 from public.streamers s
    where s.login = streamer_status.streamer_login
      and s.enabled = true
  )
);

grant usage on schema public to anon, authenticated;
grant select on public.streamers, public.streamer_status to anon, authenticated;
revoke insert, update, delete on public.streamers, public.streamer_status from anon, authenticated;

create or replace view public.streamer_directory
with (security_invoker = true)
as
select
  s.login,
  coalesce(nullif(s.display_name, ''), s.login) as display_name,
  coalesce(s.profile_image_url, '') as profile_image_url,
  coalesce(s.description, '') as description,
  st.is_live,
  st.viewer_count,
  st.game_name,
  st.title,
  st.started_at,
  st.last_live_at,
  st.activity_score,
  st.checked_at
from public.streamers s
left join public.streamer_status st on st.streamer_login = s.login
where s.enabled = true;

grant select on public.streamer_directory to anon, authenticated;

insert into public.streamers (login, sort_priority)
values
('zaffa_geek',0),('zulumachinegaming',1),('spyro_za',2),('virtualgemma',3),('theabeasty',4),('thelemons',5),('stephanzas',6),('thendoplays',7),('syernide',8),('snarecasting',9),('wezza_sa',10),('zachjames007',11),('ugcza',12),('techgirlza',13),('sittingduck01',14),('vaano_',15),('viazuu',16),('viking_237',17),('zlorbz',18),('slikkdudebroguy',19),('thegazza',20),('thegiantewok',21),('thejudgeza',22),('waldoliveza',23),('xein_za',24),('wimmas_za',25),('wizardofoz013',26),('wootdini',27),('zurgash',28),('0xdeon',29),('168hours4charity',30),('1handbanditza',31),('1jacqie1',32),('1weazel1',33),('7immy',34),('7necron7',35),('8bitzoe',36),('a50gaming2',37),('a52robohobo',38),('a_m_a_l_i_',39),('abcdean',40),('absolewdlygen',41),('abstractgamingza',42),('ace_writergirl',43),('acearinoza',44),('actt_z',45),('addictiveash28',46),('addison_zn',47),('adele_gamemissy',48),('adm1',49),('aeonicza',50),('aery_',51),('afroskeleton97',52),('aggressivegrey',53),('agriopsgaming',54),('aguppycat',55),('aidancrim',56),('aiminganonymous',57),('ainzie',58),('aizee',59),('alaskacs',60),('alaskayeen',61),('alchemistprime',62),('alialbaster',63),('aliasv',64),('alphacja',65),('alrighty_peach',66),('alwaysanoobgaming',67),('ambiguous27',68),('amuse_za',69),('andbeav',70),('androvaza',71),('angel_lady',72),('anniebrand',73),('anotherbrokegeek',74),('anthonyvv13',75),('antsmiler',76),('apollyon_za',77),('aproposgibbon',78),('areyouauthorized',79),('artemys_plays',80),('artyom_z_stalker',81),('asananica81',82),('asixgg',83),('atk_zone',84),('attagurl',85),('avo_za',86),('avoidza',87),('azebord',88),('azuracub',89),('b3anza',90),('backdoorboogyman',91),('beanie24wp',92),('beasttitan_xv',93),('beemerstein',94),('beexsa',95),('belowaveragesandwich',96),('bertieg',97),('bings_za',98),('bitbeast_za',99),('blackinkeddragon',100),('blekkersa',101),('blocklabs777',102),('blood_raven85',103),('blu3bee',104),('bluebee303',105),('blurryknight',106),('bonuspackagetv',107),('booyaka101',108),('bopilawn',109),('borderlinekevin',110),('bostaktiek',111),('box13_',112),('braki_za',113),('branna_za',114),('brettinfinland',115),('bronsonjay',116),('bronzepot',117),('buffalo_recon',118),('bumfluffski',119),('burg_er',120),('bushido_za',121),('buttons_x',122),('bvdkareem',123),('callmedaf',124),('camceej',125),('cameronpheifferofficial',126),('canafrican87',127),('candi_rocket',128),('caramel',129),('caramelxdj',130),('cardo6r',131),('cashmeretart',132),('cassieroseza',133),('cdvs_purple',134),('cheflow2',135),('chernobylnomad',136),('chessheroes',137),('chickenscoop21',138),('chickenwingerz',139),('chloe_za',140),('choppa_herrlof',141),('chronic_za',142),('chxmbie',143),('clappingdonuts',144),('cloudburstcasts',145),('clumsycaity',146),('coach_ewok',147),('coco_sanity',148),('codecallum',149),('codeine_tv',150),('codexza',151),('comfyvinx',152),('comores1981',153),('complaintzdept',154),('constantine104',155),('cookiemonsterza',156),('cordeliathedm',157),('corneliusdadestroyer',158),('corporalspiral',159),('cpt_cris',160),('cptpoloza',161),('cptsmugg',162),('crazygreek_gaming',163),('creatiffza',164),('crimpapa',165),('crispychipsza',166),('crissykat4400',167),('critzkk',168),('crovza',169),('crueice',170),('cthulouw',171),('cuzzi_za',172),('cyberactors15',173),('cyberkitcat',174),('cybernox69',175),('cyndalive',176),('d3phault',177),('dadbod_datkins',178),('daddycoolza',179),('dailydoseofdysfunctional',180),('daleshand',181),('damasta9',182),('danatdawn',183),('danetblunt',184),('dangerousdavelive',185),('danielkuisis',186),('dannyfreshlife',187),('dark_vagician',188),('darkangel12t',189),('darkmayhem65t',190),('darkwingzsa',191),('darling_kitachu',192),('darthswom',193),('darweezytv',194),('dead_oryx',195),('dealzlol',196),('deathblaizer',197),('deathboxza',198),('deathgamingiam',199),('deathm0g',200),('deathsjokerst',201),('deathsza',202),('debaroni',203),('deckstarg',204),('deepdarkbeast',205),('deliwekun',206),('delphiccookie17',207),('demonbunny89',208),('demondrive6',209),('deosil25',210),('derpy_ruby',211),('desyphermusic',212),('detrony',213),('devthepanda',214),('dezahhhh',215),('dib_gaming',216),('die_drake',217),('digiza',218)
on conflict (login) do update
set enabled = true,
    sort_priority = excluded.sort_priority,
    updated_at = now();

insert into public.streamer_status (streamer_login)
select login from public.streamers where enabled = true
on conflict (streamer_login) do nothing;

comment on table public.streamers is
  'Curated South African Twitch creator directory. Stable identity/configuration; not live status.';
comment on table public.streamer_status is
  'Frequently refreshed Twitch status for curated creators. Written by trusted backend automation, publicly readable.';
comment on view public.streamer_directory is
  'Public read model joining curated streamer identity with latest live status.';
