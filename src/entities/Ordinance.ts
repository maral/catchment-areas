import { FeatureCollection } from "@turf/helpers";
import { Allow, Entity, EntityBase, Field, Fields } from "remult";
import { Municipality } from "text-to-map";
import { Founder } from "./Founder";
import { City } from "./City";

@Entity("ordinances", {
  allowApiCrud: Allow.authenticated,
  dbName: "ordinance",
})
export class Ordinance extends EntityBase {
  @Fields.autoIncrement()
  id = 0;

  @Fields.string()
  number = "";

  @Fields.dateOnly({ dbName: "valid_from" })
  validFrom!: Date;

  @Fields.dateOnly({ dbName: "valid_to", allowNull: true })
  validTo?: Date;

  @Fields.boolean({ dbName: "is_active" })
  isActive: boolean = false;

  @Field(() => Founder, { dbName: "founder_id" })
  founder!: Founder;

  @Field(() => City, { dbName: "city_code" })
  city!: City;

  @Fields.string({ dbName: "file_name" })
  fileName: string = "";

  @Fields.string({ dbName: "original_text" })
  originalText: string = "";

  @Fields.json({ dbName: "json_data", allowNull: true })
  jsonData!: Municipality[] | null;

  @Fields.json({ dbName: "polygons", allowNull: true })
  polygons!: FeatureCollection[] | null;
}

/* Migration 29/7/2024

-- ORDINANCE --

ALTER TABLE `ordinance` 
ADD COLUMN `city_code` INT(10) UNSIGNED NULL AFTER `polygons`;

ALTER TABLE `ordinance` 
ADD INDEX `ordinance_city_code_fk_idx` (`city_code` ASC) VISIBLE;
;
ALTER TABLE `ordinance` 
ADD CONSTRAINT `ordinance_city_code_fk`
  FOREIGN KEY (`city_code`)
  REFERENCES `city` (`code`)
  ON DELETE RESTRICT
  ON UPDATE RESTRICT;

UPDATE `ordinance` o
JOIN `founder` f ON o.`founder_id` = f.`id`
  SET o.`city_code` = f.`city_code`;

ALTER TABLE `mapa_spadovosti_npi`.`ordinance` 
DROP FOREIGN KEY `ordinance_city_code_fk`;
ALTER TABLE `mapa_spadovosti_npi`.`ordinance` 
CHANGE COLUMN `founder_id` `founder_id` INT(11) NULL DEFAULT 0 ,
CHANGE COLUMN `city_code` `city_code` INT(10) UNSIGNED NOT NULL ;
ALTER TABLE `mapa_spadovosti_npi`.`ordinance` 
ADD CONSTRAINT `ordinance_city_code_fk`
  FOREIGN KEY (`city_code`)
  REFERENCES `mapa_spadovosti_npi`.`city` (`code`);

ALTER TABLE `mapa_spadovosti_npi`.`ordinance` 
CHANGE COLUMN `ordinance_metadata_id` `ordinance_metadata_id` VARCHAR(255) NULL DEFAULT NULL ;

ALTER TABLE `mapa_spadovosti_npi`.`ordinance` 
ADD INDEX `ordinance:_ordinance_metadata_id_fk_idx` (`ordinance_metadata_id` ASC) VISIBLE;
;
ALTER TABLE `mapa_spadovosti_npi`.`ordinance` 
ADD CONSTRAINT `ordinance:_ordinance_metadata_id_fk`
  FOREIGN KEY (`ordinance_metadata_id`)
  REFERENCES `mapa_spadovosti_npi`.`ordinance_metadata` (`id`)
  ON DELETE SET NULL
  ON UPDATE CASCADE;


-- CITY --

UPDATE city c
SET school_count = IFNULL((
  SELECT COUNT(*)
  FROM founder f
  JOIN school_founder sf ON sf.founder_id = f.id
  WHERE f.city_code = c.code
  GROUP BY f.city_code
), 0);

UPDATE city c
SET status = IFNULL((
  SELECT MAX(status)
  FROM founder f
  WHERE f.city_code = c.code
), 0);

-- STREET_MARKDOWN --

ALTER TABLE `mapa_spadovosti_npi`.`street_markdown` 
ADD COLUMN `founder_id` INT(11) UNSIGNED NULL AFTER `source_text`;

UPDATE `street_markdown` s
JOIN `ordinance` o ON s.`ordinance_id` = o.`id`
  SET s.`founder_id` = o.`founder_id`;

-- delete street_markdown without ordinance connection
DELETE FROM mapa_spadovosti_npi.street_markdown WHERE ordinance_id NOT IN (
	SELECT id FROM ordinance
);

ALTER TABLE `mapa_spadovosti_npi`.`street_markdown` 
CHANGE COLUMN `founder_id` `founder_id` INT(11) UNSIGNED NOT NULL ,
CHANGE COLUMN `ordinance_id` `ordinance_id` INT(11) UNSIGNED NOT NULL ;

ALTER TABLE `mapa_spadovosti_npi`.`street_markdown` 
ADD INDEX `street_markdown_user_id_fk_idx` (`user_id` ASC) VISIBLE,
ADD INDEX `street_markdown_ordinance_id_fk_idx` (`ordinance_id` ASC) VISIBLE,
ADD INDEX `street_markdown_founder_id_fk_idx` (`founder_id` ASC) VISIBLE;
;
ALTER TABLE `mapa_spadovosti_npi`.`street_markdown` 
ADD CONSTRAINT `street_markdown_user_id_fk`
  FOREIGN KEY (`user_id`)
  REFERENCES `mapa_spadovosti_npi`.`user` (`id`)
  ON DELETE RESTRICT
  ON UPDATE CASCADE,
ADD CONSTRAINT `street_markdown_ordinance_id_fk`
  FOREIGN KEY (`ordinance_id`)
  REFERENCES `mapa_spadovosti_npi`.`ordinance` (`founder_id`)
  ON DELETE CASCADE
  ON UPDATE CASCADE
ADD CONSTRAINT `street_markdown_founder_id_fk`
  FOREIGN KEY (`founder_id`)
  REFERENCES `mapa_spadovosti_npi`.`founder` (`id`)
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

-- account FKs

ALTER TABLE `mapa_spadovosti_npi`.`account` 
DROP COLUMN `user`;

ALTER TABLE `mapa_spadovosti_npi`.`account` 
ADD INDEX `account_user_id_fk_idx` (`user_id` ASC) VISIBLE;
;
ALTER TABLE `mapa_spadovosti_npi`.`account` 
ADD CONSTRAINT `account_user_id_fk`
  FOREIGN KEY (`user_id`)
  REFERENCES `mapa_spadovosti_npi`.`user` (`id`)
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- map data

ALTER TABLE `mapa_spadovosti_npi`.`map_data` 
ADD INDEX `map_data_founder_id_fk_idx` (`founder_id` ASC) VISIBLE,
ADD INDEX `map_data_city_code_fk_idx` (`city_code` ASC) VISIBLE,
ADD INDEX `map_data_ordinance_id_fk_idx` (`ordinance_id` ASC) VISIBLE;
;
ALTER TABLE `mapa_spadovosti_npi`.`map_data` 
ADD CONSTRAINT `map_data_founder_id_fk`
  FOREIGN KEY (`founder_id`)
  REFERENCES `mapa_spadovosti_npi`.`founder` (`id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `map_data_city_code_fk`
  FOREIGN KEY (`city_code`)
  REFERENCES `mapa_spadovosti_npi`.`city` (`code`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `map_data_ordinance_id_fk`
  FOREIGN KEY (`ordinance_id`)
  REFERENCES `mapa_spadovosti_npi`.`ordinance` (`id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `mapa_spadovosti_npi`.`map_data` 
CHANGE COLUMN `json_data` `json_data` LONGTEXT NULL DEFAULT NULL ,
CHANGE COLUMN `polygons` `polygons` LONGTEXT NULL DEFAULT NULL ;

ALTER TABLE `mapa_spadovosti_npi`.`map_data` 
DROP FOREIGN KEY `map_data_city_code_fk`,
DROP FOREIGN KEY `map_data_founder_id_fk`;
ALTER TABLE `mapa_spadovosti_npi`.`map_data` 
CHANGE COLUMN `founder_id` `founder_id` INT(11) UNSIGNED NULL DEFAULT NULL ,
CHANGE COLUMN `city_code` `city_code` INT(11) UNSIGNED NULL DEFAULT NULL ;
ALTER TABLE `mapa_spadovosti_npi`.`map_data` 
ADD CONSTRAINT `map_data_city_code_fk`
  FOREIGN KEY (`city_code`)
  REFERENCES `mapa_spadovosti_npi`.`city` (`code`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `map_data_founder_id_fk`
  FOREIGN KEY (`founder_id`)
  REFERENCES `mapa_spadovosti_npi`.`founder` (`id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `mapa_spadovosti_npi`.`map_data` 
ADD UNIQUE INDEX `unique_city_code` (`ordinance_id` ASC, `city_code` ASC) VISIBLE;
ALTER TABLE `mapa_spadovosti_npi`.`map_data` 
ADD UNIQUE INDEX `unique_founder_id` (`founder_id` ASC, `ordinance_id` ASC) VISIBLE;

ALTER TABLE `mapa_spadovosti_npi`.`ordinance_metadata` 
ADD COLUMN `is_new` TINYINT(1) NOT NULL DEFAULT 0 AFTER `is_valid`;

ALTER TABLE `mapa_spadovosti_npi`.`ordinance_metadata` 
ADD COLUMN `city_code` INT(10) NULL DEFAULT NULL AFTER `is_new`;

ALTER TABLE `mapa_spadovosti_npi`.`map_data` 
DROP FOREIGN KEY `map_data_ordinance_id_fk`;
ALTER TABLE `mapa_spadovosti_npi`.`map_data` 
ADD CONSTRAINT `map_data_ordinance_id_fk`
  FOREIGN KEY (`ordinance_id`)
  REFERENCES `mapa_spadovosti_npi`.`ordinance` (`id`)
  ON DELETE CASCADE
  ON UPDATE NO ACTION;

*/
