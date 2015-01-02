<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 * Description of getSelectedRegion
 * 
 * Request Parameters:
 * this file recieves the following parameters:
 * table - table name to query from
 * value - value to match against
 *
 * @author Fahad
 */
require_once '../dbconfig/database.php';

class getSelectedRegion {

    //put your code here
    function region() {
        //reading request parameters
        $data = file_get_contents("php://input");
        $objData = json_decode($data);

        $table = $objData->table;
        $value = strtolower($objData->value);
        //reading geometry from table matching the given input
        $q1 = "SELECT ST_asText(geom) AS geom"
                . " FROM $table"
                . " WHERE LOWER(name) = '$value'";
        $r1 = pg_exec($q1);//executing query
        if (pg_num_rows($r1) > 0) {
            while ($row = pg_fetch_assoc($r1)) {//using while loop to retrieve all records that are returned by query
                $phpArray = $row['geom'];
            }
            echo (($phpArray));//returning data
        } else {
            echo "-1";
        }
    }

}

$d = new getSelectedRegion();//instatiating class
$d->region();//calling function
?>