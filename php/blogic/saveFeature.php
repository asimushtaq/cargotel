<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 * Description of saveFeature
 * 
 * Request Parameters:
 * this file recieves the following parameters:
 * total_levels - total levels entered by user
 * hierarchy_number - hierarchy number of layer
 * level_label - label of layer
 * level_description - description of layer
 * level_icon - icon of layer
 * level_color - color of layer
 * organization_id - selected organization id
 * location_type_id - yard, building etc id
 * selected_attributes - comma seperated attributes
 * feature_geom - layer geometry
 * geom_type - Area , Marker, Line
 * searched_location - searched location by user
 * user_drawing_option - Points on Map, Import etc
 * loc_MT - layer mapping type
 *
 * @author Fahad
 */
require_once '../dbconfig/database.php';

class saveFeature {

    //put your code here
    function save() {
        $image_name = microtime(true);
        $phpArray = array();
        //reading request parameters
        $data = file_get_contents("php://input");
        $objData = json_decode($data);
        $total_floors = $objData->total_levels;
        $total_levels = $objData->hierarchy_number;
        $level_label = pg_escape_string($objData->level_label);
        $level_description = pg_escape_string($objData->level_description);
        $level_icon = $objData->level_icon;
        $level_color = $objData->level_color;
        $organization_id = $objData->organization_id;
        $location_type_id = $objData->location_type_id;
        $selected_attributes = $objData->selected_attributes;
        $feature_geom = $objData->feature_geom;
        $geom_type = $objData->geom_type;
        $searched_location = pg_escape_string($objData->searched_location);
        $user_drawing_option = $objData->user_drawing_option;
        $loc_MT = $objData->loc_MT;
        //checking if another location is already added at this place or not
        $q1 = "SELECT label AS name FROM layer_geometry where ST_Intersects(geom, ST_SetSRID(ST_Multi(ST_GeomFromGeoJSON('$feature_geom')),4326))";

        $r1 = pg_exec($q1);//executing query
        if (pg_num_rows($r1) == "0") {
            //writing image to file system
            $realImages1 = base64_decode(str_replace("data:image/png;base64,", "", $level_icon));
            $path = "usericons/" . $image_name . ".png";
            $handle = fopen($path, 'wb');
            fwrite($handle, $realImages1);
            fclose($handle);
            //inserting data to templates table
            $q2 = "INSERT INTO layer_templates "
                    . "(root_organization_id,  root_layer_id,  parent_layer_id,  label,  level,"
                    . "  icon,  color,  location_type,  layers, description, searched_location, mapping_type, layer_geom_type) "
                    . "VALUES('$organization_id', '$organization_id', NULL, '$level_label', $total_floors,"
                    . " '$path', '$level_color', '$location_type_id', $total_levels, '$level_description', '$searched_location',"
                    . " '$user_drawing_option', '$loc_MT')";

            $r2 = pg_exec($q2);//executing query
            if ($r2) {
                //reading last inserted id in templates table
                $wq = "SELECT MAX(id) AS template_id FROM layer_templates";
                $rwq = pg_exec($wq);
                $rrwq = pg_fetch_assoc($rwq);
                $template_hierarchy_id = $rrwq['template_id'];
                //updating unit_id of templates table
                $qq = "UPDATE layer_templates SET unit_id = $template_hierarchy_id WHERE id = $template_hierarchy_id";
                pg_exec($qq);//executing query

                $col_geom = "";
                //checking geometry type and inserting data in template_geometry table
                if ($geom_type == "marker") {
                    $col_geom = "geom_marker";
                    $q3 = "INSERT INTO layer_geometry (root_organization_id,  parent_id,  label,  layer_id,  $col_geom,  attributes, unit_id)"
                        . " VALUES ('$organization_id', NULL, '$level_label', $template_hierarchy_id,"
                        . " ST_SetSRID((ST_GeomFromGeoJSON('$feature_geom')), 4326), '$selected_attributes', $template_hierarchy_id)";
                } else if ($geom_type == "polyline") {
                    $col_geom = "geom_polyline";
                    $q3 = "INSERT INTO layer_geometry (root_organization_id,  parent_id,  label,  layer_id,  $col_geom,  attributes, unit_id)"
                        . " VALUES ('$organization_id', NULL, '$level_label', $template_hierarchy_id,"
                        . " ST_SetSRID((ST_GeomFromGeoJSON('$feature_geom')), 4326), '$selected_attributes', $template_hierarchy_id)";
                } else if ($geom_type == "polygon") {
                    $col_geom = "geom";
                    $q3 = "INSERT INTO layer_geometry (root_organization_id,  parent_id,  label,  layer_id,  $col_geom,  attributes, unit_id)"
                        . " VALUES ('$organization_id', NULL, '$level_label', $template_hierarchy_id,"
                        . " ST_SetSRID(ST_Multi(ST_GeomFromGeoJSON('$feature_geom')), 4326), '$selected_attributes', $template_hierarchy_id)";
                }
                $r3 = pg_exec($q3);
                if ($r3) {
                    echo "Saved";
                } else {
                    //if geometry is not saved then remove data that has been inserted in templates table too
                    $q4 = "DELETE FROM layer_templates WHERE id=$template_hierarchy_id";
                    pg_exec($q4);//executing query
                    echo $r3;
                }
            } else {
                echo $r2;
            }
        } else {
            $names = "";
            while ($row = pg_fetch_assoc($r1)) {//usign while loop to read all names of layers that have intersection with curernt layer
                $phpArray[] = $row;
                $names.= $row['name'] . " ";
            }
            echo "Intersection with: " . $names;
        }
    }

}

$feature = new saveFeature;//instantiating class
$feature->save();//calling function
?>