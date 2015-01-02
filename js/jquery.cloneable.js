/**
 * @author Alexander Chuprin a.s.chuprin@gmail.com
 * @since 20.08.11
 */
(function($) {
    $.fn.cloneable = function(options) {
        var defaults = {
            before: $.noop,
            after: $.noop,
            copies: 10
        };

        var settings = $.extend({}, defaults, options);

        return this.each(function() {
            var self = $(this);
            var counter = 2;
            var original = self.clone();
            //var addButton = $('<span class="jc-add">add</span>');

            /* Append clone button */
            //self.append(addButton);

            $("#f" ).on('click',function(){
                alert('clicked');
                for (var i = 0; i < settings.copies; i++) {
                    settings.before.call(original);

                    var clone = original.clone();
                    var removeButton = $('<span class="jc-remove">remove</span>');

                    removeButton.click(function() {
                        clone.remove();
                    });

                    clone.insertBefore(self)
                    .find('[name]') // We should update all IDs.
                    .andSelf()
                    .attr('name', function(index, val) {
//                                                alert(val);
                        if (val) {
                            //                            var n=val.indexOf("_");
                            //                            val = val.replace("_0", "");
//                            counter++;
//                            alert(counter);
                            val = val.split("1");
                            var newId =  val[0] + (counter);
//                            alert(newId);
                            clone.find('label').filter('[for=' + val + ']').attr('for', newId); // Also update label associated with old ID.
                            return newId;
                        }
                    })
                    //.cloneable(settings) // Make cloneable just cloned block also.
                    .append(removeButton);

                    /* Reset all input values */
                    clone.find(':input:not(select)').val('');
                    clone.find('select option:first').attr('selected', 'selected');

                                        ++counter;
                    settings.before.call(clone);
                }
            });

        });
    };
})(jQuery)