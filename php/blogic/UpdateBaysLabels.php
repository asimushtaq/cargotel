<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 * Description of UpdateBaysLabels
 * 
 * Request Parameters:
 * this files recieves the following parameters:
 * gids - array of gids
 * labels - array of labels
 *
 * @author Fahad
 */
require_once '../dbconfig/database.php';

class UpdateBaysLabels {

    //put your code here
    function update() {
        //reading request parameters
        $data = file_get_contents("php://input");
        $objData = json_decode($data);

        $gids = $objData->gids;
        $labels = $objData->labels;
        
        for($i = 0, $len = count($gids); $i < $len; $i++){
            $v = pg_escape_string($labels[$i]);
            //updating bays labels against gids
            $q = "UPDATE layer_geometry SET label = '$v' WHERE gid = $gids[$i]";
            pg_exec($q);
        }
        echo "Label Updated";
    }

}

$d = new UpdateBaysLabels;//instantiating class
$d->update();//calling function
?>