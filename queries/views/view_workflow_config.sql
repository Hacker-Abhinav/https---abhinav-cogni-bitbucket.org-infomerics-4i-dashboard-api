# DROP  VIEW view_workflow_config;

CREATE VIEW 
view_workflow_config
AS
SELECT 
  wc.id as workflow_config_id, 
  wc.uuid, 
  wc.serial_number, 
  wc.is_last_activity, 
  wc.is_active, 
  wc.created_at, 
  wc.updated_at, 
  wc.tat, 
  C.id as current_activity_id, 
  C.uuid as current_activity_uuid, 
  C.code as current_activity_code, 
  C.name as current_activity_name, 
  N.id as next_activity_id, 
  N.uuid as next_activity_uuid, 
  N.code as next_activity_code, 
  N.name as next_activity_name, 
  A.id as assigner_role_id, 
  A.uuid as assigner_role_uuid, 
  A.name as assigner_role_name, 
  P.id as performer_role_id, 
  P.uuid as performer_role_uuid, 
  P.name as performer_role_name, 
  R.id as rating_process_id, 
  R.uuid as rating_process_uuid, 
  R.name as rating_process_name 
FROM  workflow_configs wc 
INNER JOIN activities C ON C.id = wc.current_activity_id 
INNER JOIN activities N ON N.id = wc.next_activity_id
INNER JOIN roles A ON A.id = wc.assigner_role_id
INNER JOIN roles P ON P.id = wc.performer_role_id
INNER JOIN rating_processes  R ON R.id = wc.rating_process_id
WHERE 
 C.is_active=1 AND
 N.is_active=1 AND
 A.is_active=1 AND
 P.is_active=1 AND
 R.is_active=1;