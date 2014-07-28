// Generated by LiveScript 1.2.0
(function(){
  var Collection;
  Collection = (function(){
    Collection.displayName = 'Collection';
    var prototype = Collection.prototype, constructor = Collection;
    function Collection(resources, _href){
      var this$ = this instanceof ctor$ ? this : new ctor$;
      this$.resources = resources;
      this$._href = _href;
      return this$;
    } function ctor$(){} ctor$.prototype = prototype;
    Object.defineProperty(prototype, 'ids', {
      get: function(){
        return this.resources.map(function(it){
          return it.id;
        });
      },
      configurable: true,
      enumerable: true
    });
    Object.defineProperty(prototype, 'type', {
      get: function(){
        return this.resources[0].type;
      },
      configurable: true,
      enumerable: true
    });
    Object.defineProperty(prototype, 'href', {
      get: function(){
        return this._href || function(){
          return 'something dynamic';
        };
      },
      set: function(href){
        this._href = href;
      },
      configurable: true,
      enumerable: true
    });
    return Collection;
  }());
  module.exports = Collection;
}).call(this);
