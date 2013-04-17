(function(){
	var id = 0;

	var extend = function(dest, src) {
		for (var member in src) {
			dest[member] = src[member];
    }	
    return dest;
	};

	var eventSplitter = /\s+(.+)/;

	var bind = function(ctx, func){
		return function(){
			func.apply(ctx, arguments);
		};
	};

	/**
	 * Add Event to state.$el
	 *
	 * TODO: make this deffered and react to this.$el
	 *
	 * @param (Object) selector string in the form of "event selector"
	 * @cb(function)
	 */
	var event = function(string, cb) {
		var tokens = string.split(eventSplitter);
		var event = tokens[0];
		var selector = tokens[1];
		if(event === "timeout") {
			return setTimeout(cb, selector);
		} else if(event === "interval") {
			return setInterval(cb, selector);
		}
		else if ($) {
			if(this.selector) {
				this.$el = $(this.selector);
			}
			else if(this.el){
				this.$el = $(this.el);
			}
			if(this.$el) {
				cb = bind(this, cb);
				
				if(selector) {
					this.$el.on(event, selector, cb);
				} else {
					this.$el.on(event, cb);
				}
			}
		}
		this._events[string] = cb;
	};

	var events = {};

	var makeSub = function(ref) {
		var sub = function(eventName, cb) {
			var ctx = ref.states;
			var cbs = events[eventName];
			if (cbs) {
				cbs.push({cb: cb, ref: ref, ctx: ctx});
			} else {
				events[eventName] = [{cb: cb, ref: ref, ctx: ctx}];
			}
		};

		return sub;
	};

	var pub = function(eventName, args, ref) {
		var cbs = events[eventName];
		var i, len, cb;
		
		if(toString.call(args) !== '[object Array]') {
			args = [args];
		}
		
		if(cbs) {
			if (ref) {
				for(i = 0, len = cbs.length; i < len; i++){
					cb = cbs[i];
					cb.cb.apply(cb.ctx, args);
				}
			} else {
				for(i = 0, len = cbs.length; i < len; i++){
					cb = cbs[i];
					if(ref === cb.ref) {
						cb.cb.apply(cb.ctx, args);
					}
				}
			}
		}
	};

	var createGetterAndSetter = function(object, prop) {
		Object.defineProperty(object, prop, {
			get: function() {
				return this.data[prop];
			},
			set: function(value) {
				this.data[prop] = value;
				this._fireChange(prop, value);
			}
		});
	};

	var Data = function(object) {
		this.data = object;
		for(var prop in object) {
			if(object.hasOwnProperty(prop)) { 
				createGetterAndSetter(this, prop);
			}
		}
		this.changeCbs = {};
	};

	Data.prototype = {
		_onChange: function(member, callBack) {
			var cbs = this.changeCbs[member];
			if(!cbs) {
				this.changeCbs[member] = [callBack];
			} else {
				cbs.push(callBack);
			}
		},
		_offChange: function(member, callBack) {
			var cbs = this.changeCbs[member];
			if(cbs) {
				for(var i = 0, len = cbs.length; i < len; i++) {
					if(cbs[i] === callBack) {
						cbs.splice(i, 1);
					}
				}
			}
		},
		_fireChange: function(member, value) {
			var cbs = this.changeCbs[member];
			if(cbs) {
				for(var i = 0, len = cbs.length; i < len; i++) {
					cbs[i](member, value);
				}
			}
		}
	};

	var toString = {}.toString;

	var applyBehaviors = function(model, behaviors) {	
		console.log(toString.call(behaviors));
		if(toString.call(behaviors) === '[object Function]'){
			behaviors.call(model);
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
		var NewModel = function(object, state){
			this.data = new Data(object);
			this.states = extend({_events: {}}, state);
			this.states.event = event;
			this.states.pub = pub;
			this.states.sub = makeSub(this);
			this.changeCbs = {};
			this.behaviors = [];
		};
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
	var mbs = function (object, behaviors, state) {
		var NewModel = extendModel();
		if(!state) {
			state = {};
		}
		var model = new NewModel(object, state);
		applyBehaviors(model, behaviors);
		NewModel.prototype.behaviors = behaviors;

		return model;
	};

	var construct = function (objectDefaults, behaviors, stateDefaults) {
		var NewModel = extendModel();
		if(!state) {
			state = {};
		}
		var NewNewModel = function(object, state) {
			state = extend(stateDefaults.slice(0), state);
			NewModel.call(this, object, state);
			applyBehaviors(this, behaviors);
		};
		NewNewModel.prototype = NewModel.prototype;
		NewNewModel.prototype.behaviors = behaviors;
		return NewNewModel;
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
				func.call(this);
				args.shift();
			};
		};

		ret.namespace = namespace;
		return ret;
	};

	this.Mobius = mbs;
	mbs.Framework = {};
	mbs.construct = construct;
	mbs.define = define;
})(this);

if(this.module != null) {
	this.module.exports = this.mbs;
}
