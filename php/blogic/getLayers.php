<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 * Description of getLayers
 * 
 * Request Parameters:
 * this file recieves the following parameters:
 * unit_id - unit_id of selected layer
 *
 * @author Fahad
 */
require_once '../dbconfig/database.php';

class getLayers {

    //put your code here
    function layers() {
        //reading request parameters
        $unit_id = $_GET['unit_id'];
        //reading data from both template and geometry table using left outer join
        //ST_AsText(layer_geometry.geom) AS geom ,ST_AsText(layer_geometry.geom_marker) AS geom_marker ,ST_AsText(layer_geometry.geom_polyline) AS geom_polyline ,
        $q1 = "SELECT layer_geometry.gid ,  layer_geometry.root_organization_id,  layer_geometry.parent_id ,  "
                . " layer_geometry.label ,  layer_geometry.layer_id ,   "
                . " layer_geometry.attributes ,  layer_geometry.unit_id AS geom_unit_id, layer_geometry.layer_hierarchy AS geom_layer_hierarchy, "
                . " layer_templates.id, layer_templates.label AS value,layer_templates.root_organization_id , "
                . " layer_templates.root_layer_id ,  layer_templates.parent_layer_id ,    layer_templates.level , "
                . " layer_templates.icon ,  layer_templates.color ,  layer_templates.location_type ,  layer_templates.layers , "
                . " layer_templates.description, layer_templates.unit_id, layer_templates.layer_hierarchy AS template_layer_hierarchy, layer_templates.layer_geom_type,"
                . " layer_templates.searched_location, layer_templates.mapping_type"
                . " FROM layer_templates"
                . " LEFT OUTER JOIN layer_geometry"
                . " ON layer_geometry.unit_id = layer_templates.id"
                . " WHERE layer_templates.unit_id = $unit_id"
                . " ORDER BY layer_templates.id";
        $r1 = pg_exec($q1);
        if (pg_num_rows($r1) > 0) {
            while ($row = pg_fetch_assoc($r1)) {
                $phpArray[] = $row;
            }
            //reading geometries as single geojson from database table
            $q2 = "SELECT row_to_json(fc) AS geom
 FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features
 FROM (SELECT 'Feature' As type
    , ST_AsGeoJSON(lg.geom)::json As geometry
    , row_to_json((SELECT l FROM (SELECT gid, label, layer_id) As l
      )) As properties
   FROM layer_geometry As lg  where unit_id = $unit_id order by gid ) As f )  As fc;";
            $r2 = pg_exec($q2);
            if (pg_num_rows($r2) > 0) {
                while ($row2 = pg_fetch_assoc($r2)) {//using while loop to read all records returned by query
                    $phpArray2[] = $row2;
                }
            }
            print(json_encode(array($phpArray, $phpArray2)));//json encoding and returning data
        } else {
            echo "-1";
        }
    }

}

$d = new getLayers;//instantiating class
$d->layers();//calling function 
?>