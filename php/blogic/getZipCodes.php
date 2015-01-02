<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 * Description of getZipCodes
 * 
 * Request Parameters:
 * this files recieves the following parameter:
 * zipcode - zipcode to match against
 *
 * @author Fahad
 */
require_once '../dbconfig/database.php';

class getZipCodes {

    //put your code here
    function zip() {
        //reading request parameters
        $data = file_get_contents("php://input");
        $objData = json_decode($data);
        $zipcode = $objData->zipcode;
        //selecting all zipcodes that matches the given input
        $q1 = "SELECT  name"
                . " FROM zipcodes WHERE name LIKE '%$zipcode'";
        $r1 = pg_exec($q1);//executing queries
        if (pg_num_rows($r1) > 0) {
            while ($row = pg_fetch_assoc($r1)) {//using while loop to retrieve all records that are returned by query
                $phpArray[] = $row['name'];
            }
            print(json_encode($phpArray));//json encoding and returning data
        } else {
//            echo "-1";
        }
    }

}

$z = new getZipCodes;//instantiating class
$z->zip();//calling function
?>