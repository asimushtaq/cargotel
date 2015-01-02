<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 * Description of LayerSettings
 * 
 * Request Parameters:
 * parentID - layer of selected layer
 * labels - array of labels
 * levels - array of levels
 * types - array of types
 * description - array of description
 * numbers - array of total layer number
 * layerHierarchy - array of hierachical level
 *
 * @author Fahad
 */
require_once '../dbconfig/database.php';

class LayerSettings {

    //put your code here
    function settings() {
        //reading request parameters
        $data = file_get_contents("php://input");
        $objData = json_decode($data);
//        var_dump($objData);
        $parentID = $objData->parentID;
        $labels = $objData->labels;
        $levels = $objData->levels;

        $types = $objData->types;
        $description = $objData->description;
        $numbers = $objData->numbers;
        $unitid = $parentID;
        $layer_hierarchy = $objData->layerHierarchy;

//        var_dump($numbers);
        for ($i = 0, $len = count($numbers); $i < $len; $i++) {
            //reading parent id 
            $q2 = "SELECT MAX(id) AS id FROM layer_templates "
                    . "WHERE unit_id = $parentID";
            $r2 = pg_exec($q2);
            $rr2 = pg_fetch_assoc($r2);
            $ID = $rr2['id'];
            if($ID){
                $parentID = $ID;
            }
            if (count($levels) > 0) {
                //inserting data, if the user has entered any level number
                $q1 = "INSERT INTO layer_templates (label, level, description, layers, parent_layer_id, layer_geom_type, unit_id, layer_hierarchy) "
                        . "VALUES('$labels[$i]', $levels[$i], '$description[$i]', $numbers[$i], $parentID, '$types[$i]', $unitid, $layer_hierarchy[$i])";
                $r1 = pg_exec($q1);
            } else if (count($levels) == 0) {
                //inserting data, if the user does have entered any level number
                $q1 = "INSERT INTO layer_templates (label, description, layers, parent_layer_id, layer_geom_type, unit_id, layer_hierarchy) "
                        . "VALUES('$labels[$i]', '$description[$i]', $numbers[$i], $parentID, '$types[$i]', $unitid, $layer_hierarchy[$i])";
                $r1 = pg_exec($q1);
            }
            if ($r1) {
                //selecting parent id for next layer
                $q2 = "SELECT MAX(id) AS id FROM layer_templates "
                        . "WHERE parent_layer_id = $parentID";
                $r2 = pg_exec($q2);
                $rr2 = pg_fetch_assoc($r2);
                $parentID = $rr2['id'];
            } else {
                echo $r1;
            }
        }
        echo "Saved";
    }

}

$d = new LayerSettings;//instantiating class
$d->settings();//calling function
?>