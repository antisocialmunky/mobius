(function(){
	var id = 0;

	var Model = function(object){
		this.data = object;
		this.states = {};
		this.behaviors = [];
	};

	/**
	 * Convert an object to a model
	 *
	 * @param ({}) javascript object to turn into a model
	 * @return (Model) an initialized model
	 */
	var mbs = function(object, behaviors) {
		var model = new Model(object);
		var toString = {}.toString;
		if(arguments.length > 2) {
			behaviors = Array.prototype.slice.call(arguments);
			behaviors.shift();
		}
		console.log(toString.call(behaviors));
		if(toString.call(behaviors) === '[object Function]'){
			behaviors.call(model);
		} else if(toString.call(behaviors) === '[object Object]'){
			for(var behaviorName in behaviors) {
				if(behaviors.hasOwnProperty(behaviorName) && toString.call(behaviors[behaviorName]) === '[object Function]') {
					behaviors[behaviorName].call(model);
				}
			}
		} else if(toString.call(behaviors) === '[object Array]'){
			for(var i = 0, len = behaviors.length; i < len; i++) {
				if(toString.call(behaviors[i]) === '[object Function]') {
					behaviors[i].call(model);
				}
			}
		}
		return model;
	};

	/**
	 * Create a new behavior
	 *
	 * @param (function(model, [param1], [param2], ...)) behavior function
	 * @param (string) optional: name of the state store you want to you
	 */
	var define = function(behavior, namespace){
		if(arguments.length < 1 || {}.toString.call(behavior) !== '[object Function]') {
			return;
		}

		if(typeof namespace !== "string" || namespace === ""){
			namespace = false;
		}

		// Pay no attention to the man behind the curtain!
		var ret = function() {
			var args = Array.prototype.slice.call(arguments);
			return function(){
				args.unshift(this.data);
				var func = function() {
					var state = this.states;
					if(namespace) {
						if(!this.states.hasOwnProperty(namespace)) {
							state = state[namespace] = {};
						} else {
							state = state[namespace];
						}
					} 
					behavior.apply(state, args);
				};
				this.behaviors.push(func);
				func.call(this);
				args.shift();
			};
		};

		Model.prototype[name] = ret;

		ret.namespace = namespace;
		return ret;
	};

	this.Mobius = mbs;
	mbs.define = define;
})(this);