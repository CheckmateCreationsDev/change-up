(function () {
	var interval;

	/*****************************************************************************/
	/* categoryBar: Event Handlers */
	/*****************************************************************************/
	Template.categoryBar.events({
		'click .ci-main-title' : function (event) {
			var element = $(event.target);

			element.parent().children().not('.ci-main-title').toggle();
		}
	});

	/*****************************************************************************/
	/* categoryBar: Helpers */
	/*****************************************************************************/
	Template.categoryBar.helpers({
		categories : function () {
			var cats = [];
			var subs;

			for(var i = 1; i <= 8; i++){
				subs = [];
				for(var x=1; x<=5; x++) {
					subs.push({
						name : "Subcategory " + x
					})
				}
				cats.push({
					name : 'Category ' + i,
					subs : subs
				})
			}

			return cats;
		}
	});

	/*****************************************************************************/
	/* categoryBar: Lifecycle Hooks */
	/*****************************************************************************/
	Template.categoryBar.onCreated(function () {});

	Template.categoryBar.onRendered(function () {});

	Template.categoryBar.onDestroyed(function () {});
})();
