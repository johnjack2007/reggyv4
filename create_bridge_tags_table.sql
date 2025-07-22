create table if not exists bridge_tags (
  tag text primary key,
  follow_ups jsonb,
  recommended_action text
); 