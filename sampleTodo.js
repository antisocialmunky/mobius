(function(){
	var render = function(model, template) {
		return _.template(template)({model:model});
	};

	var count = 0;
	var counterFunc = function() {
		return count++;
	};

	var nameFunc = function() {
		return Math.random().toString(36).substring(7);
	};

	var isPopup = Mobius.define(function(model, options) {
		var html = render(model, "<div>Are You Sure?<span class='confirm'>Yes</span><span class ='refuse'>No</span></div>");
		this.$el = $(html);
		this.sub("ShowPopup", function(cb) {
			Mobius.Framework.Render.appendTo(this.$el, "body");
			this.cb = cb;
		});

		this.event("click .confirm", function() {
			this.cb(true);
			Mobius.Framework.Render.remove(this.$el);
		});

		this.event("click .refuse", function(){
			this.cb(false);
			Mobius.Framework.Render.remove(this.$el);
		});
	});

	var rendersItem = Mobius.define(function(model, options) {
		var html = render(model, "<li id = '" + options.id + model.id + "'>" + model.name + "</li>");
		this.$el = $(html);
		Mobius.Framework.Render.appendTo(this.$el, "#" + options.rendersTo + " ul");
		this.$el.find("#" + options.id + model.id);
	});

	var deletesSelf = Mobius.define(function(model, options) {
		var $el = this.$el;
		var items = this.collection.items;
		if(options) {
			this.dialog = options.dialog;
		}

		var removeCB = function(confirm) {
			if(confirm) {
				Mobius.Framework.Render.remove($el);
				for(var i = 0, len = items.length; i < len; i++) {
					if(items[i] === model) {
						items.splice(i, 1);
					}
				}
			}
		};

		this.event(
			"click", 
			function(){
				if(options && options.dialog) {
					this.pub("ShowPopup", removeCB, options.dialog);
				} else {
					removeCB(true);
				}
			});
	});

	var popup = Mobius({}, isPopup());

	var Item = function(itemCollection){
		return [
		rendersItem({
			rendersTo: "todo", 
			id: "todoItem"
		}), 
		deletesSelf({dialog: popup})];
	};
	
	var rendersItemCollection = Mobius.define(function(model, options){
		var html = render(model, "<div id = '" + options.id + "'><h1>" + options.name + "</h1><input type='text' value='Do This!'><span id = 'add'>Add+</span><ul></ul></div>");
		this.$el = $(html);

		Mobius.Framework.Render.appendTo(this.$el, "body");

		var items = model.items;
		for(var i = 0, len = items.length; i < len; i++) {
			Mobius(items[i], Item(model), {collection: model});
		}

		this.event(
			"click #add", 
			function(){
				var name = this.$el.find('input').val();
				var item = {id: counterFunc(), name: name};
				model.items.push(item);
				Mobius(item, Item(model), {collection: model});
			});
	});

	var ItemCollection = rendersItemCollection({
		id: "todo", 
		name: "Todos!"
	});

	Mobius({items:[
		{id: counterFunc(), name: nameFunc()},
		{id: counterFunc(), name: nameFunc()},
		{id: counterFunc(), name: nameFunc()},
		{id: counterFunc(), name: nameFunc()}
		]}, ItemCollection);
})();