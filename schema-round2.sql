-- Round 2 migration: response teams + assignment. Run once after schema.sql.
alter table sosx_incidents add column if not exists team text default '';
alter table sosx_incidents drop constraint if exists sosx_incidents_status_check;
alter table sosx_incidents add constraint sosx_incidents_status_check
  check (status in ('Reported','Pending','Assigned','In Progress','Resolved'));

create table if not exists sosx_teams (
  id       text primary key,
  name     text not null,
  cat      text not null check (cat in ('fire','medical','rescue','police','flood')),
  lat      double precision not null,
  lng      double precision not null,
  status   text not null default 'Available' check (status in ('Available','Busy')),
  incident text default ''
);
alter table sosx_teams enable row level security;

insert into sosx_teams (id,name,cat,lat,lng,status,incident) values
('TM-101','Fire Unit Egmore','fire',13.0732,80.2609,'Busy','INC-1001'),
('TM-102','Fire Unit Guindy','fire',13.0067,80.2206,'Available',''),
('TM-201','Ambulance T Nagar','medical',13.0418,80.2341,'Available',''),
('TM-202','Ambulance Adyar','medical',13.0012,80.2565,'Available',''),
('TM-301','Rescue Team Velachery','rescue',12.9791,80.2209,'Available',''),
('TM-401','Traffic Police OMR','police',12.9010,80.2279,'Available',''),
('TM-501','Flood Response Saidapet','flood',13.0213,80.2231,'Available','')
on conflict (id) do nothing;
update sosx_incidents set status='Assigned', team='TM-101' where id='INC-1001' and team='';
