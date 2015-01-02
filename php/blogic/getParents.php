<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 * Description of getParents
 *
 * @author Fahad
 */
require_once '../dbconfig/database.php';

class getParents {

    //put your code here
    function parents() {
        //reading all locations from database table
        $q1 = "SELECT id, label AS value,root_organization_id ,  root_layer_id ,  parent_layer_id ,    level ,  icon ,  color ,  location_type ,  layers ,  description "
                . " FROM layer_templates"
                . " WHERE parent_layer_id IS NULL";
        $r1 = pg_exec($q1);//executing query
        if (pg_num_rows($r1) > 0) {
            while ($row = pg_fetch_assoc($r1)) {//usign while loop to retrieve all records that are returned by query
                $phpArray[] = $row;
            }
            print(json_encode($phpArray));//json encoding and returning data
        } else {
            echo "-1";
        }
    }

}

$p = new getParents;//instantiating class
$p->parents();//calling function
?>
