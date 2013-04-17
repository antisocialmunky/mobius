(function() {
	this.Framework.Render = {
		replaceWith: function(selector, to){
			var $el = $(selector);
			var $to = $(to);
			$to.children().detach();
			$to.html(selector);
			return $el;
		},
		appendTo: function(selector, to){
			var $el = $(selector);
			$(to).append(selector);
			return $el;
		},
		remove: function(selector){
			return $(selector).detach();
		},
		moveTo: function(selector, to){
			var $el = this.removeFrom(selector);
			$(to).append($el);
			return $el;
		}
	};
}).call(Mobius);