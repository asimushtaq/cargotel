/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var app = angular.module("CargoTel", ['autocomplete']);
var map, map2, drawnItems, drawControl, newCenter_lat = 0, newCenter_lon = 0;
var parent_id = -1, immediate_parent_id = -1, template_hierarchy_id, feature_geom, operation_id, copy_paste_style;
var all_layers = [], layers_for_intersection = [], layers_otherthan_intersection = [], layer_to_edit, layers_group, editable_layer;// = L.geoJson();
var target_type = "", no_fill_style, remove_style, draggable_marker, geom_edit_check = 0, gid = -1, delete_layers;
var organization_id, location_type_id, total_levels, hierarchy_number, level_label, level_description, level_color, level_icon;
var selected_attributes, cloned_layers_length = 1, cloned_layerstyle_length = 1, cloned_layermapping_length = 1;
var s, isPreview = 0, user_drawing_option = "", HrVrLayers = [], bay_check = 0;

/* AngularJS Controller*/
app.controller("getTemplates", function($scope, $http, $compile, DBOrganizations, WKT, General, Map) {
    $scope.vertices_counter = 2;
    $scope.vertices_counter_mapping = 2;
    $scope.layer_counter = 2;
    $scope.attributes_counter = 2;
    $scope.layer_style_counter = 2;
    $scope.layer_mapping_counter = 2;
    $scope.bay_label_counter = 2;
    $scope.location_layer_check = 1;

    /* PHP Services*/
    $scope.template_hierarchy = "php/blogic/getTemplateHierarchy.php";
    $scope.get_hierarchy = "php/blogic/getHierarchy.php";
    $scope.new_hierarchy = "php/blogic/getNewHierarchy.php";
    $scope.get_states = "php/blogic/getStates.php";
    $scope.get_msas = "php/blogic/getMSAs.php";
    $scope.get_zipcodes = "php/blogic/getZipCodes.php";
    $scope.get_layers = "php/blogic/getLayers.php";
    $scope.layer_settings = "php/blogic/LayerSettings.php";
    $scope.layer_styles = "php/blogic/LayerStyles.php";
    $scope.layer_mapping = "php/blogic/LayerMapping.php";
    $scope.bay_autocalculate = "php/blogic/BayAutoCalculate.php";
    $scope.update_bays_labels = "php/blogic/UpdateBaysLabels.php";
    $scope.submit_feature = "php/blogic/saveFeature.php";
    /*Variables to enable/disable inputs*/
    $scope.isDisable = false;
    $scope.disable_add_layer_button = false;
    $scope.disable_add_style_button = false;
    $scope.disable_add_sublayer_button = false;
    /* Array location types */
    $scope.location_types = [
        {
            id: 1, value: "Property"
        }, {
            id: 2, value: "Building"
        }, {
            id: 3, value: "Building/Yard"
        }, {
            id: 4, value: "Yard"
        }, {
            id: 5, value: "Region"
        }];
    /* Array of drawing options on map with region*/
    $scope.drawing_options_region = [
        {
            id: 1, value: "Points on Map"
        }, {
            id: 2, value: "Enter Coordinates"
        }, {
            id: 3, value: "Import"
        }, {
            id: 4, value: "Region"
        }];
    /* Array of drawing options on map without region*/
    $scope.drawing_options_noregion = [
        {
            id: 1, value: "Points on Map"
        }, {
            id: 2, value: "Enter Coordinates"
        }, {
            id: 3, value: "Import"
        }];
    /* Array of drawing options on map in the case of bays autocalculation*/
    $scope.drawing_options_layer = [
        {
            id: 1, value: "Points on Map"
        }, {
            id: 2, value: "Enter Coordinates"
        }, {
            id: 3, value: "Import"
        }, {
            id: 4, value: "AutoCalculte"
        }];
    /* Array of region options while drawing on map*/
    $scope.region_options = [
        {
            id: 1, value: "State"
        }, {
            id: 2, value: "MSA"
        }, {
            id: 3, value: "Zipcodes"
        }];
    $scope.optionVal = -1;
    /* Array of location/layer types */
    $scope.drawlayertypes = [{
            id: 1, value: "Marker"
        },
        {
            id: 2, value: "Line"
        },
        {
            id: 3, value: "Area"
        }
    ];
    /* Function to check if location tab is curently opened or layer tab */
    $scope.Location = function() {
        $scope.location_layer_check = 1;
    };
    /* Function to check if location tab is curently opened or layer tab */
    $scope.Layer = function() {
        $scope.location_layer_check = 2;
    };
    /* Function to show selected drawing control on map and hide others */
    $scope.GetDrawingOption = function() {
        var val = $scope.drawingOption;        
        $scope.vertices_counter = 2;
        General.SetDrawingOption(val);
    };
    /* Function to store selected organization id  */
    $scope.GetOrganization = function() {
        organization_id = $scope.organization_val;
    };
    /* Function to enable/disable inputs and to add/remove drawing options*/
    $scope.GetLocationType = function() {
        location_type_id = $scope.location_type;
        if (location_type_id == 1 || location_type_id == 5) {
            $scope.isDisable = true;
            $scope.total_levels = 0;
        }
        else {
            $scope.isDisable = false;
            $scope.total_levels = null;
        }
        if (location_type_id == 5) {
            $scope.drawing_options = $scope.drawing_options_region;
        }
        else {
            $scope.drawing_options = $scope.drawing_options_noregion;
        }
        for (var j = 0, len = $scope.location_types.length; j < len; j++) {
            if (location_type_id == $scope.location_types[j].id) {
                $scope.user_loc_type = $scope.location_types[j].value;
            }
        }
    };
    /* Function to show selected color in mapping tab 
     * Input: selected color*/
    $scope.GetColor = function(style) {
        $scope.selected_color = style;
        level_color = style;
        copy_paste_style.color = style;
        jQuery('#setLColor_1').css('background-color', style).css('display', 'block');
    };
    /* Function to read imported file while drawing 
     * Input: file content*/
    $scope.showContent = function($fileContent) {
        $scope.content = $fileContent;
        $scope.ImportGeoJSON($scope.content);
    };
    /* Fucntion to add geomtery on map using vertices input in location tab*/
    $scope.DrawVertices = function() {
        WKT.RemoveUserLayer();
        var vertices = [];
        for (var i = 1; i <= $scope.vertices_counter - 1; i++) {
            vertices.push([parseFloat(jQuery("#lat_" + i).val()), parseFloat(jQuery("#lng_" + i).val())]);
        }
        user_layer = new L.Polygon(vertices);
        user_layer.setStyle(copy_paste_style);
        map.addLayer(user_layer);
        map.fitBounds(user_layer.getBounds());
        feature_geom = JSON.stringify(user_layer.toGeoJSON().geometry);
        drawnItems.addLayer(user_layer);
    };
    /* Fucntion to add geomtery on map using vertices input in layer tab
     * Input: AngularJS event*/
    $scope.DrawLMappingVertices = function(event) {
        var id = event.explicitOriginalTarget.id.split("_")[1];
        WKT.RemoveUserLayer();
        var vertices = [];
        for (var i = 1; i <= $scope.vertices_counter_mapping - 1; i++) {
            vertices.push([parseFloat(jQuery("#lat_" + id + "_" + i).val()), parseFloat(jQuery("#lng_" + id + "_" + i).val())]);
        }
        user_layer = new L.Polygon(vertices);
        user_layer.setStyle(copy_paste_style);
        map.addLayer(user_layer);
        map.fitBounds(user_layer.getBounds());
        feature_geom = JSON.stringify(user_layer.toGeoJSON().geometry);
        drawnItems.addLayer(user_layer);
        /******saving data in arrays******/
        layerLabels[$scope.layer_mapping_counter - 2] = jQuery("#layermappinglabel_" + ($scope.layer_mapping_counter - 1)).val();
        layerGeoms[$scope.layer_mapping_counter - 2] = feature_geom;
        /******saving data in arrays******/
    };
    /* Function to store selected attributes */
    $scope.AddAttributes = function() {
        var _attributes = new Array();
        var attr = "";
        for (var i = 1; i <= $scope.attributes_counter - 1; i++) {
            var key = jQuery("#attr_" + i + " :selected").text();
            attr += key + ", ";
            _attributes.push(key);
        }
        var count = General.CheckRedundant(_attributes);
        if (count == 0) {
            $scope.selectdAttr = attr;
            selected_attributes = _attributes.join(",");
        }
        else {
            alert("Invalid Attribute selection");
            selected_attributes = null;
        }
    };
    /* Function to replicate vertices input while drawing in location tab*/
    $scope.CloneHTML = function() {
        var self;
        var self_ = jQuery(".enter_coo");
        if (self_.length == 1) {
            self = jQuery(".enter_coo");
        }
        else if (self_.length > 1) {
            self = jQuery(".enter_coo").last();
        }
        var original = self.clone();

        var clone = original.clone();
        clone.insertAfter(self)
                .find('[id]')
                .andSelf()
                .attr('id', function(index, val) {
                    if (val) {
                        val = val.split("_");
                        var newId = val[0] + "_" + ($scope.vertices_counter);
                        clone.find('label').filter('[for=' + val + ']').attr('for', newId); // Also update label associated with old ID.
                        return newId;
                    }
                });
        clone.find(':input:not(select)').val('');
        clone.find('select option:first').attr('selected', 'selected');
        jQuery("#lab_" + $scope.vertices_counter).html($scope.vertices_counter);
        ++$scope.vertices_counter;
    };
    /* Function to replicate vertices input while drawing in layer tab*/
    $scope.CloneLMappingHTML = function() {
        var self;
        var self_ = jQuery(".enter_layer_coo");
        if (self_.length == 1) {
            self = jQuery(".enter_layer_coo");
        }
        else if (self_.length > 1) {
            self = jQuery(".enter_layer_coo").last();
        }
        var original = self.clone();
        var clone = original.clone();
        var cc;
        clone.insertAfter(self)
                .find('[id]')
                .andSelf()
                .attr('id', function(index, val) {
                    if (val) {
                        val = val.split("_");
                        var len = val.length;
                        if (len == 2) {
                            var newId = val[0] + "_" + ($scope.vertices_counter_mapping);
                            return newId;
                        }
                        else if (len == 3) {
                            var newId = val[0] + "_" + val[1] + "_" + ($scope.vertices_counter_mapping);
                            cc = val[1];
                            return newId;
                        }
                    }
                });
        clone.find(':input:not(select)').val('');
        clone.find('select option:first').attr('selected', 'selected');
        jQuery("#lab_" + cc + "_" + $scope.vertices_counter_mapping).html($scope.vertices_counter_mapping);
        ++$scope.vertices_counter_mapping;
    };
    /* Funciton to replicate attributes  */
    $scope.CloneAttributes = function() {
        if ($scope.attributes_counter <= $scope.db_attributes.length) {
            var val = jQuery("#attr_" + ($scope.attributes_counter - 1) + " :selected").val();
            if (!isNaN(val)) {
                var self;
                var self_ = jQuery(".region_attr");
                if (self_.length == 1) {
                    self = jQuery(".region_attr");
                }
                else if (self_.length > 1) {
                    self = jQuery(".region_attr").last();
                }
                var original = self.clone();

                var clone = original.clone();
                clone.insertAfter(self)
                        .find('[id]')
                        .andSelf()
                        .attr('id', function(index, val) {
                            if (val) {
                                val = val.split("_");
                                var newId = val[0] + "_" + ($scope.attributes_counter);
                                clone.find('label').filter('[for=' + val + ']').attr('for', newId); // Also update label associated with old ID.
                                return newId;
                            }
                        });
                clone.find(':input:not(select)').val('');
                clone.find('select option:first').attr('selected', 'selected');
                jQuery("#attr" + "_" + ($scope.attributes_counter) + " option[value='" + val + "']").remove();
                jQuery("#aaa_" + $scope.attributes_counter).html($scope.attributes_counter);
                ++$scope.attributes_counter;
            }
            else {
                alert("Select Attribute");
            }
        }
    };
    /* Funciton to replicate location layers in layer setting tab */
    $scope.CloneLayer = function() {
        var self;
        var self_ = jQuery(".location_layers");
        cloned_layers_length = self_.length;
        if (cloned_layers_length == 1) {
            self = jQuery(".location_layers");
        }
        else if (cloned_layers_length > 1) {
            self = jQuery(".location_layers").last();
        }
        var vall = parseInt(jQuery("#layerno" + "_" + ($scope.layer_counter - 1) + " :selected").text().split(" ")[1]);
        if (cloned_layers_length < $scope.layers - $scope.distinct_layer_ids.length) {
            var original = self.clone();
            var clone = original.clone();
            var removeButton = jQuery('<span id="remove_' + $scope.layer_counter + '"><a href="#"><i class="glyphicon glyphicon-minus"></i></a></span>');//
            removeButton.click(function() {
                clone.remove();
            });
            clone.insertAfter(self)
                    .find('[id]')
                    .andSelf()
                    .attr('id', function(index, val) {
                        if (val) {
                            val = val.split("_");
                            var newId = val[0] + "_" + ($scope.layer_counter);
                            return newId;
                        }
                    });
            clone.find('span').remove();
            clone.find(':input:not(select)').val('');
            clone.find('select option:first').attr('selected', 'selected');
            jQuery('#layerno_' + ($scope.layer_counter)).html('<option id=' + (vall + 1) + '>Layer ' + (vall + 1) + '</option>');
            jQuery("#LabelNumber_" + $scope.layer_counter).html("");
            var text = jQuery("#layerno" + "_" + ($scope.layer_counter) + " :selected").text();
            jQuery("#setngLabel_" + ($scope.layer_counter)).html(text);
            ++$scope.layer_counter;
            cloned_layers_length++;
            if (cloned_layers_length == ($scope.layers - $scope.distinct_layer_ids.length)) {
                jQuery("#enternextlayer").html("Complete");
            }
        }
        else {

        }

    };
    /* Funciton to replicate location layers style in layer styling tab */
    $scope.CloneLayerStyle = function() {
        var self;
        var self_ = jQuery(".location_layer_style");
        cloned_layerstyle_length = self_.length;
        if (cloned_layerstyle_length == 1) {
            self = jQuery(".location_layer_style");
        }
        else if (cloned_layerstyle_length > 1) {
            self = jQuery(".location_layer_style").last();
        }
        var val = jQuery("#stylelevels" + "_" + ($scope.layer_style_counter - 1) + " :selected").val();
        if (cloned_layerstyle_length < $scope.layers - ($scope.distinct_style_ids.length - 1) && val != "? undefined:undefined ?") {
            var original = self.clone();
            var clone = original.clone();
            var removeButton = jQuery('<span id="remove_' + $scope.layer_style_counter + '"><a href="#"><i class="glyphicon glyphicon-minus"></i></a></span>');//
            removeButton.click(function() {
                clone.remove();
            });
            clone.insertAfter(self)
                    .find('[id]')
                    .andSelf()
                    .attr('id', function(index, vall) {
                        if (vall) {
                            var val = vall.split("_");
                            var newId = val[0] + "_" + ($scope.layer_style_counter);
                            return newId;
                        }
                    });
            clone.find('span').css('background-color', 'white').css('display', 'none');
            clone.find('img').first().attr('src', '').css('display', 'none');
            jQuery("#stylelevels" + "_" + ($scope.layer_style_counter) + " option[value='" + val + "']").remove();
            clone.find(':input:not(select)').val('');
            clone.find('select option:first').attr('selected', 'selected');
            var text = jQuery("#stylelevels" + "_" + ($scope.layer_style_counter) + " :selected").text();
            jQuery("#styLabel_" + ($scope.layer_style_counter)).html(text);
            ++$scope.layer_style_counter;
            cloned_layerstyle_length++;
        }
    };
    var layerLabels = [];
    var TagIDs = [];
    var layerGeoms = [];
    /* Funciton to replicate location layers mapping in layer mapping tab 
     * Input: AngularJS event*/
    $scope.CloneLayerMapping = function(event) {
        var html = jQuery("#enternextlayermp").html();
        if (html == "Complete") {
            alert("Refresh this page to add next layer");
        }
        var self;
        var self_ = jQuery(".location_layer_mapping");
        cloned_layermapping_length = self_.length;
        if (cloned_layermapping_length == 1) {
            self = jQuery(".location_layer_mapping");
        }
        else if (cloned_layermapping_length > 1) {
            self = jQuery(".location_layer_mapping").last();
        }
        if (cloned_layermapping_length < ($scope.subLayerCounter - $scope.dbLayerCounter)) {
            var original = self.clone();
            var clone = original.clone();
            var removeButton = jQuery('<span id="remove_' + $scope.layer_mapping_counter + '"><a href="#"><i class="glyphicon glyphicon-minus"></i></a></span>');
            removeButton.click(function() {
                clone.remove();
            });
            clone.insertAfter(self)
                    .find('[id]')
                    .andSelf()
                    .attr('id', function(index, vall) {
                        if (vall) {
                            var val = vall.split("_");
                            var len = val.length;
                            if (len == 2) {
                                var newId = val[0] + "_" + ($scope.layer_mapping_counter);
                                return newId;
                            }
                            else if (len == 3) {
                                var newId = val[0] + "_" + ($scope.layer_mapping_counter) + "_" + val[2];
                                return newId;
                            }

                        }
                    }).find('[ng-model]')
                    .andSelf()
                    .attr('ng-model', function(index, vall) {
                        if (vall) {
                            var val = vall.split("_");
                            var newId = val[0] + "_" + ($scope.layer_mapping_counter);
                            return newId;
                        }
                    });
            clone.find('table > tbody > tr:gt(0):not(:last)').remove();
            $compile(clone)($scope);
            clone.find(':input:not(select)').val('');
            clone.find('select option:first').attr('selected', 'selected');
            jQuery("#asterisk_" + $scope.layer_mapping_counter).html($scope.layer_mapping_counter);
            $scope.vertices_counter_mapping = 2;
            ++$scope.layer_mapping_counter;
            cloned_layermapping_length++;
            if (cloned_layermapping_length == ($scope.subLayerCounter - $scope.dbLayerCounter)) {
                jQuery("#enternextlayermp").html("Complete");
            }
            for (var i = 0; i < TagIDs.length; i++) {
                jQuery(TagIDs[i]).attr('disabled', 'disabled');
            }
        }
    };
    /* Function to replicate bays label inputs 
     * Input: Bay ID*/
    $scope.CloneBayLabel = function(name) {
        var self;
        var self_ = jQuery(".bays_labels");
        cloned_layerstyle_length = self_.length;
        if (cloned_layerstyle_length == 1) {
            self = jQuery(".bays_labels");
        }
        else if (cloned_layerstyle_length > 1) {
            self = jQuery(".bays_labels").last();
        }
        var original = self.clone();
        var clone = original.clone();
        var removeButton = jQuery('<span id="remove_' + $scope.bay_label_counter + '"><a href="#"><i class="glyphicon glyphicon-minus"></i></a></span>');
        removeButton.click(function() {
            clone.remove();
        });
        clone.insertAfter(self)
                .find('[id]')
                .andSelf()
                .attr('id', function(index, vall) {
                    if (vall) {
                        var val = vall.split("_");
                        var newId = val[0] + "_" + ($scope.bay_label_counter);
                        return newId;
                    }
                }).find('[name]')
                .andSelf()
                .attr('name', function(index, vall) {
                    if (vall) {
                        var newId = name;
                        return newId;
                    }
                });
        clone.find('span').css('background-color', 'white').css('display', 'none');
        clone.find('img').first().attr('src', '').css('display', 'none');
        jQuery("#bayLabel_" + $scope.bay_label_counter).html($scope.bay_label_counter);
        ++$scope.bay_label_counter;
        cloned_layerstyle_length++;
    };
    /* Function to show selected drawing control on map and hide others in layer tab
     * Input: AngularJS event*/
    $scope.LayerDrawingOption = function(event) {
        var id;
        try {
            id = event.explicitOriginalTarget.parentElement.id;
        }
        catch (e) {
            id = event.srcElement.id;
        }
        General.SetLayerDrawingOption(id);
    };
    /* Function to save layer Setting content of layer tab in database */
    $scope.LayerSettings = function() {
        var levels = [];
        var labels = [];
        var types = [];
        var descriptions = [];
        var numbers = [];
        var layer_hierarchy = [];
        for (var i = 1; i <= cloned_layers_length; i++) {
            var v1 = jQuery("#floorno_" + i + " :selected").val();
            var v2 = jQuery("#drawlayerlab_" + i).val();
            var v3 = jQuery("#floordrawlyertp_" + i + " :selected").text();
            var v4 = jQuery("#drawlayerdesc_" + i).val();
            var v5 = jQuery("#drawlayerno_" + i).val();
            var v6 = jQuery("#layerno_" + i + " :selected").attr('id');
            if (v1 == "" || v1 == "? undefined:undefined ?") {
                if (v2 && v3 && v4 && v5) {
                    labels.push(v2);
                    types.push(v3);
                    descriptions.push(v4);
                    numbers.push(v5);
                    layer_hierarchy.push(v6);
                }
            }
            else if (v1 && v2 && v3 && v4 && v5) {
                levels.push(v1);
                labels.push(v2);
                types.push(v3);
                descriptions.push(v4);
                numbers.push(v5);
                layer_hierarchy.push(v6);
            }
        }
        $http.post($scope.layer_settings, {"parentID": $scope.layertype, "levels": levels, "labels": labels, "types": types,
            "description": descriptions, "numbers": numbers, "layerHierarchy": layer_hierarchy}).
                success(function(data, status) {
                    $scope.GetLayers($scope.layertype);
                    alert(data);
                })
                .
                error(function(data, status) {
                    $scope.data = data || "Request failed";
                    $scope.status = status;
                });

    };
    /* Function to save layer Styling content of layer tab in database */
    $scope.LayerStyles = function() {
        var ids = [];
        var colors = [];
        var icons = [];
        for (var i = 1; i <= cloned_layerstyle_length; i++) {
            var v1 = jQuery("#stylelevels_" + i + " :selected").val();
            var v2 = jQuery("#styleselectedcolor_" + i).val();
            var v3 = General.getBase64Image(jQuery("#styleicone64_" + i).val());
            if (v1 && v2 && v3) {
                ids.push(v1);
                colors.push(v2);
                icons.push(v3);
            }
        }
        if (General.CheckRedundant(ids) == 0) {
            $http.post($scope.layer_styles, {"id": ids, "colors": colors, "icons": icons}).
                    success(function(data, status) {
                        $scope.GetLayers($scope.layertype);
                        alert(data);
                    })
                    .
                    error(function(data, status) {
                        $scope.data = data || "Request failed";
                        $scope.status = status;
                    });
        }
        else {
            alert("Invalid selection");
        }
    };
    var ll = [];
    var lg = [];
    /* Function to save layer Mapping content of layer tab in database */
    $scope.LayerMapping = function() {
        var t_ll = [];
        var t_lg = [];
        if (ll.length == 0) {
            t_ll = layerLabels;
            t_lg = layerGeoms;
        }
        else if (ll.length > 0) {
            for (var i = 0; i < layerGeoms.length; i++) {
                if (layerLabels[i] != ll[i]) {
                    t_ll.push(layerLabels[i]);
                    t_lg.push(layerGeoms[i]);
                }
            }
        }
        if (t_ll.length > 0) {
            $http.post($scope.layer_mapping, {"id": $scope.layermappingsublevel_1,
                "layerGeoms": t_lg, "parentID": $scope.layermappingparent_1, "labels": t_ll}).
                    success(function(data, status) {
                        if (data == "Saved") {
                            for (var i = 0; i < t_ll.length; i++) {
                                ll.push(t_ll[i]);
                                lg.push(t_lg[i]);
                            }
                        }
                        $scope.GetLayers($scope.layertype);
                        alert(data);
                    })
                    .
                    error(function(data, status) {
                        $scope.data = data || "Request failed";
                        $scope.status = status;
                    });
        }
        else {
            alert("Nothing to save");
        }
    };
    /* Function to show next option(with previous ones) in layer drop down in mapping tab while drawing */
    $scope.SetSubLevel = function() {
        var id = $scope.layermappingsublevel_1;
        $scope.dbLayerCounter = 0;
        for (var i = 0, len = $scope.allowed_layers.length; i < len; i++) {
            if (len > 1)
                if (id == $scope.allowed_layers[i].id) {
                    $scope.prv_id = $scope.allowed_layers[i - 1].id;
                    $scope.prv_value = $scope.allowed_layers[i - 1].value;
                    $scope.crnt_value = $scope.allowed_layers[i].value;
                }
        }
        for (var i = 0, len = $scope.layer_details.length; i < len; i++) {
            if (id == $scope.layer_details[i].layer_id) {
                if ($scope.layer_details[i].geom) {
                    $scope.dbLayerCounter++;
                }
            }
            if ($scope.layer_details[i].id == id) {
                $scope.subLayerCounter = $scope.layer_details[i].layers;
            }
        }
        if ($scope.subLayerCounter == $scope.dbLayerCounter) {
            $scope.disable_add_sublayer_button = true;
        }
        else {
            $scope.disable_add_sublayer_button = false;
        }
        if ($scope.distinct_layer_ids.length == $scope.layers) {
            $scope.disable_add_layer_button = true;
        }
        else {
            $scope.disable_add_layer_button = false;
        }
        if ($scope.layers == ($scope.distinct_style_ids.length - 1)) {
            $scope.disable_add_style_button = true;
        }
        else {
            $scope.disable_add_style_button = false;
        }
    };
    var ca = 0;
    /* Function that calls CloneLayerStyle function to replicate layer style in Styling tab */
    $scope.TriggerStyleClone = function() {
        if (ca == 0) {
            var text = jQuery("#stylelevels_1 :selected").text();
            jQuery("#styLabel_1").html(text);
            for (var i = 0, len = $scope.sub_levels.length - 1; i < len; i++)
                $scope.CloneLayerStyle();
            ca = 1;
        }
    };
    /* Function to add imported geojson file on map */
    $scope.ImportGeoJSON = function(geojson) {
        WKT.RemoveUserLayer();
        try {
            user_layer = L.geoJson(JSON.parse(geojson)).addTo(map);
            user_layer.setStyle(copy_paste_style);
            feature_geom = JSON.stringify(user_layer.toGeoJSON().features[0].geometry);
            drawnItems.addLayer(user_layer);
            map.fitBounds(user_layer.getBounds());
            if ($scope.location_layer_check == 2) {
                /******saving data in arrays******/
                layerLabels[$scope.layer_mapping_counter - 2] = jQuery("#layermappinglabel_" + ($scope.layer_mapping_counter - 1)).val();
                layerGeoms[$scope.layer_mapping_counter - 2] = feature_geom;
                /******saving data in arrays******/
            }
        } catch (e) {
            console.log(e);
        }
    };
    /* Function to get selected icon in Styling tab 
     * Input: AngularJS event*/
    $scope.GetIcon = function(event) {
        level_icon = General.getBase64Image(event.currentTarget.firstChild.src);
        jQuery("#setLIcon_1").attr('src', event.currentTarget.firstChild.src).css('display', 'block');
    };
    /* Function to retrieve list of states that matches the given input
     * Input: state name */
    $scope.GetDBStates = function(state) {
        $http.post($scope.get_states, {"state": state}).
                success(function(data, status) {
                    $scope.status = status;
                    $scope.db_states = data;
                })
                .
                error(function(data, status) {
                    $scope.data = data || "Request failed";
                    $scope.status = status;
                });
    };
    /* Function to retrieve list of MSAs that matches the given input
     * Input: MSA name */
    $scope.GetDBMSAs = function(msa) {
        $http.post($scope.get_msas, {"msa": msa}).
                success(function(data, status) {
                    $scope.status = status;
                    $scope.db_msas = data;
                })
                .
                error(function(data, status) {
                    $scope.data = data || "Request failed";
                    $scope.status = status;
                });
    };
    /* Function to retrieve list of zipcodes that matches the given input
     * Input: zipcode */
    $scope.GetDBZipCodes = function(zipcode) {
        $http.post($scope.get_zipcodes, {"zipcode": zipcode}).
                success(function(data, status) {
                    $scope.status = status;
                    $scope.db_zipcodes = data;
                })
                .
                error(function(data, status) {
                    $scope.data = data || "Request failed";
                    $scope.status = status;
                });
    };
    DBOrganizations.GetDBOrganizations()
            .success(function(users) {
//                console.log(users);
                $scope.organization_options = users;
            });
    DBOrganizations.GetDBAttributes().success(function(data, status) {
        $scope.status = status;
        $scope.db_attributes = data;
    });
//    $scope.GetDBOrganizations();
//    $scope.GetDBAttributes();
    /* Function to retrieve complete information of selected location in layer Mapping tab */
    $scope.SetParent = function() {
        var val = $scope.layertype;
        $scope.GetLayers(val);
        var aa = $scope.parent_detail[val];
        $scope.styleparent = val;
        $scope.layermappingparent_1 = val;
        var db_floors = aa.level;
        $scope.total_layers = aa.layers;
        $scope.totalfloors = [];
        for (var i = 1; i <= db_floors; i++) {
            $scope.totalfloors[i - 1] = ({"id": i, "value": i});
        }
    };
    /* Function to retrieve complete information of selected location from database in layer Mapping tab
     * Input: selected location ID */
    $scope.GetLayers = function(val) {
        $http({method: 'GET', url: $scope.get_layers, params: {unit_id: val}}).
                success(function(dataa, status, headers, config) {
                    var data = dataa[0];
                    var geoms = [dataa[1]];
                    $scope.sub_levels = [];
                    $scope.distinct_style_ids = [];
                    var layer_ids = [];
                    var layer_icons = [];
                    var defined_geom_temp = [];
                    var drawn_geom_temp = [];
                    $scope.layer_details = data;
                    $scope.defined_geoms = [];
                    $scope.drawn_geoms = [];
                    $scope.added_geoms = [];
                    $scope.empty_labels = [];
                    $scope.layers_colors = {};
                    for (var i = 0, len = data.length; i < len; i++) {
                        if (data[i].geom) {
                            geoms.push(data[i]);
                        }
                        else if (data[i].geom_marker) {
                            geoms.push(data[i]);
                        }
                        else if (data[i].geom_polyline) {
                            geoms.push(data[i]);
                        }
                        if (data[i].parent_layer_id && !data[i].icon && !data[i].color) {// && !data[i].icon && !data[i].color
                            $scope.sub_levels.push(data[i]);
                        }
                        if (!data[i].parent_layer_id) {
                            $scope.layers = data[i].layers;
                        }
                        if (data[i].parent_layer_id) {
                            layer_ids.push(data[i].parent_layer_id);
                        }
                        if (data[i].id) {
                            $scope.layers_colors[data[i].id] = ({"value": data[i].color});
                        }
                        if (data[i].icon && data[i].color && data[i].layer_id) {
                            layer_icons.push(data[i].layer_id);
                        }
                        if (data[i].unit_id == val && data[i].parent_layer_id) {// && data[i].parent_layer_id
                            defined_geom_temp.push([data[i].id, data[i].value]);
                        }
                        if (data[i].geom_unit_id == val && data[i].parent_id) {
                            drawn_geom_temp.push(data[i].layer_id);
                        }
                        if (!data[i].label && data[i].gid) {
                            $scope.empty_labels.push(data[i].gid);
                        }
                        $scope.template_layer_hierarchy = data[i].template_layer_hierarchy;
                    }
                    jQuery("#autocLabel_1").attr('name', $scope.empty_labels[0]);
                    for (var i = 1; i < $scope.empty_labels.length; i++) {
                        $scope.CloneBayLabel($scope.empty_labels[i]);
                    }
                    if ($scope.sub_levels.length > 0) {
                        $scope.stylelevels_1 = $scope.sub_levels[0].id;
                    }
                    $scope.layer_hierarchy = [];
                    if ($scope.template_layer_hierarchy) {
                        if ($scope.template_layer_hierarchy < $scope.layers) {
                            jQuery('#layerno_1').html('<option id=' + (parseInt($scope.template_layer_hierarchy) + 1) + '>Layer ' + (parseInt($scope.template_layer_hierarchy) + 1) + '</option>');
                        }
                    }
                    else if (!$scope.template_layer_hierarchy) {
                        $scope.layer_hierarchy[0] = {"id": 1, "value": "Layer " + 1};
                        jQuery('#layerno_1').html('<option id=1>Layer 1</option>');
                    }
                    $scope.load_geoms(geoms);
                    $scope.defined_geoms = jQuery.unique(defined_geom_temp);
                    $scope.drawn_geoms = jQuery.unique(drawn_geom_temp);
                    $scope.distinct_layer_ids = jQuery.unique(layer_ids);
                    $scope.distinct_style_ids = jQuery.unique(layer_icons);
                    $scope.defined_geoms.sort(function(a, b) {
                        return a[0] - b[0];
                    });
                    $scope.drawn_geoms.sort(function(a, b) {
                        return a - b;
                    });
                    var gL = $scope.drawn_geoms.length;
                    var dL = $scope.defined_geoms.length;
                    $scope.allowed_layers = [];
                    if (gL == 0) {
                        if (dL > 0) {
                            $scope.allowed_layers[0] = {"id": $scope.defined_geoms[0][0], "value": $scope.defined_geoms[0][1]};
                        }
                    }
                    else if (dL == gL) {
                        for (var i = 0; i < dL; i++) {
                            $scope.allowed_layers[i] = {"id": $scope.defined_geoms[i][0], "value": $scope.defined_geoms[i][1]};
                        }
                    }
                    else if (gL < dL) {
                        for (var i = 0; i <= gL; i++) {
                            $scope.allowed_layers[i] = {"id": $scope.defined_geoms[i][0], "value": $scope.defined_geoms[i][1]};
                        }
                    }

                    $scope.allowed_layers.sort();

                    if ($scope.defined_geoms.length == $scope.layers) {
                        $scope.disable_add_layer_button = true;
                    }
                    else {
                        $scope.disable_add_layer_button = false;
                    }
                    if ($scope.layers == ($scope.distinct_style_ids.length - 1)) {
                        $scope.disable_add_style_button = true;
                    }
                    else {
                        $scope.disable_add_style_button = false;
                    }
                    var text = jQuery("#layerno_1 :selected").text();
                    jQuery("#setngLabel_1").html(text);
                    for (var i = 0; i < $scope.layers; i++) {
                        $scope.CloneLayer();
                    }
                }).
                error(function(data, status, headers, config) {
                    $scope.data = data || "Request failed";
                    $scope.status = status;
                });
    };
    $scope.ShowGeom = function(id) {
        $scope.GetPreviewLayers(id);
    };
    /* Function to retrieve location information in location tab of preview map */
    $scope.GetPreviewLayers = function(val) {
        $http({method: 'GET', url: $scope.get_layers, params: {unit_id: val}}).
                success(function(dataa, status, headers, config) {

                    var data = dataa[0];
                    $scope.layersNoGeoms = data;
                    $scope.lev = data[0].level;
                    $scope.lay = data[0].layers;
                    $scope.attr = data[0].attributes;
                    var geoms = [dataa[1]];
                    var layer_icons = [];
                    $scope.layers_colors = {};
                    for (var i = 0, len = data.length; i < len; i++) {
                        if (val == data[i].layer_id) {
                            $scope.prev_loc_type = data[i].layer_geom_type;//location_type;
                            $scope.prev_loc = data[i].searched_location;
                            $scope.prev_loc_levels = data[i].level;
                            $scope.prev_loc_layers = data[i].layers;
                            $scope.prev_loc_description = data[i].description;
                            $scope.prev_loc_color = data[i].color;
                            $scope.prev_loc_icon = data[i].icon;
                            $scope.prev_loc_mapping_type = data[i].mapping_type;
                            $scope.prev_loc_display = data[i].attributes;
                        }
                        if (data[i].id) {
                            $scope.layers_colors[data[i].id] = ({"value": data[i].color});
                        }
                        if (data[i].icon && data[i].color && data[i].layer_id) {
                            layer_icons.push(data[i].layer_id);
                        }
                    }
                    $scope.load_geoms(geoms);
                }).
                error(function(data, status, headers, config) {
                    $scope.data = data || "Request failed";
                    $scope.status = status;
                });
    };
    /* Function to retrieve locations under selected organization */
    $scope.GetOrganizationDetails = function() {
        var val = $scope.organization_val_pre;
        $http.post($scope.template_hierarchy, {"parent_id": val}).
                success(function(data, status) {
                    $scope.hierarchy = data.facility;
                })
                .
                error(function(data, status) {
                    $scope.data = data || "Request failed";
                    $scope.status = status;
                });
    };
    /* Function to get detail of selected location in location tab of preview section */
    $scope.GetSingleLocation = function() {
        var val = $scope.preview_locs;
        $scope.ShowGeom(val);
        $scope.pre_layers = [];
        for (var i = 0; i < $scope.hierarchy.length; i++) {
            if (val == $scope.hierarchy[i].id) {
                $scope.pre_layers = $scope.hierarchy[i].sub;
            }
        }
        $scope.prev_search_options = [];
        for (var j = 0; j < $scope.pre_layers.length; j++) {
            $scope.prev_search_options.push($scope.pre_layers[j].label);
        }
    };
    /* Function to retrieve all layers of selected location in layer tab of preview location */
    $scope.SetLayerParent = function() {
        $scope.prev_levels = [];
        $scope.prev_layers = [];
        $scope.level_layers = [];
        var val = $scope.prev_layer_;
        if ($scope.lev != null) {
            for (var i = 1; i <= $scope.lev; i++) {
                $scope.prev_levels[i - 1] = ({"id": i, "value": i});
            }
        }
        if ($scope.lay) {
            for (var i = 1; i <= $scope.lay; i++) {
                $scope.prev_layers[i - 1] = ({"id": i, "value": i});
            }
        }
        for (var i = 0; i < $scope.layersNoGeoms.length; i++) {
            if (val == $scope.layersNoGeoms[i].layer_id) {
                $scope.level_layers.push($scope.layersNoGeoms[i]);
            }
        }
    };
    DBOrganizations.GetParentDetail()
            .success(function(data, status) {
                $scope.SetParentDetail(data);
            })
            .
            error(function(data, status) {
                $scope.data = data || "Request failed";
                $scope.status = status;
            });
    /* Function to display required input field and hide others while drawing on map in the case of region selection in location tab */
    $scope.GetRegionType = function() {
        var val = $scope.region_type;
        General.GetRType(val);
    };
    /* Function to display required input field and hide others while drawing on map in the case of region selection in layer tab */
    $scope.LayerGetRegionType = function(event) {
        var id = event.explicitOriginalTarget.parentElement.id;
        General.CheckRType(id);
    };     /* Function to load GeoJSON geometry on map */
    $scope.load_geoms = function(facility_geom) {
        General.removeAllLayers();
        all_layers = [];
        if (isPreview == 0) {
            s = L.geoJson(JSON.parse(facility_geom[0][0].geom), {onEachFeature: onEachFeature, style: style}).addTo(map);
            map.fitBounds(s);
        }
        else if (isPreview == 1) {
            s = L.geoJson(JSON.parse(facility_geom[0][0].geom), {onEachFeature: onEachFeature, style: style}).addTo(map2);
            map2.fitBounds(s);
        }
        delete_layers = new L.FeatureGroup();
    };
    /* Fucntion to style geojson layer */
    function style(feature) {
        return {
            weight: 2,
            opacity: 1,
            color: getColor(feature.properties.layer_id),
            fillOpacity: 0,
            fill: true
        };
    }
    /* Function to retrieve assigned color of each layer */
    function getColor(d) {
        return $scope.layers_colors[d].value ? $scope.layers_colors[d].value : 'black';
    }
    /* Function to add click event to each layer */
    function onEachFeature(feature, layer) {
        layer.on({
            click: function(e) {
                $scope.bay_set_layer = WKT.toWKT(e.layer);
                if (bay_check == 1) {
                    General.ShowStep2();
                }
            }
        });
    }
    /* Function to update Bays labels in database */
    $scope.UpdateLabels = function() {
        var gids = [];
        var labels = [];
        for (var i = 0, len = $scope.empty_labels.length; i < len; i++) {
            var val = jQuery("#autocLabel_" + (i + 1)).val();
            if (val) {
                gids.push(jQuery("#autocLabel_" + (i + 1)).attr('name'));
                labels.push(jQuery("#autocLabel_" + (i + 1)).val());
            }
        }
        $http.post($scope.update_bays_labels, {"gids": gids, "labels": labels}).
                success(function(data, status) {
                    alert(data);
                })
                .
                error(function(data, status) {
                    $scope.data = data || "Request failed";
                    $scope.status = status;
                });
    };
    $scope.info_label = $scope.info_name;
    /* Function to store lcoation in the database */
    $scope.info_sumbit = function() {
        var total_levels = $scope.total_levels;
        var hierarchy_number = $scope.hierarchy_number;
        var level_label = $scope.level_label;
        var level_description = $scope.level_description;
        if (total_levels != null && hierarchy_number != null && level_label != null && level_description != null && level_icon != null &&
                level_color != null && organization_id != null && location_type_id != null && selected_attributes != null && selected_attributes != "" &&
                feature_geom != null && $scope.loc_layer_mT != "") {
            if (geom_edit_check == 0) {
                $http.post($scope.submit_feature, {
                    "total_levels": total_levels, "hierarchy_number": hierarchy_number, "level_label": level_label,
                    "level_description": level_description, "level_icon": level_icon,
                    "level_color": level_color, "organization_id": organization_id, "location_type_id": $scope.user_loc_type,
                    "selected_attributes": selected_attributes, "feature_geom": feature_geom, "operation_id": operation_id, "geom_type": $scope.geom_type,
                    "searched_location": $scope.sL, "user_drawing_option": user_drawing_option, "loc_MT": jQuery("#loc_layer_mT :selected").text()
                }).
                        success(function(data, status) {
                            drawnItems.clearLayers();
                            feature_geom = null;
                            DBOrganizations.GetParentDetail().success(function(data, status) {
                                $scope.SetParentDetail(data);
                            })
                                    .
                                    error(function(data, status) {
                                        $scope.data = data || "Request failed";
                                        $scope.status = status;
                                    });
                            alert(data);
                        })
                        .
                        error(function(data, status) {
                            $scope.data = data || "Request failed";
                            $scope.status = status;
                        });
            } else if (geom_edit_check == 1) {
                $http.post($scope.edit_feature, {
                    "gid": gid, "parent_id": immediate_parent_id, "feature_geom": feature_geom,
                    "template_hierarchy_id": template_hierarchy_id, "operation_id": operation_id,
                    "info_name": info_name, "label": label, "info_description": info_description,
                    "info_location_type": info_location_type, "info_location_capacity": info_location_capacity, "geom_unit_id": parent_id,
                    "valid_intersection": JSON.stringify(layers_for_intersection), "invalid_intersection": JSON.stringify(layers_otherthan_intersection)
                }).
                        success(function(data, status) {

                            if (data == "1") {
                                drawnItems.clearLayers();
                                jQuery("#add_attributes").css('visibility', 'hidden');
                                feature_geom = "";
                                alert("Data Saved Successfully");
                            }
                            else {
                                if (data.length > 0) {
                                    var names = [];
                                    for (var i = 0, len = data.length; i < len; i++) {
                                        names.push(data[i].name);
                                    }
                                    alert("Intersection With " + names.join());
                                }
                                else {
                                    alert("Invalid Geometry");
                                }
                            }
                        })
                        .
                        error(function(data, status) {
                            $scope.data = data || "Request failed";
                            $scope.status = status;
                        });
            }
        }
        else {
            alert("Invalid Input");
        }
    };
    $scope.SetParentDetail = function(data) {
        $scope.parents = data;
        $scope.parent_detail = {};
        for (var i = 0, len = data.length; i < len; i++) {
            var c = data[i].id;
            $scope.parent_detail[c] = {"label": data[i].value, "root_organization_id": data[i].root_organization_id,
                "root_layer_id": data[i].root_layer_id, "level": data[i].level, "icon": data[i].icon, "color": data[i].color,
                "location_type": data[i].location_type, "layers": data[i].layers, "description": data[i].description};
        }
    };
    /* Initialization function */
    $scope.init_map = function() {
        Map.load_map();
        Map.init_controls();
        $scope.map_event_listener();
        Map.init_style();
    };
    /* Bays calculation and storage in the database */
    $scope.BayAutoCalculate = function() {
        $http.post($scope.bay_autocalculate, {
            "hr": HrVrLayers[0], "vr": HrVrLayers[1], "polygon": $scope.bay_set_layer,
            "parentID": $scope.layermappingparent_1, "id": $scope.layermappingsublevel_1,
            "width": $scope.autoc_width, "height": $scope.autoc_height, "rows": $scope.autoc_rows, "columns": $scope.autoc_columns, "prev_id": $scope.prv_id}).
                success(function(data, status) {
                    $scope.GetLayers($scope.layertype);
                    alert(data);
                    if (bay_check == 1) {
                        General.ShowStep4();
                    }
                })
                .
                error(function(data, status) {
                    $scope.data = data || "Request failed";
                    $scope.status = status;
                });
    };
    /* Initializing map events */
    $scope.map_event_listener = function() {
        map.on('draw:created', function(e) {
            if (bay_check == 1) {
            }
            else {
                WKT.RemoveUserLayer();
            }
            geom_edit_check = 0;
            user_layer = e.layer;
            $scope.geom_type = e.layerType;
            if (bay_check == 1) {
                var a = WKT.toWKT(e.layer);
                HrVrLayers.push(a);
            }
            else {
                WKT.RemoveUserLayer();
            }
            if (HrVrLayers.length == 2) {
                General.ShowStep3();
            }
            if ($scope.geom_type != 'marker') {
                user_layer.setStyle(copy_paste_style);
            }
            feature_geom = JSON.stringify(user_layer.toGeoJSON().geometry);
            /******saving data in arrays******/
            TagIDs[$scope.layer_mapping_counter - 2] = "#layermappinglabel_" + ($scope.layer_mapping_counter - 1);
            layerLabels[$scope.layer_mapping_counter - 2] = jQuery("#layermappinglabel_" + ($scope.layer_mapping_counter - 1)).val();
            layerGeoms[$scope.layer_mapping_counter - 2] = feature_geom;
            /******saving data in arrays******/
            drawnItems.addLayer(user_layer);
            layer_to_edit.addLayer(user_layer);
            editable_layer.clearLayers();
            editable_layer.addLayer(layer_to_edit.getLayers()[layer_to_edit.getLayers().length - 1]);
        });
        map.on('draw:edited', function(e) {
            try {
                map.removeLayer(draggable_marker);
                feature_geom = JSON.stringify(user_layer.toGeoJSON().geometry);//user_layer.toGeoJSON().geometry.toSource();
                /******saving data in arrays******/
                layerGeoms[$scope.layer_mapping_counter - 2] = feature_geom;
                layerLabels[$scope.layer_mapping_counter - 2] = jQuery("#layermappinglabel_" + ($scope.layer_mapping_counter - 1)).val();
                /******saving data in arrays******/
            } catch (ee) {
                console.log(ee);
            }
        });
        map.on('click', function(e) {
            newCenter_lat = e.latlng.lat;
            newCenter_lon = e.latlng.lng;
        });
    };
    /* On hitting escape button, remove temporary layers from map */
    jQuery(document).keyup(function(e) {
        if (e.keyCode == 27) {
            drawnItems.clearLayers();
            HrVrLayers = [];
        }
    });
    $scope.init_map();
    /* Function to retrieve suggestion list of states from database
     * Input: state name */
    $scope.TypeState = function(typedthings) {
        $scope.GetDBStates(typedthings);
    };
    /* Function to retrieve geometry of selected state from database */
    $scope.SelectState = function(suggestion) {
        WKT.GetSelectedRegion('states', suggestion);
    };
    /* Function to retrieve suggestion list of MSAs from database
     * Input: MSA name */
    $scope.TypeMSA = function(typedthings) {
        $scope.GetDBMSAs(typedthings);
    };
    /* Function to retrieve geometry of selected MSA from database */
    $scope.SearchMSA = function(suggestion) {
        WKT.GetSelectedRegion('msa_usa', suggestion);
    };
    /* Function to retrieve suggestion list of zip code from database
     * Input: zip code */
    $scope.TypeZipCode = function(typedthings) {
        $scope.GetDBZipCodes(typedthings);
    };
    /* Function to retrieve geometry of selected zip code from database */
    $scope.SearchZipCode = function(suggestion) {
        WKT.GetSelectedRegion('zipcodes', suggestion);
    };
    /* Mapbox location suggestion  */
    $scope.TypeLoc = function(typedthings) {
        var url = 'http://a.tiles.mapbox.com/v3/primotus.ik4ib166/geocode/' + typedthings + '.json';
        $http({method: 'GET', url: url}).
                success(function(data, status, headers, config) {
                    $scope.status = status;
                    $scope.suggestions = data;
                    var locnames = [];
                    $scope.loc_pairs = [];
                    for (var i = 0, len = $scope.suggestions.results.length; i < len; i++) {
                        var obj = $scope.suggestions.results[i];
                        var n = "";
                        for (var j = 0, lenn = obj.length; j < lenn; j++) {
                            n += obj[j].name;
                            if (j != lenn - 1) {
                                n += ', ';
                            }
                        }
                        locnames.push(n);
                        $scope.loc_pairs.push([obj[0].id, n, obj[0].lon, obj[0].lat]);
                    }
                    $scope.loc_suggestion = locnames;
                }).
                error(function(data, status, headers, config) {
                    $scope.data = data || "Request failed";
                    $scope.status = status;
                });
    };
    /* Get selected location from the list of suggestions and zoom map to that location */
    $scope.SearchLoc = function(suggestion) {
        $scope.sL = suggestion;
        for (var i = 0; i < $scope.loc_pairs.length; i++) {
            if ($scope.loc_pairs[i][1] == suggestion) {
                break;
            }
        }
        map.setView(new L.LatLng($scope.loc_pairs[i][3], $scope.loc_pairs[i][2]), 12);
    };
});
/* AngularJS directive to read file content while importing geometry on map */
app.directive('onReadFile', function($parse) {
    return {
        restrict: 'A',
        scope: false,
        link: function(scope, element, attrs) {
            var fn = $parse(attrs.onReadFile);

            element.on('change', function(onChangeEvent) {
                var reader = new FileReader();

                reader.onload = function(onLoadEvent) {
                    scope.$apply(function() {
                        fn(scope, {$fileContent: onLoadEvent.target.result});
                    });
                };

                reader.readAsText((onChangeEvent.srcElement || onChangeEvent.target).files[0]);
            });
        }
    };
});

/* AngularJS directive to allow only number input */
app.directive('numbersOnly', function() {
    return {require: 'ngModel',
        link: function(scope, element, attrs, modelCtrl) {
            modelCtrl.$parsers.push(function(inputValue) {
                if (inputValue == undefined)
                    return '';
                var transformedInput = inputValue.replace(/[^0-9]/g, '');
                if (transformedInput != inputValue) {
                    modelCtrl.$setViewValue(transformedInput);
                    modelCtrl.$render();
                }
                return transformedInput;
            });
        }
    };
});
/* Function to get/set selected color in styling tab */
function LayerGetColor(id) {
    var color = jQuery("#" + id).attr('value');
    jQuery("#setColor_" + id.split("_")[1]).css('background-color', color).css('display', 'block');
    jQuery("#styleselectedcolor_" + id.split("_")[1]).val(color);
}
/* Function to get/set selected icon in styling tab */
function GetIconeStyle(id) {
    var src = jQuery("#" + id).children().attr('src');
    jQuery("#setIcon_" + id.split("_")[1]).attr('src', src).css('display', 'block');
    jQuery("#styleicone64_" + id.split("_")[1]).val(src);
}
/* Function to expand/close accordions */
function max_minimize(tt) {
    try {
        var t = tt;
        var p = t.closest('.panel');
        if (!t.hasClass('maximize')) {
            p.find('.panel-body:first').slideUp(200);
            t.addClass('maximize');
            t.html('&plus;');
        } else {
            p.find('.panel-body:first').slideDown(200);
            t.removeClass('maximize');
            t.html('&minus;');
        }
        return false;
    } catch (e) {
        console.log(e);
    }
}
/* Function to set layer label */
function SetValue(a) {
    var b = a.split('_')[1];
    jQuery("#LabelNumber_" + b).html(jQuery("#" + a).val());
}
/* Function to match id and highlight/unhighlight bays */
function HighLight(name) {
    var L = s._layers;
    for (var i in L) {
        if (name == L[i].feature.properties.gid) {
            H(L[i]);
        }
        else {
            R(L[i]);
        }
    }
}
/* Highligh bay while adding labels */
function H(layer) {
    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });
}
/* Unhighligh other bays while adding labels */
function R(layer) {
    s.resetStyle(layer);
}
app.service('DBOrganizations', function($http) {
    var get_organizations = "php/blogic/getOrganizations.php";//"/svc/meta/fields/10";//"php/blogic/getOrganizations.php";
    var get_attributes = "php/blogic/getAttributes.php";
    var get_parents = "php/blogic/getParents.php";
    /* Function to retrieve organizations */
    //    return {GetDBOrganizations: function() {
//            return $http.get("php/blogic/getOrganizations.php");
    //        }};
    this.GetDBOrganizations = function() {
        return $http.get(get_organizations);
    };
    /* Funciton to retrieve attributes from database */
    this.GetDBAttributes = function() {
        return $http.get(get_attributes);
    };
    /* Function to retrieve all locations from database */
    this.GetParentDetail = function() {
        return $http.get(get_parents);
    };
});

app.service('WKT', function($http) {
    var get_selectedregion = "php/blogic/getSelectedRegion.php";
    /* Function to convert geojson geometry to Well Known Text(WKT) format */
    this.toWKT = function(layer) {
        var lng, lat, coords = [];
        if (layer instanceof L.Polygon || layer instanceof L.Polyline) {
            var latlngs = layer.getLatLngs();
            for (var i = 0; i < latlngs.length; i++) {
                //            latlngs[i]
                coords.push(latlngs[i].lng + " " + latlngs[i].lat);
                if (i === 0) {
                    lng = latlngs[i].lng;
                    lat = latlngs[i].lat;
                }
            }
            ;
            if (layer instanceof L.Polygon) {
                return "POLYGON((" + coords.join(",") + "," + lng + " " + lat + "))";
            } else if (layer instanceof L.Polyline) {
                return "LINESTRING(" + coords.join(",") + ")";
            }
        } else if (layer instanceof L.Marker) {
            return "POINT(" + layer.getLatLng().lng + " " + layer.getLatLng().lat + ")";
        }
    };
    /* Retrieving geometry from database of selected suggestion while drawing region on map */
    this.GetSelectedRegion = function(table, value) {
        $http.post(get_selectedregion, {"table": table, "value": value}).
                success(function(data, status) {
                    this.RemoveUserLayer();
                    user_layer = omnivore.wkt.parse(data);//.addTo(map);
                    map.addLayer(user_layer);
                    feature_geom = JSON.stringify(user_layer.toGeoJSON().features[0].geometry);
                    user_layer.setStyle(copy_paste_style);
                    map.fitBounds(user_layer.getBounds());
                    drawnItems.addLayer(user_layer);
                })
                .
                error(function(data, status) { //                    $scope.data = data || "Request failed";
                    //                    $scope.status = status;
                });
    };
    this.RemoveUserLayer = function () {
        try {
            map.removeLayer(user_layer);
        }
        catch (e) {
            console.log(e);
        }
    };
});
app.service('General', function() {
    /* Function to check if array contains redundant values or not 
     * Input: array*/     this.CheckRedundant = function(arr) {
        var sorted_arr = arr.sort();
        var results = [];
        for (var i = 0; i < arr.length - 1; i++) {
            if (sorted_arr[i + 1] == sorted_arr[i]) {
                results.push(sorted_arr[i]);
            }
        }
        return results.length;
    };

    /* Function to show dialog box while autocalculating bays, Step-1 */
    this.ShowStep1 = function() {
        var a = jQuery('#step1')[0];
        var e = document.createEvent('MouseEvents');
        e.initEvent('click', true, true);
        a.dispatchEvent(e);
    };
    /* Function to show dialog box while autocalculating bays, Step-2 */
    this.ShowStep2 = function() {
        var a = jQuery('#step2')[0];
        var e = document.createEvent('MouseEvents');
        e.initEvent('click', true, true);
        a.dispatchEvent(e);
    };
    /* Function to show dialog box while autocalculating bays, Step-3 */
    this.ShowStep3 = function() {
        var a = jQuery('#step3')[0];
        var e = document.createEvent('MouseEvents');
        e.initEvent('click', true, true);
        a.dispatchEvent(e);
    };
    /* Function to show dialog box while autocalculating bays, Step-4 */
    this.ShowStep4 = function() {
        var a = jQuery('#step4')[0];
        var e = document.createEvent('MouseEvents');
        e.initEvent('click', true, true);
        a.dispatchEvent(e);
    };
    /* Function to remove layers from map */
    this.removeAllLayers = function() {

        if (isPreview == 0) {
            var len = all_layers.length;
            if (len > 0) {
                for (var i = 0; i < len; i++) {
                    map.removeLayer(all_layers[i]);
                }
            }
        }
        else if (isPreview == 1) {
            if (s)
                map2.removeLayer(s);
        }
    };

    /* Function to add/remove map controls */
    this.add_controls = function() {
        try {
            map.removeControl(drawControl);
        }
        catch (e) {
            console.log(e);
        }
        map.addControl(drawControl);
    };
    this.CheckRType = function(id) {

        if (id) {
            var val = jQuery("#" + id + " :selected").val();
            if (val) {
                if (val == 0) {
                    jQuery("#states_" + cloned_layermapping_length).css('display', 'block');
                    jQuery("#msas_" + cloned_layermapping_length).css('display', 'none');
                    jQuery("#zipcodes_" + cloned_layermapping_length).css('display', 'none');
                }
                else if (val == 1) {
                    jQuery("#states_" + cloned_layermapping_length).css('display', 'none');
                    jQuery("#msas_" + cloned_layermapping_length).css('display', 'block');
                    jQuery("#zipcodes_" + cloned_layermapping_length).css('display', 'none');
                }
                else if (val == 2) {
                    jQuery("#states_" + cloned_layermapping_length).css('display', 'none');
                    jQuery("#msas_" + cloned_layermapping_length).css('display', 'none');
                    jQuery("#zipcodes_" + cloned_layermapping_length).css('display', 'block');
                }
            }
        }
    };
    this.GetRType = function(val) {
        if (val == 1) {
            jQuery("#states_").css('display', 'block');
            jQuery("#msas_").css('display', 'none');
            jQuery("#zipcodes_").css('display', 'none');
        }
        else if (val == 2) {
            jQuery("#states_").css('display', 'none');
            jQuery("#msas_").css('display', 'block');
            jQuery("#zipcodes_").css('display', 'none');
        }
        else if (val == 3) {
            jQuery("#states_").css('display', 'none');
            jQuery("#msas_").css('display', 'none');
            jQuery("#zipcodes_").css('display', 'block');
        }
    };

    /* Function to get base_64 string of selected icon in Styling tab 
     * Input: image URL*/
    this.getBase64Image = function(img) {
        var canvas = document.getElementById('leaflet_icon_canvas');
        var context = canvas.getContext('2d');
        var imageObj = new Image();

        imageObj.src = null;
        imageObj.src = img;
        canvas.width = 24;
        canvas.height = 24;
        context.drawImage(imageObj, 0, 0);
        var f = canvas.toDataURL();
        return f;

    };
    this.SetDrawingOption = function (val){
        if (val == 1) {
            user_drawing_option = "Points of Map";
            this.add_controls();
            jQuery('.leaflet-draw-edit-remove').css('display', 'none');
            jQuery('.leaflet-draw-draw-rectangle').css('display', 'none');
            jQuery('.leaflet-draw-edit-edit').css('display', 'block');
            jQuery("#import__file").css('display', 'none');
            jQuery("#enter_coord").css('display', 'none');
            jQuery("#enter_region").css('display', 'none');
        }
        else if (val == 2) {
            user_drawing_option = "Enter Coordinates";
            jQuery('.leaflet-draw-draw-polygon').css('display', 'none');
            jQuery('.leaflet-draw-draw-rectangle').css('display', 'none');
//            leaflet-draw-toolbar leaflet-bar leaflet-draw-toolbar-top
            jQuery("#import__file").css('display', 'none');
            jQuery("#enter_coord").css('display', 'block');
            jQuery("#enter_region").css('display', 'none');
        }
        else if (val == 3) {
            user_drawing_option = "Import";
            jQuery('.leaflet-draw-draw-polygon').css('display', 'none');
            jQuery('.leaflet-draw-draw-rectangle').css('display', 'none');
            jQuery("#import__file").css('display', 'block');
            jQuery("#enter_coord").css('display', 'none');
            jQuery("#enter_region").css('display', 'none');
        }
        else if (val == 4) {
            user_drawing_option = "Region";
            jQuery('.leaflet-draw-draw-polygon').css('display', 'none');
            jQuery('.leaflet-draw-draw-rectangle').css('display', 'none');
            jQuery("#import__file").css('display', 'none');
            jQuery("#enter_coord").css('display', 'none');
            jQuery("#enter_region").css('display', 'block');
        }
    };
    this.SetLayerDrawingOption = function(id){
        
        if (id) {
            var val = jQuery("#" + id + " :selected").val();
            if (val == 0) {
                this.add_controls();
                jQuery('.leaflet-draw-edit-remove').css('display', 'none');
                jQuery('.leaflet-draw-draw-rectangle').css('display', 'none');
                jQuery('.leaflet-draw-edit-edit').css('display', 'block');
                jQuery("#layerimportfile_" + cloned_layermapping_length).css('display', 'none');
                jQuery("#layerentercoord_" + cloned_layermapping_length).css('display', 'none');
                jQuery("#autocalculate_" + cloned_layermapping_length).css('display', 'none');
                bay_check = 0;
            }
            else if (val == 1) {
                jQuery('.leaflet-draw-draw-polygon').css('display', 'none');
                jQuery('.leaflet-draw-draw-rectangle').css('display', 'none');
                jQuery('.leaflet-draw-draw-polyline').css('display', 'none');
                jQuery('.leaflet-draw-draw-marker').css('display', 'none');
                //            leaflet-draw-toolbar leaflet-bar leaflet-draw-toolbar-top
                jQuery("#layerimportfile_" + cloned_layermapping_length).css('display', 'none');
                jQuery("#layerentercoord_" + cloned_layermapping_length).css('display', 'block');
                jQuery("#autocalculate_" + cloned_layermapping_length).css('display', 'none');
                bay_check = 0;
            }
            else if (val == 2) {
                jQuery('.leaflet-draw-draw-polygon').css('display', 'none');
                jQuery('.leaflet-draw-draw-rectangle').css('display', 'none');
                jQuery('.leaflet-draw-draw-polyline').css('display', 'none');
                jQuery('.leaflet-draw-draw-marker').css('display', 'none');
                jQuery("#layerimportfile_" + cloned_layermapping_length).css('display', 'block');
                jQuery("#layerentercoord_" + cloned_layermapping_length).css('display', 'none');
                jQuery("#autocalculate_" + cloned_layermapping_length).css('display', 'none');
                bay_check = 0;
            }
            else if (val == 3) {
                this.add_controls();
                jQuery('.leaflet-draw-draw-polygon').css('display', 'none');
                jQuery('.leaflet-draw-draw-rectangle').css('display', 'none');
                jQuery('.leaflet-draw-draw-polyline').css('display', 'block');
                jQuery('.leaflet-draw-draw-marker').css('display', 'none');
                jQuery("#layerimportfile_" + cloned_layermapping_length).css('display', 'none');
                jQuery("#layerentercoord_" + cloned_layermapping_length).css('display', 'none');
                jQuery("#autocalculate_" + cloned_layermapping_length).css('display', 'block');
                bay_check = 1;
                HrVrLayers = [];
                this.ShowStep1();
            }
        }
    };
});
/* Function to close dialog box while autocalculating bays, Step-1 */
function CloseStep1() {
    var a = jQuery("#info_input .panel-close")[0];
    var e = document.createEvent('MouseEvents');
    e.initEvent('click', true, true);
    a.dispatchEvent(e);
}

/* Function to close dialog box while autocalculating bays, Step-2 */
function CloseStep2() {
    var a = jQuery("#info_input_step2 .panel-close")[0];
    var e = document.createEvent('MouseEvents');
    e.initEvent('click', true, true);
    a.dispatchEvent(e);
}
/* Function to close dialog box while autocalculating bays, Step-3 */
function CloseStep3() {
    var a = jQuery("#info_input_step3 .panel-close")[0];
    var e = document.createEvent('MouseEvents');
    e.initEvent('click', true, true);
    a.dispatchEvent(e);
}
/* Function to close dialog box while autocalculating bays, Step-4 */
function CloseStep4() {
    var a = jQuery("#info_input_step4 .panel-close")[0];
    var e = document.createEvent('MouseEvents');
    e.initEvent('click', true, true);
    a.dispatchEvent(e);
}

var cM2 = 0, cM1 = 0;
/* Function, called on clicking preview tab, to load preview map */
function Preview() {
    isPreview = 1;
    jQuery("#leftPanel").css('display', 'none');
    jQuery("#leftPanelPreview").css('display', 'block');
    if (cM2 == 0) {
        map2 = L.mapbox.map('leaflet_map2', 'primotus.ik4ib166');//.setView([40, -74.50], 9);
        map2.setView(new L.LatLng(41.869561, -103.542023), 4);
        cM2 = 1;
    }
    map2._onResize();
}
/* Function, called on clicking define tab, to load define map */
function Define() {
    isPreview = 0;
    jQuery("#leftPanel").css('display', 'block');
    jQuery("#leftPanelPreview").css('display', 'none');
    try {
        map._onResize();
    } catch (e) {
        console.log(e);
    }
}
app.service('Map', function (){
    /* Loading map */
    this.load_map = function() {
        map = L.mapbox.map('leaflet_map', 'primotus.ik4ib166');
        map.setView(new L.LatLng(41.869561, -103.542023), 4);
    };
    /* Initializing map controls */
    this.init_controls = function() {
        drawnItems = new L.FeatureGroup();
        layer_to_edit = new L.FeatureGroup();
        editable_layer = new L.FeatureGroup();
        map.addLayer(drawnItems);
        map.addLayer(layer_to_edit);
        drawControl = new L.Control.Draw({position: 'topleft',
            draw: {
                polyline: {
                    metric: true
                },
                polygon: {
                    allowIntersection: false,
                    showArea: true,
                    drawError: {
                        color: '#b00b00',
                        timeout: 1000
                    },
                    shapeOptions: {color: '#000000'
                    }
                },
                marker: true
            }
            ,
            edit: {
                featureGroup: editable_layer, //editable_layer,//layer_to_edit, //.getLayers()[0],
                remove: true
            }
        });
    };
    
    /* Styles initialization */
    this.init_style = function() {
        copy_paste_style = {
            fill: false,
            fillOpacity: 0.5,
            color: 'black', //'#000000',
            weight: 2,
            opacity: 1
        };
        no_fill_style = {
            fill: false,
            fillOpacity: 0,
            color: '#000000',
            weight: 2,
            opacity: 1
        };
        remove_style = {fill: false,
            fillOpacity: 0,
            stroke: false,
            color: '#000000',
            weight: 0,
            opacity: 0
        };
    };
});