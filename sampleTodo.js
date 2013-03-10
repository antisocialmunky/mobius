(function(){
	var render = function(model, selector, template, renderFunc){
		if(!$.fn[renderFunc]) {
			renderFunc = "html";
		}
		template = _.template(template);
		var $el = $(selector);
		$el[renderFunc](template({model:model}));
		return $el;
	};

	var count = 0;
	var counterFunc = function() {
		return count++;
	};

	var nameFunc = function() {
		return Math.random().toString(36).substring(7);
	};

	var isPopup = Mobius.define(function(model, options) {
		var $el = render(model, "<div></div>", "Are You Sure?<span class='confirm'>Yes</span><span class ='refuse'>No</span>");
		this.$el = $el;
		this.sub("ShowPopup", function(cb) {
			$('body').append(this.$el);
			this.cb = cb;
		});

		this.event("click .confirm", function() {
			this.cb(true);
			this.$el.detach();
		});

		this.event("click .refuse", function(){
			this.cb(false);
			this.$el.detach();
		});
	});

	var rendersItem = Mobius.define(function(model, options) {
		var $el = render(model, "#" + options.rendersTo + " ul", "<li id = '" + options.id + model.id + "'>" + model.name + "</li>", "append");
		this.$el = $el.find("#" + options.id + model.id);
	});

	var deletesSelf = Mobius.define(function(model, options) {
		var $el = this.$el;
		var items = this.collection.items;
		if(options) {
			this.dialog = options.dialog;
		}

		var removeCB = function(confirm) {
			if(confirm) {
				$el.detach();
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
		render(model, "body", "<div id = '" + options.id + "'><h1>" + options.name + "</h1><input type='text' value='Do This!'><span id = 'add'>Add+</span><ul></ul></div>");
		var items = model.items;
		for(var i = 0, len = items.length; i < len; i++) {
			Mobius(items[i], Item(model), {collection: model});
		}

		this.$el = $el =  $("#"+options.id);

		this.event(
			"click #add", 
			function(){
				var name = $el.find('input').val();
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