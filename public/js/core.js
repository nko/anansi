(function($) {
	$(document).ready(function() {
		$.ajax({
			type: "GET",
			url: "/recently_solved",
			data: "",
			dataType: "json",
			success: function(data) {
				var bldString = '';
				for(var i = 0; i < data.length; i++) {
					bldString += [
						'<dd>',
							'<a href="' + data[i].url + '" title="' + data[i].name + '">' + data[i].name + ' <span class="job_percentage">(' + data[i].percentage + '%)</span></a>',
						'</dd>'
					].join('');
				}

				$("#loading_jobs").hide();
				$("#solved_jobs").append(bldString);
			},
			error: function(e) {
				if(typeof console !== "undefined" && typeof console.log === "function") console.log(e);
				$("#loading_jobs").hide();
				$("#solved_jobs").append('<dd class="error">No jobs could be loaded at this time.</dd>');
			}
		});
		
		$('.form-field .instructions').hide();
		$('.form-field').hover(formField.hoverIn, formField.hoverOut);
	});
})(jQuery);

var formField = {
    hoverIn: function () {
        $(this).addClass('focused').find('.instructions').show();
    },
    hoverOut: function () {
        $(this).removeClass('focused').find('.instructions').hide();
    }
};
