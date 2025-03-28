ALTER TABLE `city`
ADD COLUMN `kindergarten_count` INT(11) NOT NULL DEFAULT 0 AFTER `school_count`,
ADD COLUMN `status_kindergarten` INT(11) NOT NULL DEFAULT 0 AFTER `status_elementary`,
CHANGE COLUMN `status` `status_elementary` INT(11) NOT NULL DEFAULT 0 ;


ALTER TABLE `ordinance` 
DROP COLUMN `polygons`,
DROP COLUMN `json_data`,
DROP COLUMN `founder_id`,
CHANGE COLUMN `city_code` `city_code` INT(10) UNSIGNED NOT NULL AFTER `id`,
ADD COLUMN `school_type` TINYINT(1) NOT NULL DEFAULT 1 AFTER `city_code`;

ALTER TABLE `ordinance_metadata` 
CHANGE COLUMN `city_code` `city_code` INT(10) NULL DEFAULT NULL AFTER `id`,
ADD COLUMN `school_type` TINYINT(1) NOT NULL DEFAULT 1 AFTER `city_code`;

ALTER TABLE `school`
CHANGE COLUMN `type` `type` TINYINT(1) NOT NULL DEFAULT 1 ;

ALTER TABLE `founder`
DROP COLUMN `status`,
ADD COLUMN `kindergarten_count` INT(11) NOT NULL DEFAULT 0 AFTER `school_count`;