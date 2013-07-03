// Backbone.Component
// ==================
// 
// A thin layer on top of Backbone's view class to add nested child views.
//
// ---

Backbone.Component = Backbone.View.extend({

  // Override constructor so Components can use initialise as normal.
  constructor: function() {
    this._children = [];
    this.add = this.append;
    this.render = this._wrapRender();
    this.remove = this._wrapRemove();

    Backbone.View.apply(this, arguments);
  },

  // Public API
  // ----------
  // ----------

  // Add a child view to the end of the element.
  // Optionally specify a selector within the view to attach to.
  append: function(view, selector) {
    this._addChild(view, selector, 'append');
    return this;
  },

  // Add a child view to the beginning of the view's element.
  // Optionally specify a selector within the view to attach to.
  prepend: function(view, selector) {
    this._addChild(view, selector, 'prepend');
    return this;
  },

  // Private methods
  // ----------
  // ----------

  // Add a child view to an internal array keeping a reference to
  // element and attach method it should use.
  _addChild: function(view, selector, method) {
    var child = { view: view, selector: selector, method: method };

    // Assign a method to the child so it can remove itself from
    // `_children` array when it's removed.
    var removeFromParent = _.bind(this._removeFromParent, this);
    view._removeFromParent = _.partial(removeFromParent, child);

    this._children.push(child);
  },

  // Call remove for each child added to the view.
  _removeChildren: function() {
    _.invoke(_.pluck(this._children, 'view'), 'remove');
  },

  _removeFromParent: function(child) {
    this._children = _.without(this._children, child);
  },

  // Wrap render to automatically attach all children.
  _wrapRender: function() {
    var wrapper = function(render) {
      var args = Array.prototype.slice.call(arguments, 1);
      render.apply(this, args);
      this._attachChildren();
      return this;
    };

    var originalRender = _.bind(this.render, this);
    return _.wrap(originalRender, wrapper);
  },

  // Wrap remove to automatically remove all children and itself from 
  // its parent.
  _wrapRemove: function() {
    var wrapper = function(remove) {
      this._removeFromParent();
      this._removeChildren();
      remove();
      return this;
    };

    var originalRemove = _.bind(this.remove, this);
    return _.wrap(originalRemove, wrapper);
  },

  // Attach child to the correct element and with correct method.
  // Defaults to `this.$el` and `append`.
  _attachChild: function(child) {
    var method = child.method || 'append';
    var target = child.selector ? this.$(child.selector) : this.$el;

    child.view.render();
    target[method](child.view.$el);
  },

  // Attach all children in the right order.
  // Call `delegateEvents` for each child view so handlers are correctly
  // bound after being attached.
  _attachChildren: function() {
    _.each(this._children, function(child) {
      this._attachChild(child);
      child.view.delegateEvents();
    }, this);
  }
});
