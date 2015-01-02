<?php

/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 * Description of getTemplateHierarchy
 * 
 * Request Parameters:
 * this files recieves the following parameters:
 * parent_id - organization id
 *
 * @author Fahad
 */
require_once '../dbconfig/database.php';

class getTemplateHierarchy {

    //put your code here
    function hierarchy() {
        //reading request parameters
        $data = file_get_contents("php://input");
        $objData = json_decode($data);
        $parent_id = $objData->parent_id;
        //reading parents under selected root organization
                $q1 = "SELECT id AS template_id, label AS layer_name, unit_id"
                        . " FROM layer_templates"
                        . " WHERE root_organization_id = '$parent_id' AND parent_layer_id IS NULL"
                        . " ORDER BY id";
        $result = pg_exec($q1);//executing queries

        $template_id = array();
        $layer_name = array();
        $unit_id = array();
        if ($result != null) {
            while ($row = pg_fetch_assoc($result)) {
                //using while loop to read data
                array_push($template_id, $row['template_id']);
                array_push($layer_name, $row['layer_name']);
                array_push($unit_id, $row['unit_id']);
            }
            $final = array();
            $geom_template = array();
            for ($i = 0, $len = count($template_id); $i < $len; $i++) {//this loop will run total locations times that are selected above
                $main = array();
                //reading sub layers under each location
                $q2 = "SELECT id ,  root_organization_id ,  root_layer_id ,  parent_layer_id ,  label ,  level ,  icon ,  "
                        . "color ,  location_type ,  layers ,  description ,  layer_geom_type , unit_id ,  layer_hierarchy"
                        . " FROM layer_templates"
                        . " WHERE unit_id = $unit_id[$i] AND parent_layer_id IS NOT NULL";
                $r2 = pg_exec($q2);//executing query
                $c = 0;
                if ($r2 != null) {
                    while ($row2 = pg_fetch_assoc($r2)) {//using while loop to retrieve data
                        array_push($main, $row2);
                        array_push($geom_template, $row2['id']);
                    }
                }
                $mm = array();
                $age = array("id" => $template_id[$i], "value" => $layer_name[$i], "unit_id" => $unit_id[$i], "sub" => $main);//creating an arary of locations with sub layers of each location
                array_push($final, $age);
                $c = 0;
//                exit;
            }
            $final_response = array("facility"=>$final);//creating final array
            print(json_encode($final_response));//json encoding and returning data
        } else {
            echo "Error : ... " . $result;
        }
    }

}

$level = new getTemplateHierarchy;//instantiating class
$level->hierarchy();//calling function
?>
