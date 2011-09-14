/**
 * MiniEE is a client and server side library for routing events.
 * Main difference from EventEmitter is that callbacks can be specified using RegExps.
 *
 * Should work on the client and the server.
 */

if(typeof exports != 'undefined'){
  var TestApp = { debug: false };
}

var MiniEventEmitter	= function(){ };

MiniEventEmitter.prototype.on = function(expr, callback) {
  if(expr instanceof RegExp) {
    this._routes || (this._routes = []);
    this._routes.unshift([ expr, callback] );
  } else {
    this._events || (this._events = {});
    this._events[expr] || (this._events[expr] = []);
    this._events[expr].unshift( callback );
  }
  return this;
};

MiniEventEmitter.prototype.addListener = MiniEventEmitter.prototype.on;

MiniEventEmitter.prototype.once = function(event, listener) {
  var self = this;
  function removeAfter() {
    self.removeListener(event, removeAfter);
    listener.apply(this, arguments);
  }
  self.on(event, removeAfter);
  return this;
};


MiniEventEmitter.prototype.removeListener	= function(expr, callback){
  if(expr instanceof RegExp && this._routes) {
//    console.log('runf', expr, callback);
    this._routes = this._routes.filter(function(value) {
//      console.log('filter', value, !(value[0] === expr && value[1] === callback));
      return !(value[0] === expr && value[1] === callback);
    });
  } else if(this._events && this._events[expr]) {
    this._events[expr] = this._events[expr].filter(function(value) {
      return !(value === callback);
    });
  }
  return this;
};

MiniEventEmitter.prototype.removeAllListeners = function(expr) {
  if(arguments.length === 0) {
    this._events = {};
    this._routes = {};
    return;
  }
  if(expr instanceof RegExp && this._routes) {
    this._routes = this._routes.filter(function(value) {
      return !(value[0] === expr);
    });
  } else if(this._events && this._events[expr]) {
    this._events[expr] = [];
  }
  return this;
};

/**
 * Perform routing on a req, res pair from an http server.
 */
MiniEventEmitter.prototype.emit = function(event /* arg .. */) {
//  console.log('emit '+event);
  // check all routes for a match
  var args = Array.prototype.slice.call(arguments, 1);
  if(this._events && this._events[event]) {
    // must run in reverse order to ensure that removing events won't skip callbacks
    for(var i = this._events[event].length-1; i > -1 && this._events[event] && this._events[event][i]; i--){
      this._events[event][i].apply(this, args);
    }
  }
  if(this._routes) {
    // must run in reverse order to ensure that removing events won't skip callbacks
    for(var i = this._routes.length-1; i > -1; i--){
      if(this._routes[i][0].test(event)) {
        this._routes[i][1].apply(this, args);
      }
    }
  }
  return this;
}

/**
 * mixin - augment the target object with the MiniEE functions
 */
MiniEventEmitter.mixin	= function(destObject){
	var props	= ['on', 'removeListener', 'removeAllListeners',  'emit', 'next', 'once'];
	for(var i = 0; i < props.length; i ++){
		destObject.prototype[props[i]]	= MiniEventEmitter.prototype[props[i]];
	}
}

// export in common js
if( typeof module !== "undefined" && ('exports' in module)){
	module.exports	= MiniEventEmitter;
}
