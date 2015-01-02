<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 * Description of LayerStyles
 * 
 * Request Parameters:
 * this files recieves the following parameters:
 * id - array of ids of selected layers
 * colors = array of colors of selected layers
 * icons = arrays of icons of selected layers
 *
 * @author Fahad
 */
require_once '../dbconfig/database.php';

class LayerStyles {

    //put your code here
    function style() {
        //reading request parameters
        $data = file_get_contents("php://input");
        $objData = json_decode($data);
        $id = $objData->id;
        $colors = $objData->colors;
        $icons = $objData->icons;

        for ($i = 0, $len = count($id); $i < $len; $i++) {
            //writing image to file system
            $image_name = microtime(true);
            $realImages1 = base64_decode(str_replace("data:image/png;base64,", "", $icons[$i]));
            $path = "usericons/" . $image_name . ".png";
            $handle = fopen($path, 'wb');
            fwrite($handle, $realImages1);
            fclose($handle);

            //updating color and icon of layers
            $q1 = "UPDATE layer_templates SET color = '$colors[$i]', icon = '$path' WHERE id = $id[$i]";
            $r1 = pg_exec($q1);
        }
        echo "Saved";
    }

}

$d = new LayerStyles;//instantiating class
$d->style();//calling fucntion
?>
