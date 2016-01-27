/*****************************************************************************/
/* Reviews: Event Handlers */
/*****************************************************************************/
Template.Reviews.events({
	'submit form#review' : function (event) {
		event.preventDefault();

		var form = event.target;
		var productId = this._id;

		var review = {
			rating : function () {
				return $('#review-stars').children('.selected').length;
			}(),
			title : form.reviewTitle.value,
			comment : form.comment.value
		}

		if(review.rating < 1) {
			return sAlert.error('please leave a rating');
		}

		Meteor.call('addProductReview', productId, review, function (err, data) {
			if(err){
				sAlert.error(err);
			} else if (data === "please log in to post a review"){
				sAlert.error(data);
			} else if (data === "review updated"){
				sAlert.success(data);
			} else {
				sAlert.success('review posted');
				// Router.go('/item/'+productId);
			}
		});
	},
	'click #review-stars li' : function (event) {
		var star = $(event.target);
		var stars = star.prevAll();
		var nextStars = star.nextAll();

		//select the clicked star and
		//ever star before it
		star.addClass('selected');
		stars.addClass('selected');

		//unselect every star after the clicked star
		nextStars.removeClass('selected');
	}
});

/*****************************************************************************/
/* Reviews: Helpers */
/*****************************************************************************/
Template.Reviews.helpers({
	reviewStars : function  () {
		return [1,2,3,4,5];
	}
});

/*****************************************************************************/
/* Reviews: Lifecycle Hooks */
/*****************************************************************************/
Template.Reviews.onCreated(function () {
});

Template.Reviews.onRendered(function () {

	// if (Products.find({_id : this.data._id },{'reviews.$.userId':Meteor.userId()}).fetch()){
	// 	var productReview = (Products.find({_id : this.data._id },{'reviews.$.userId':Meteor.userId()}).fetch())[0];
	// 	console.log(productReview);
	// }
	if (Meteor.userId()){
		Meteor.call('getMyReview', this.data._id, function (err, data) {
			if (data) {
				$('#write').text('Update your review');
				$('#reviewTitle').val(data.title);
				$('#comment').val(data.comment);
				console.log(data);
			}
		})
	}
});

Template.Reviews.onDestroyed(function () {
});
