-- Run this once in Supabase: SQL Editor -> New query -> paste -> Run
create table if not exists sosx_incidents (
  id       text primary key,
  title    text not null,
  cat      text not null check (cat in ('fire','road','medical','flood','collapse','other')),
  descr    text not null,
  loc      text not null,
  ppl      integer not null default 0 check (ppl >= 0),
  contact  text default '',
  sev      text not null check (sev in ('Low','Medium','High','Critical')),
  why      text default '',
  status   text not null default 'Reported' check (status in ('Reported','Pending','In Progress','Resolved')),
  at       bigint not null,
  lat      double precision,
  lng      double precision
);
create index if not exists incidents_at_idx on sosx_incidents (at desc);

-- Only the server (service_role key) may touch the table; the public anon key gets nothing.
alter table sosx_incidents enable row level security;

-- Sample data (Chennai) so the dashboard and map are not empty on first deploy
insert into sosx_incidents (id,title,cat,descr,loc,ppl,contact,sev,why,status,at,lat,lng) values
('INC-1001','Warehouse fire, Anna Salai','fire','Heavy smoke and flames on second floor, fire spreading to neighbouring unit.','Anna Salai, Chennai',12,'','Critical','Fire Emergency · 12 affected · "spreading" mentioned','In Progress',(extract(epoch from now())*1000)::bigint-240000,13.0604,80.2496),
('INC-1002','Bus collision on OMR','road','Two vehicles collided, several passengers injured.','OMR, Sholinganallur',8,'98400 00000','High','Road Accident · 8 affected','Pending',(extract(epoch from now())*1000)::bigint-1320000,12.901,80.2279),
('INC-1003','Cardiac emergency','medical','Elderly man collapsed, not breathing.','T Nagar, Chennai',1,'','High','Medical Emergency · 1 affected · "collapsed" mentioned','Reported',(extract(epoch from now())*1000)::bigint-2100000,13.0418,80.2341),
('INC-1004','Street flooding','flood','Water level rising, vehicles stuck.','Velachery Main Rd',4,'','Medium','Flood · 4 affected','Pending',(extract(epoch from now())*1000)::bigint-10800000,12.9815,80.218),
('INC-1005','Minor wall crack','other','Compound wall cracked after rain, no injuries.','Adyar, Chennai',0,'','Low','Other Emergencies','Resolved',(extract(epoch from now())*1000)::bigint-32400000,13.0012,80.2565)
on conflict (id) do nothing;
