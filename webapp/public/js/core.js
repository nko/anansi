jQuery(function ($) {
   $('.form-field .instructions').hide();
   $('.form-field').hover(formField.hoverIn, formField.hoverOut);
});

var formField = {
    hoverIn: function () {
        $(this).addClass('focused').find('.instructions').show();
    },
    hoverOut: function () {
        $(this).removeClass('focused').find('.instructions').hide();
    }
};