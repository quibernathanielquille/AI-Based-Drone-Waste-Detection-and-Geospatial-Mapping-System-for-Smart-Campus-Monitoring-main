-- Run this in phpMyAdmin if you already imported the old schema/sample data
USE smart_campus_waste;

UPDATE waste_detections SET waste_category = 'biodegradable'
  WHERE waste_category IN ('organic', 'mixed', 'other', 'hazardous', 'electronic');

UPDATE waste_detections SET waste_category = 'cardboard'
  WHERE waste_category NOT IN ('biodegradable', 'cardboard', 'glass', 'metal', 'paper', 'plastic');

UPDATE analytics_logs SET metric_key = 'biodegradable'
  WHERE metric_type = 'category_count' AND metric_key IN ('organic', 'mixed', 'other', 'hazardous', 'electronic');

ALTER TABLE waste_detections
  MODIFY waste_category ENUM(
    'biodegradable', 'cardboard', 'glass', 'metal', 'paper', 'plastic'
  ) NOT NULL DEFAULT 'plastic';
