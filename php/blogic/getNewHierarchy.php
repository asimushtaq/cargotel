<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 * Description of getNewHierarchy
 * 
 * Request Parameters:
 * this files recieves the following paramters:
 * template_unit_id - unit_id of selected layer
 *
 * @author Fahad
 */
require_once '../dbconfig/database.php';

class getNewHierarchy {

    //put your code here
    function hierarchy() {
        //reading request parameters
        $data = file_get_contents("php://input");
        $objData = json_decode($data); //template_unit_id
        //getting location layers hierarchy from table 
        $q1 = "SELECT template_id, layer_name "
                . " FROM layer_template "
                . "WHERE template_id = (SELECT MIN(template_id) "
                . "FROM layer_template "
                . " WHERE unit_id = $objData->template_unit_id)";
        $r1 = pg_exec($q1);//executing query
        if (pg_num_rows($r1) > 0) {
            while ($row = pg_fetch_assoc($r1)) {//using while loop to retrieve all records returned by query
                $phpArray[] = $row;
            }
            print(json_encode($phpArray));//json encoding and returning data
        } else {
            echo "-1";
        }
    }

}

$hierarchy = new getNewHierarchy;//instantiating class
$hierarchy->hierarchy();//calling function
?>