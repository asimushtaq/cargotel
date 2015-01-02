<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 * Description of getAttributes
 *
 * @author Fahad
 */
require_once '../dbconfig/database.php';

class getAttributes {

    //put your code here
    function get() {
        //reading attributes from table
        $q1 = "SELECT id, name AS value FROM attributes";
        $r1 = pg_exec($q1);
        if (pg_num_rows($r1) > 0) {
            while ($row = pg_fetch_assoc($r1)) {//using while loop to read all records returned by query
                $phpArray[] = $row;
            }
            print(json_encode($phpArray));//json encoding and returing data
        } else {
            echo "-1";
        }
    }

}

$g = new getAttributes;//instantiating class
$g->get();//calling function
?>