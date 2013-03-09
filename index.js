(function(){
	var id = 0;

	var extend = function(dest, src) {
		for (var member in src) {
			dest[member] = src[member];
    }	
    return dest;
	};

	var construct = function(object, state){
		this.data = object;
		this.states = extend({}, state);
		this.changeCbs = {};
	};

	var prototype = {
		behaviors: [],
		get: function(member) {
			return this.data[member];
		},
		set: function(member, value) {
			this.data[member] = value;
			this.fireChange(member, value);
		},
		onChange: function(member, callBack) {
			var cbs = this.changeCbs[member];
			if(!cbs) {
				this.changeCbs[member] = [callBack];
			} else {
				cbs.push(callBack);
			}
		},
		offChange: function(member, callBack) {
			var cbs = this.changeCbs[member];
			if(cbs) {
				for(var i = 0, len = cbs.length; i < len; i++) {
					if(cbs[i] === callBack) {
						cbs.splice(i, 1);
					}
				}
			}
		},
		fireChange: function(member, value) {
			var cbs = this.changeCbs[member];
			if(cbs) {
				for(var i = 0, len = cbs.length; i < len; i++) {
					cbs[i](member, value);
				}
			}
		}
	};

	prototype.g = prototype.get;
	prototype.s = prototype.set;

	var toString = {}.toString;

	var applyBehaviors = function(model, behaviors) {	
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

	var extendModel = function() {
		var NewModel = function() {
			construct.apply(this, arguments);
		};
		extend(NewModel.prototype, prototype);
		NewModel.prototype.class = NewModel;

		return NewModel;
	};

	/**
	 * Convert an object to a model
	 *
	 * @param (Object) javascript object to turn into a model
	 * @param (Object) a list of behaviors
	 * @return (Model) an initialized model
	 */
	var mbs = function(object, behaviors, state) {
		var NewModel = extendModel();

		var model = new NewModel(object, state);
		applyBehaviors(model, behaviors, state);
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

		// Pay no attention to the thunk behind the curtain!
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
				this.class.prototype.behaviors.push(func);
				func.call(this);
				args.shift();
			};
		};

		ret.namespace = namespace;
		return ret;
	};

	/**
	 * Create a constructor with many behaviors
	 *
	 * @param (Object) javascript object filled with defaults
	 * @param (Object) a list of behaviors
	 * @return (Model) a constructor function
	 */
	 /*
	var constructor = function (defaults) {
		
		var args = Array.prototype.slice.call(arguments);
		if(toString.call(defaults) === '[object Object]') {
			args.shift();
		} else {
			defaults = {};
		}

		var NewModel = function(object) {
			if(!object) { 
				object = {};
			}
			construct.call(this, object);
			extend(this.data, defaults);
			extend(this.data, object);
			args.unshift(this);
			applyBehaviors.apply(this, args);
			args.shift();
		};

		extend(NewModel.prototype, prototype);
		NewModel.prototype.class = NewModel;

		return NewModel;
	};*/

	this.Mobius = mbs;
	mbs.define = define;
	//mbs.constructor = constructor;
})(this);