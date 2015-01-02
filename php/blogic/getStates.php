<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 * Description of getStates
 * 
 * Request Parameters:
 * this file recieves the following parameters:
 * state - state name to match
 *
 * @author Fahad
 */
require_once '../dbconfig/database.php';

class getStates {

    //put your code here
    function states() {
        //reading request parameters
        $data = file_get_contents("php://input");
        $objData = json_decode($data);
        $state = strtolower($objData->state);
        //reading states from table that matches the given input
        $q1 = "SELECT name"
                . " FROM states WHERE LOWER(name) LIKE '%$state%'";
        $r1 = pg_exec($q1);//executing query
        if (pg_num_rows($r1) > 0) {
            while ($row = pg_fetch_assoc($r1)) {//using while loop to retrieve all records that are returned by query
                $phpArray[] = $row['name'];
            }
            print(json_encode($phpArray));//json encoding and returning data
        } else {
//            echo "";
        }
    }

}

$d = new getStates;//instantiating class
$d->states();//callling function
?>