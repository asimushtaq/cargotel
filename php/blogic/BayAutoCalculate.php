<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 * Description of BayAutoCalculate
 * 
 * Request Parameter:
 * 
 * this file recieves the following parameters:
 * hr - horizontal line
 * vr - vertical line
 * polygon - user selected polygon
 * parentID - id of selected polygon
 * id - layer id
 * width - width of each bay
 * height - height of each bay
 * rows - total number of rows
 * columns - total number of columns
 * prev_id - id of previous layer
 *
 * @author Fahad
 */
require_once '../dbconfig/database.php';

class BayAutoCalculate {

    //put your code here
    function calculate() {
        //reading request parameters
        $data = file_get_contents("php://input");
        $objData = json_decode($data);

        $hr = $objData->hr;
        $vr = $objData->vr;
        $polygon = $objData->polygon;
        $parentID = $objData->parentID;
        $id = $objData->id;
        
        $width = $objData->width;
        $height = $objData->height;
        $rows = $objData->rows;
        $columns = $objData->columns;
        $prev_id = $objData->prev_id;
        
        //polygons_temp table holds temporary vertical/horizontal lines that are required to calculate bays
        $q = "DELETE FROM polygons_temp";
        pg_exec($q);
        //inserting lines in to polygons_temp table
        $q1 = "INSERT INTO polygons_temp (geom)
             select (st_dump(
   ST_GetLines_In_Both_directions
    (
   (select st_transform(st_geomfromtext('$hr', 4326),900913) ),
   (select st_transform(st_geomfromtext('$vr', 4326),900913) ), 
   (select st_transform(st_geomfromtext('$polygon', 4326),900913) ), $width, $height, $rows, $columns
    )
  )
 ).geom;";
//        echo $q1;
        $r1 = pg_exec($q1);
        if ($r1) {
            //this query generates bays that are within the parent geometry
            $q2 = "SELECT st_astext(st_transform(geom, 4326)) as geom
FROM ST_Dump(
(SELECT ST_SetSRID(ST_Polygonize(ST_GeomFromText(p.geom)),900913) 
  from (select DISTINCT ST_AsText(g.geom) as geom, g.iPoint
	  from (select (ST_Dump(e.geom)).geom,
		       f.ig as iPoint
		  from (SELECT /* This query is the set of each line with each and every line that intersects it */
			       ST_SymDifference((select a.geom from polygons_temp a where a.gid = c.gid),c.geom) as geom
			  FROM (select a.gid as gid, ST_Collect(b.geom) as geom
				  from polygons_temp a, 
				       polygons_temp b
				 where a.gid <> b.gid
				   and ST_Intersects(a.geom,b.geom)
				 group by a.gid
				) as c
			) e, 
		       (select /* Collect the set of all intersection points in a single multipoint geometry */
		               ST_Collect(i.point) as ig
			  from ( select ST_SetSRID(ST_Point(ST_X(a.pnt),ST_Y(a.pnt)),900913) as point
				    from (select ST_Intersection(a.geom,b.geom) as pnt
					    from polygons_temp a, 
					         polygons_temp b
					   where a.gid <> b.gid
 					     and ST_Intersects(a.geom,b.geom)  and GeometryType(ST_Intersection(a.geom,b.geom)) like 'POINT'
				         ) as a
				 group by ST_X(a.pnt), ST_Y(a.pnt)
				 having count(*) > 1
				) i
			) f
		) g
  where /* We only want those linestrings that have an intersection point (see d3) at both ends */
        ST_Intersects(g.ipoint,ST_StartPoint(g.geom)) 
    and ST_Intersects(g.ipoint,ST_EndPoint(g.geom))
     ) As p)) As final where st_within(geom, st_transform(st_geomfromtext('$polygon', 4326), 900913))";// where st_within(geom, st_setsrid(st_geomfromtext('$polygon'), 900913))
//            echo "<br>\n".$q2;
            $r2 = pg_exec($q2);
            //selecting parent id for bays
            $qq2 = "SELECT MAX(gid) AS id FROM layer_geometry "
                    . "WHERE unit_id = $parentID";
//            echo $q2;
            $rr2 = pg_exec($qq2);
            $rrr2 = pg_fetch_assoc($rr2);
            $ID = $rrr2['id'];
            
            //inserting bays into database table
            if (pg_num_rows($r2) > 0) {
                while ($row = pg_fetch_assoc($r2)) {
                    $g = $row['geom'];
                    $qq = "INSERT INTO layer_geometry (parent_id, layer_id, geom, unit_id) "
                            . "VALUES($ID ,$id, st_setsrid(ST_Multi(ST_GeomFromText('$g')), 4326) , $parentID)";
//                    echo $qq;
                    pg_exec($qq);
                }
                echo "Saved";
//                print(json_encode($phpArray));
            } else {
                echo "-1";
            }
        }
        else{
            echo "Invalid Input";
        }
    }

}

$d = new BayAutoCalculate;//instantiating class
$d->calculate();//calling function
?>