var socket = io.connect(document.location.href);

/* ==== */

var Car = Backbone.Model.extend({
	defaults: {
		plate: '',
		image: '',
	}
});

var CarCollection = Backbone.Collection.extend({
	model: Car
});

var CarView = Backbone.View.extend({
	className: 'Car',
	initialize: function() {
		this.template = _.template($('script#template_'+this.className).text());
	},
	render: function() {
		this.$el.html(this.template(this.model.attributes));
		return this;
	}
});

var CarCollectionView = Backbone.View.extend({
	className: 'CarCollection',
	initialize: function() {
		this.collection.on('add',this.renderCar,this);
	},
	renderCar: function(car) {
		var v = new CarView({model:car});
		this.$el.append(v.render().el);
	},
	render: function() {
		var that = this;
		this.collection.each(function(car) {
			that.renderCar(car);
		});
		return this;
	}
});

var cc = new CarCollection();
var ccv = new CarCollectionView({collection: cc});

$(function() {
	$('body').append(ccv.render().el);
	socket.emit('start');
});

socket.on('car',function(car) {
	cc.add(car);
});

socket.on('progress',function(progress) {
	$('#progress').text(progress);
});