(function () {
	Future = Npm.require('fibers/future');

	Meteor.methods({
		setCart : function set_cart (cart) {
			Meteor.users.update({
				_id : Meteor.userId()
			}, {
				$set : {'profile.cart' : cart}
			})
		},
	  addToCart: function add_to_cart(cartItem) {
	    //check if the item is already in the cart
	    var user = Meteor.user();

	    if (!user) {
	      throw new Meteor.Error('not-logged-in', 'you are not logged in');
	    }

	    if (user && _.isArray(user.profile.cart)) {
	      var indx = user.profile.cart.findIndex(function(item) {
	        return ((cartItem.productId == item.productId) && cartItem.size == item.size);
	      })

	      if (indx > -1) {
	        return Meteor.users.update({
	          _id: Meteor.userId(),
	          'profile.cart.productId': cartItem.productId
	        }, {
	          $inc: {
	            'profile.cart.$.quantity': cartItem.quantity || 1
	          }
	        })
	      }
	    }

	    Meteor.users.update({
	      _id: Meteor.userId()
	    }, {
	      $push: {
	        'profile.cart': cartItem
	      }
	    });
	  },
	  removeFromCart: function remove_from_cart(id) {
	    //weird error where mongodb $pull won't work
	    //in meteor but will in console
	    //$pull : {'profile.cart': {id :id}}
	    var user = Meteor.user();

	    if (!user) {
	      throw new Meteor.Error('not-logged-in', 'you are not logged in');
	    }

	    var cart = user.profile.cart;

	    var indx = cart.findIndex(function(item) {
	      return item.id == id;
	    })

	    cart.splice(indx, 1);

	    Meteor.users.update(Meteor.userId(), {
	      $set: {
	        'profile.cart': cart
	      }
	    });
	  },
	  createStripeCustomer : function create_stripe_customer(token, email) {
	  	var Stripe = Meteor.settings.private.stripe.apiKey;;
	  	var customer = new Future();

	  	Stripe.customers.create({
	  		source : token,
	  		email : email
	  	}, function (err, response) {
	  		if(err) {
	  			console.error('create customer err', err);
	  			customer.throw(new Meteor.Error('bad-customer', "couldn't create a new customer"));
	  		} else {
	  			customer.return(response);
	  		}
	  	});

	  	return customer.wait();
	  },
	  createStripeCharge : function create_stripe_charge(charge) {
	  	var Stripe = Meteor.settings.private.stripe.apiKey;;
	  	var finalCharge = new Future();

	  	Stripe.charges.create(charge, function (err, response) {
	  		if(err) {
	  			console.error(err);
	  			finalCharge.throw(new Meteor.Error('invalid-card-charge', "transaction failed"));
	  		} else {
	  			finalCharge.return(response);
	  		}
	  	})

	  	return finalCharge.wait();
	  },
	  checkout: function checkout(cart, billing, shipping, stripeToken, email) {
	    var $checkoutResponse = new Future();
	    var checkout = new CHECKOUT(shipping, billing, stripeToken, email, cart);
	    var existingCustomer = checkout.getCustomer();
	    var user = Meteor.user();

	    if(existingCustomer) {
	    	checkout.chargeExistingCustomer(existingCustomer, customerCharged);
	    } else {
	    	checkout.chargeNewCustomer(customerCharged);
	    }

	    return $checkoutResponse.wait();

	    function customerCharged (err, transactionNum) {
	    	if(err) {
	    		return $checkoutResponse.throw(err);
	    	}

	    	$checkoutResponse.return(transactionNum);

	    	//send email async
	    	Meteor.setTimeout(function () {
	    		var body = "";
	    		var br = '\n'

	    		body += "Buyer Name : " + billing.creditCardName + br;
	    		body += "Payment Number : " + transactionNum + br;
	    		body += "Payment Date : " + moment(Date.now()).format("MMM Do YYYY") + br; 
	    		body += "Payment Card : " + billing.lastFour + br;
	    		body += br;

	    		//add the product names and prices
	    		_.each(checkout.order, function (item) {
	    			body += item.productName + ' : $' + item.price + ' X' + item.quantity + br;
	    		});

	    		body += "shipping : $6.00" + br;
	    		body += "total : $" +  checkout.finalPrice + br;
	    		body += "Thank You." + br;
	    		body += "Sincerely," + br;
	    		body += "ChangeUp";

	    		Email.send({
						to : user.emails[0].address,
						from : 'noreply@changeup.com', 
						subject : 'Order receipt',
						text : body
					})
	    	});
	    };
	  }
	})
})();
