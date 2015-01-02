<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 * Description of getMSAs
 * 
 * Request Parameters:
 * this file recieves the following parameters:
 * msa - msa name entered by user
 *
 * @author Fahad
 */
require_once '../dbconfig/database.php';

class getMSAs {

    //put your code here
    function msa() {
        //reading request parameters
        $data = file_get_contents("php://input");
        $objData = json_decode($data);
        $msa = strtolower($objData->msa);
        //selecting names from database that mathces the given input
        $q1 = "SELECT  name"
                . " FROM msa_usa WHERE LOWER(name) LIKE '%$msa%'";
        $r1 = pg_exec($q1);//executing querie
        if (pg_num_rows($r1) > 0) {
            while ($row = pg_fetch_assoc($r1)) {//using while loop to read all records that are returned by query
                $phpArray[] = $row['name'];
            }
            print(json_encode($phpArray));//json encoding and returning data
        } else {
//            echo "-1";
        }
    }

}

$d = new getMSAs;//instantiating class
$d->msa();//calling function
?>