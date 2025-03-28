ALTER TABLE `ordinance_metadata` 
ADD COLUMN `city_code` INT(10) NULL DEFAULT NULL AFTER `is_new`;

ALTER TABLE `map_data` 
DROP FOREIGN KEY `map_data_ordinance_id_fk`;
ALTER TABLE `map_data` 
ADD CONSTRAINT `map_data_ordinance_id_fk`
  FOREIGN KEY (`ordinance_id`)
  REFERENCES `ordinance` (`id`)
  ON DELETE CASCADE
  ON UPDATE NO ACTION;