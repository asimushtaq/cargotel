<?php

/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

//database connection string
$dbconn3 = pg_connect("host=localhost port=5432 dbname=cargotel_ user=postgres password=123qwe")
        or die("Error in connection" . pg_last_error());
?>
