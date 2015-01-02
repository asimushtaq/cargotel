<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 * Description of LayerMapping
 * 
 * Request Parameters:
 * this file recieves the following parameters:
 * id - id of selected layer
 * parentID - id of parent layer
 * layerGeoms - array of geometries
 * labels - array of labels
 *
 * @author Fahad
 */
require_once '../dbconfig/database.php';

class LayerMapping {

    //put your code here
    function mapping() {
        //reading request parameters
        $data = file_get_contents("php://input");
        $objData = json_decode($data);
        $id = $objData->id; //sibling, current level
        $parentID = $objData->parentID; //parent
        $Geoms = $objData->layerGeoms;
        $labels = $objData->labels;

        for ($i = 0, $len = count($Geoms); $i < $len; $i++) {
            //checking if current geometry lies completly in parent or not
            $i1 = "SELECT gid"
                    . " FROM layer_geometry"
                    . " WHERE ST_Within(ST_SetSRID(ST_Multi(ST_GeomFromGeoJSON('$Geoms[$i]')), 4326), geom) AND "
                    . " layer_id = (SELECT parent_layer_id FROM layer_templates"
                    . " WHERE id = $id)";
            $ri1 = pg_exec($i1);
            if (pg_num_rows($ri1) == "1") {
                $rr = pg_fetch_assoc($ri1);
                $immediate_parent = $rr['gid'];//reading parent's gid
                //checking if current geometry intersects with any of its same hierarchical layers or not
                $i2 = "SELECT gid, label AS name"
                        . " FROM layer_geometry"
                        . " WHERE ST_Intersects(ST_SetSRID(ST_Multi(ST_GeomFromGeoJSON('$Geoms[$i]')), 4326), geom) "
                        . " AND layer_id = $id";
                $ri2 = pg_exec($i2);
                if (pg_num_rows($ri2) == 0) {
                    $l = pg_escape_string($labels[$i]);
                    //inserting geometry in the database table
                    $q1 = "INSERT INTO layer_geometry (parent_id, label, layer_id, geom, unit_id) "
                            . "VALUES($immediate_parent, '$l', $id, ST_SetSRID(ST_Multi(ST_GeomFromGeoJSON('$Geoms[$i]')), 4326), $parentID)";
                    pg_exec($q1);
                } else {
                    $names = "";
                    while ($rowi2 = pg_fetch_assoc($ri2)) {
                        $names.= $rowi2['name'] . " ,";
                    }
                    echo "Intersection with: " . $names;//in the case of intersection, returning the names of layers
                    exit;
                }
            } else {
                echo "Invalid Geometry";
                exit;
            }
        }
        echo "Saved";
    }

}

$d = new LayerMapping;//instantiating class
$d->mapping();//calling function
?>