<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 * Description of getOrganizations
 *
 * @author Fahad
 */
require_once '../dbconfig/database.php';

class getOrganizations {

    //put your code here
    function gett() {
        //reading all organizations from table
        $q1 = "SELECT name AS name, name AS value FROM organizations_";
        $r1 = pg_exec($q1);//executing query
        if (pg_num_rows($r1) > 0) {
            while ($row = pg_fetch_assoc($r1)) {//using while loop to retrieve all records that are returned by query
                $phpArray[] = $row;
            }
            print(json_encode($phpArray));//json encoding and returning data
        } else {
            echo "-1";
        }
    }

}

$o = new getOrganizations;//instantiating class
$o->gett();//calling fucntion
?>