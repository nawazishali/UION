window.UION = window.UI = (function (exports, window, UIkit) {
  var
    ACTIVE_CLASS = 'uk-active',
    HIDDEN_CLASS = 'uk-hidden';

  var
    $counters = {},
    $definitions = {},
    $listeners = {},
    $windowListeners = {
      mousemove: [windowOnMouseMove],
      mouseup: [windowOnMouseUp],
      touchend: [windowOnMouseUp],
      touchmove: [windowOnMouseMove],
      load: [windowOnLoad],
      resize: []
    },
    $globalListenerIds = {},
    $components = {};

  extend(exports, {
    $ready: false,
    $dragThreshold: 10,
    $globalListenerIds: $globalListenerIds,
    $windowListeners: $windowListeners,
    $counters: $counters,

    listeners: $listeners,
    definitions: $definitions,
    components: $components,

    message: UIkit.notify,
    confirm: UIkit.modal.confirm,
    prompt: UIkit.modal.prompt,
    alert: UIkit.modal.alert,

    $$: $$,

    isArray: isArray,
    isString: isString,
    isObject: isObject,
    isDefined: isDefined,
    isUndefined: isUndefined,
    isNumber: isNumber,
    isBoolean: isBoolean,
    isFunction: isFunction,

    polyfillKeyboardEvent: polyfillKeyboardEvent,

    forIn: forIn,
    forInLoop: forInLoop,
    forEachUntil: forEachUntil,

    assert: assert,
    assertPropertyValidator: assertPropertyValidator,
    fail: fail,
    log: log,

    classString: classString,
    classSetters: classSetters,
    prefixClassOptions: prefixClassOptions,

    extend: extend,
    defaults: defaults,
    pluck: pluck,
    bind: bind,
    echo: echo,
    delay: delay,
    interpolate: interpolate,
    capitalize: capitalize,
    template: template,

    createElement: createElement,
    preventEvent: preventEvent,
    setAttributes: setAttributes,
    addClass: addClass,
    removeClass: removeClass,
    hasClass: hasClass,

    def: def,
    uid: uid,

    addListener: addListener,
    removeListener: removeListener
  });
  
  function isArray(obj) {
    return Array.isArray ? Array.isArray(obj) : (Object.prototype.toString.call(obj) == '[object Array]');
  }

  function isString(obj) {
    return Object.prototype.toString.call(obj) == '[object String]';
  }

  function isObject(obj) {
    return Object.prototype.toString.call(obj) == '[object Object]';
  }

  function isDefined(obj) {
    return obj !== undefined;
  }

  function isUndefined(obj) {
    return obj === undefined;
  }

  function isFalsy(obj) {
    return !obj;
  }

  function isNumber(obj) {
    return Object.prototype.toString.call(obj) == '[object Number]';
  }

  function isBoolean(obj) {
    return Object.prototype.toString.call(obj) == '[object Boolean]';
  }

  function isFunction(obj) {
    return Object.prototype.toString.call(obj) == '[object Function]';
  }

  function isElement(obj) {
    return obj && obj.nodeName && (obj.nodeType === 1 || obj.nodeType === 3);
  }

  function assert(cond, msg, details) {
    if (!cond) {
      fail(msg, details);
    }
  }

  function assertPropertyValidator(value, name, validator) {
    assert(validator(value),
      name + ' failed ' + validator.toString() +
      ' validator, got ' + value + ' instead');
  }

  function assertBasesCheck(baseName, defName, bases, isLast) {
    if (isLast)
      assert(bases.indexOf(baseName) == bases.length - 1,
        interpolate("{{base}} should be the last extension in {{name}}",
          {base: baseName, name: defName}));
    else if (defName == baseName)
      assert(bases.indexOf(baseName) != -1, defName + " is an abstract class.");
    else
      assert(bases.indexOf(baseName) != -1,
        interpolate("{{def}} must extend {{base}}.", {def: defName, base: baseName}));
  }

  function fail(message, details) {
    log("error", message);
    if (details) log("debug: ", details);
    if (exports.debug !== false) {
      throw new Error(message);
    }
  }

  function log(type, message, explanation) {
    if (message === undefined) {
      message = type;
      type = "log";
    }
    var console = window.console;
    if (console) {
      if (console[type]) console[type](message || "");
      else console.log(type + ": " + message);
      if (explanation) console.log(explanation);
    }
  }

  var keyLookup = (function () {
    var keys = {
      3: 'Cancel',
      6: 'Help',
      8: 'Backspace',
      9: 'Tab',
      12: 'Clear',
      13: 'Enter',
      16: 'Shift',
      17: 'Control',
      18: 'Alt',
      19: 'Pause',
      20: 'CapsLock',
      27: 'Escape',
      28: 'Convert',
      29: 'NonConvert',
      30: 'Accept',
      31: 'ModeChange',
      32: ' ',
      33: 'PageUp',
      34: 'PageDown',
      35: 'End',
      36: 'Home',
      37: 'ArrowLeft',
      38: 'ArrowUp',
      39: 'ArrowRight',
      40: 'ArrowDown',
      41: 'Select',
      42: 'Print',
      43: 'Execute',
      44: 'PrintScreen',
      45: 'Insert',
      46: 'Delete',
      48: ['0', ')'],
      49: ['1', '!'],
      50: ['2', '@'],
      51: ['3', '#'],
      52: ['4', '$'],
      53: ['5', '%'],
      54: ['6', '^'],
      55: ['7', '&'],
      56: ['8', '*'],
      57: ['9', '('],
      91: 'OS',
      93: 'ContextMenu',
      106: '*',
      107: '+',
      109: '-',
      110: '.',
      111: '/',
      144: 'NumLock',
      145: 'ScrollLock',
      181: 'VolumeMute',
      182: 'VolumeDown',
      183: 'VolumeUp',
      186: [';', ':'],
      187: ['=', '+'],
      188: [',', '<'],
      189: ['-', '_'],
      190: ['.', '>'],
      191: ['/', '?'],
      192: ['`', '~'],
      219: ['[', '{'],
      220: ['\\', '|'],
      221: [']', '}'],
      222: ["'", '"'],
      224: 'Meta',
      225: 'AltGraph',
      246: 'Attn',
      247: 'CrSel',
      248: 'ExSel',
      249: 'EraseEof',
      250: 'Play',
      251: 'ZoomOut'
    };

    // Function keys (F1-24).
    var i;
    for (i = 1; i < 25; i++) {
      keys[111 + i] = 'F' + i;
    }

    // Printable ASCII characters.
    var letter = '';
    for (i = 65; i < 91; i++) {
      letter = String.fromCharCode(i);
      keys[i] = [letter.toLowerCase(), letter.toUpperCase()];
    }

    // Numbers on numeric keyboard.
    for (i = 96; i < 106; i++) {
      letter = String.fromCharCode(i - 48);
      keys[i] = letter;
    }

    return keys;
  }());

  function polyfillKeyboardEvent(keyEvent) {
    var key = keyLookup[keyEvent.which || keyEvent.keyCode] || keyEvent.key;
    if (isArray(key)) {
      key = key[+keyEvent.shiftKey];
    }
    keyEvent.key = key;
    return keyEvent;
  }

  function capitalize(str) {
    return (str + '').replace(/^([a-z])|\s+([a-z])/g, function ($1) {
      return $1.toUpperCase();
    });
  }

  function interpolate(str, obj) {
    var regex = /\{\{[^\s}]*}}/gi;
    return str.replace(regex, function (match) {
      return exports.selectors.property(match.substring(2, match.length - 2))(obj);
    });
  }

  function extend(target, src) {
    forInLoop(function (key, value) {
      if (isDefined(value)) target[key] = value;
    }, src);
    return target;
  }

  function defaults(target, defaults) {
    forInLoop(function (key, value) {
      if (isUndefined(target[key])) target[key] = value;
    }, defaults);
    return target;
  }

  function pluck(array, property) {
    return array.map(exports.selectors.property(property));
  }

  function def(config) {
    var bases = Array.prototype.slice.call(arguments, 1);
    var cls = buildDef(config, bases);
    $definitions[config.__name__] = cls;
    return cls;
  }

  function classString(value) {
    if (isArray(value)) {
      return value.reduce(function (classList, cls) {
        if (classList.indexOf(cls) == -1) classList.push(cls);
        return classList;
      }, []).join(' ');
    }
    else if (isString(value)) {
      return value;
    }
    else if (isBoolean(value)) {
      return String(value);
    }
    else return '';
  }

  function template(templateObject, config, thisArg, parentNode) {
    if (isFunction(templateObject)) {
      templateObject = templateObject.call(thisArg, config);
    }
    
    if (isString(templateObject)) {
      parentNode.innerHTML = interpolate(templateObject, config);
    }
    else if (isElement(templateObject)) {
      parentNode.appendChild(templateObject);
    }
    else if (isObject(templateObject)) {
      if (!templateObject.$component) {
        templateObject.$component = exports.new(templateObject, parentNode);
        thisArg.$components.push(templateObject.$component);
      }
    }
    else if (isArray(templateObject)) {
      templateObject.forEach(function (obj) {
        template(obj, config, thisArg, parentNode);
      });
    }
    else {
      fail('Unrecognized template!', config);
    }
  }

  function assignClassToMethods(methods, cls) {
    Object.keys(methods).forEach(function (name) {
      if (isFunction(methods[name])) methods[name].__class__ = cls;
    });
  }

  function buildDef(config, bases) {
    assertPropertyValidator(config.__name__, '__name__', isDefined);

    var compiled = extend({}, config);
    var init = config.__init__ ? [config.__init__] : [];
    var after = config.__after__ ? [config.__after__] : [];
    var $defaults = config.$defaults || {};
    var $setters = config.$setters || {};
    var $events = config.$events || {};

    assignClassToMethods($setters, config.__name__);
    assignClassToMethods(config, config.__name__);

    var baseNames = bases.reduce(function (names, base, index) {
      assertPropertyValidator(base, config.__name__ + ' base[' + index + ']', isDefined);

      if (base.__name__) {
        names.push(base.__name__);
      } else if (isFunction(base)) {
        names.push(base.prototype.__name__);
        return names.concat(base.prototype.__baseNames__);
      }
      return names;
    }, []);

    bases.forEach(function (base) {
      if (isFunction(base)) {
        base = base.prototype;
      }
      if (base.__check__) {
        base.__check__(baseNames);
      }
      if (base.__init__) {
        init.push(base.__init__);
      }
      if (base.__after__) {
        after.push(base.__after__);
      }
      if (base.$defaults) {
        defaults($defaults, base.$defaults);
      }
      if (base.$events) {
        defaults($events, base.$events);
      }
      if (base.$setters) {
        defaults($setters, base.$setters);
      }
      defaults(compiled, base);
    });

    // Override special properties that are carried through the inheritance structure.
    compiled.__init__ = function () {
      // Initialize ancestor bases first.
      for (var k = init.length - 1; k >= 0; k--) {
        init[k].apply(this, arguments);
      }
    };
    compiled.__after__ = function () {
      // Initialize ancestor bases first.
      for (var h = after.length - 1; h >= 0; h--)
        after[h].apply(this, arguments);
    };
    compiled.__name__ = config.__name__;
    compiled.__baseNames__ = baseNames;
    compiled.__bases__ = bases;
    compiled.$defaults = $defaults;
    compiled.$events = $events;
    compiled.$setters = $setters;

    function Component(config, callback) {
      var self = this;
      defaults(config, self.$defaults);
      defaults(self, config);
      self.template = config.template || self.template;
      if (self.__init__) self.__init__(config);
      if (callback) callback(self.el);
      if (self.__after__) self.__after__(config);
      if (self.dispatch) self.dispatch("onInitialized");
    }
    Component.prototype = compiled;

    return Component;
  }

  function echo(input) {
    return function () {
      return input;
    }
  }

  function bind(func, object) {
    return function () {
      return func.apply(object, arguments);
    };
  }

  function delay(func, obj, params, delay) {
    return window.setTimeout(function () {
      func.apply(obj, params);
    }, delay || 1);
  }

  function returnTrue() {
    return true;
  }

  function uid(name) {
    name = name || 0;
    $counters[name] = ($counters[name] || 0) + 1;
    return name + $counters[name];
  }

  function getConfig(obj) {
    return obj.config;
  }

  function addListener(element, event, handler, thisArg) {
    assertPropertyValidator(element, 'element', isDefined);
    assertPropertyValidator(handler, 'handler', isDefined);

    var id = uid();

    if (thisArg)
      handler = bind(handler, thisArg);

    $listeners[id] = [element, event, handler];	//store event info, for detaching

    // Not officially supporting, or going out of the way to support IE10-
    element.addEventListener(event, handler);

    return id;
  }

  function removeListener(id) {
    if (!id) return;
    var e = $listeners[id];
    if (e) {
      e[0].removeEventListener(e[1], e[2]);
      delete $listeners[id];
    }
  }

  exports.Dispatcher = {
    __name__: "Dispatcher",
    __init__: function (config) {
      this._listenersByEvent = {};
      this._listeners = {};

      var listeners = config.on;
      if (listeners) forInLoop(this.addListener, listeners, this);
    },
    dispatch: function (type, params) {
      /**
       * Dispatches an event to the element. This is the way user-interaction is handled.
       * @param type Name of the event.
       * @param params Array of the parameters to pass to the handler. Typically, this follows the order of the component configuration, the HTML element, and the event.
       * @example dispatch('onClick', [config, element, event])
       */
      var self = this;
      var handlers = self._listenersByEvent[type];
      if (handlers) {
        handlers.forEach(function (cb) {
          cb.apply(self, params);
        });
      }
    },
    addListener: function (type, func, id) {
      /**
       * Adds an event handler to the component.
       * @param type The type of event.
       * @param func The handling function.
       * @param id An optional event id that can be used to remove the listener.
       * @returns {number} The event id, automatically generated if id is not set.
       * @example addListener('onClick', function(config, element, event) {})
       */
      assertPropertyValidator(func, "listener for " + type, isFunction);

      id = id || uid();

      var handlers = this._listenersByEvent[type] || [];
      handlers.push(func);
      this._listenersByEvent[type] = handlers;
      this._listeners[id] = {_func: func, _name: type};

      return id;
    },
    removeListener: function (id) {
      /**
       * Removes a listener based on the event id.
       * @param id Listener id from adding the listener.
       * @example removeListener(listenerId)
       * @returns {boolean}
       */
      if (!this._listeners[id]) return;

      var name = this._listeners[id]._name;
      var func = this._listeners[id]._func;

      var handlers = this._listenersByEvent[name];

      handlers.remove(func);

      delete this._listeners[id];
    },
    hasListener: function (id) {
      /**
       * Checks if an particular event listener exists.
       * @param id Listener id from adding the listener.
       * @example hasListener(listenerId)
       * @returns {boolean}
       */
      return !!this._listeners[id];
    },
    hasListenersForEvent: function (type) {
      /**
       * Checks if there are any listeners to a particular event.
       * @param type Type of event.
       * @example hasListenersForEvent('onInitialized')
       * @returns {boolean}
       */
      var handlers = this._listenersByEvent[type];
      return handlers && handlers.length;
    }
  };

  assignClassToMethods(exports.Dispatcher, exports.Dispatcher.__name__);


  exports.Responder = {
    __name__: "Responder",
    __check__: function (bases) {
      assertBasesCheck('Dispatcher', 'Responder', bases);
    },
    $events: {},
    __after__: function (config) {
      var $this = this;
      var keyTest = /^key/;
      var on = config.on || {};
      $this.$listeners  = [];
      forIn(function (eventName, listenerConfig) {
        if (!listenerConfig.lazy || on[listenerConfig.dispatch]) {
          $this.$listeners.push(
            addListener($this.responder(), eventName, function (e) {
              var retVal;
              var config = getConfig($this);
              if (keyTest.test(e.type)) polyfillKeyboardEvent(e);
              if (isFunction(listenerConfig.callback)) {
                retVal = listenerConfig.callback.call($this, config, $this.el, e);
              }
              if (!listenerConfig.defaultEvent) preventEvent(e);
              $this.dispatch(listenerConfig.dispatch, [config, $this.el, e]);
              return retVal;
            })
          );
        }
      }, defaults(config.$events || {}, $this.$events));
    },
    responder: function () {
      /**
       * The responder to events.
       * This element will get bound to events such as blur/focus/change etc.
       * @returns {Element}
       */
      return this.el;
    }
  };

  assignClassToMethods(exports.Responder, exports.Responder.__name__);


  exports.selectors = {
    property: function (name) {
      var nested = name.split(".");
      return function (obj) {
        var result = obj;
        for (var i = 0; i < nested.length; i++)
          result = result[nested[i]]
        return result;
      }
    }
  };


  exports.classOptions = {
    flex: {
      true: "uk-flex",
      false: "",
      inline: "uk-flex-inline"
    },
    selectable: {
      true: "",
      false: "unselectable"
    },
    layout: prefixClassOptions({
      "": "",
      column: "",
      row: "",
      "row-reverse": "",
      "column-reverse": ""
    }, 'uk-flex-', true),
    spacing: prefixClassOptions({
      between: "",
      around: ""
    }, 'uk-flex-space-', true),
    order: prefixClassOptions({
      first: "",
      last: "",
      "first-small": "",
      "last-small": "",
      "first-medium": "",
      "last-medium": "",
      "first-large": "",
      "last-large": "",
      "first-xlarge": "",
      "last-xlarge": "",
      "": ""
    }, 'uk-flex-order-', true),
    wrap: prefixClassOptions({
      break: "",
      nowrap: "",
      truncate: "",
      "": ""
    }, 'uk-text-', true),
    padding: {
      "": "",
      none: "uk-padding-remove"
    },
    flexSize: prefixClassOptions({
      "": "",
      none: "none",
      auto: "auto",
      flex: "1"
    }, 'uk-flex-item-'),
    flexAlign: prefixClassOptions({
      center: "",
      right: "",
      top: "",
      middle: "",
      bottom: "",
      "": ""
    }, 'uk-flex-', true),
    card: prefixClassOptions({
      true: ["uk-card", "uk-card-box"],
      primary: ["uk-card", "uk-card-box", "uk-card-box-primary"],
      secondary: ["uk-card", "uk-card-box", "uk-card-box-secondary"],
      title: "",
      badge: "",
      teaser: "",
      header: "",
      body: "",
      space: "",
      divider: "",
      "": ""
    }, 'uk-card-', true, ["true", "primary", "secondary"]),
    badge: prefixClassOptions({
      true: "badge",
      notification: "badge-notification",
      success: ["badge", "badge-success"],
      warning: ["badge", "badge-warning"],
      danger: ["badge", "badge-danger"],
      "": ""
    }, 'uk-', true),
    display: prefixClassOptions({
      block: "",
      inline: "",
      "inline-block": "",
      "": ""
    }, 'uk-display-', true),
    halign: prefixClassOptions({
      center: "",
      left: "",
      right: "",
      "medium-left": "",
      "medium-right": "",
      "": ""
    }, 'uk-align-', true),
    valign: prefixClassOptions({
      middle: "align-middle",
      parent: "align",
      bottom: "align-bottom",
      "": ""
    }, 'uk-vertical-'),
    position: prefixClassOptions({
      "top": "",
      "top-left": "",
      "top-right": "",
      "bottom": "",
      "bottom-right": "",
      "bottom-left": "",
      "cover": "",
      "relative": "",
      "absolute": "",
      "z-index": "",
      "": ""
    }, 'uk-position-', true),
    responsive: prefixClassOptions({
      "width": "",
      "height": "",
      "": ""
    }, 'uk-responsive-', true),
    fill: prefixClassOptions({
      height: "height-1-1",
      width: "width-100",
      screen: ["height-1-1", "width-100"],
      "": ""
    }, 'uk-'),
    float: prefixClassOptions({
      left: "",
      right: "",
      clearfix: "uk-clearfix",
      "": ""
    }, 'uk-float-', true, ['clearfix']),
    scroll: prefixClassOptions({
      xy: "container",
      y: "ycontainer",
      x: "xcontainer",
      text: "uk-scrollable-text",
      "": ""
    }, 'uk-overflow-', false, ['text']),
    hidden: {
      true: HIDDEN_CLASS,
      false: "",
      hover: "uk-hidden-hover"
    },
    margin: prefixClassOptions({
      "": "",
      "x": "x",
      "x-mi": "mini-x",
      "x-sm": "small-x",
      "x-lg": "large-x",
      "y": "y",
      "y-mi": "mini-y",
      "y-sm": "small-y",
      "y-lg": "large-y",
      "top": "top",
      "top-lg": "large-top",
      "top-sm": "small-top",
      "top-mi": "mini-top",
      "bottom": "bottom",
      "bottom-lg": "large-bottom",
      "bottom-sm": "small-bottom",
      "bottom-mi": "mini-bottom",
      "left": "left",
      "left-lg": "large-left",
      "left-sm": "small-left",
      "left-mi": "mini-left",
      "right": "right",
      "right-lg": "large-right",
      "right-sm": "small-right",
      "right-mi": "mini-right"
    }, 'uk-margin-'),
    screen: prefixClassOptions({
      "small": "visible-small",
      "medium": "visible-medium",
      "large": "visible-large",
      "except-small": "hidden-small",
      "except-medium": "hidden-medium",
      "except-large": "hidden-large",
      "": ""
    }, 'uk-'),
    device: prefixClassOptions({
      touch: "notouch",
      notouch: "touch",
      "": ""
    }, 'uk-hidden-'),
    text: prefixClassOptions({
      small: "",
      large: "",
      bold: "",
      capitalize: "",
      lowercase: "",
      uppercase: "",
      "": ""
    }, 'uk-text-', true),
    textColor: prefixClassOptions({
      bold: "",
      muted: "",
      primary: "",
      success: "",
      warning: "",
      danger: "",
      contrast: "",
      "": ""
    }, 'uk-text-', true),
    textAlign: prefixClassOptions({
      middle: "",
      top: "",
      bottom: "",
      left: "",
      "left-small": "",
      right: "",
      "right-small": "",
      center: "",
      "center-small": "",
      justify: "",
      "": ""
    }, 'uk-text-', true),
    animation: prefixClassOptions({
      fade: "",
      "scale-up": "",
      "scale-down": "",
      "slide-top": "",
      "slide-bottom": "",
      "slide-left": "",
      "slide-right": "",
      shake: "",
      scale: "",
      reverse: "",
      "15": "",
      "top-left": "",
      "top-center": "",
      "top-right": "",
      "middle-left": "",
      "middle-right": "",
      "bottom-left": "",
      "bottom-center": "",
      "bottom-right": "",
      hover: "",
      "": ""
    }, 'uk-animation-', true)
  };

  function createElement(name, attributes, html) {
    attributes = attributes || {};
    var element = document.createElement(name);

    setAttributes(element, attributes);
    
    if (attributes.style)
      element.style.cssText = attributes.style;
    if (attributes.class)
      element.className = attributes["class"];
    if (html)
      element.innerHTML = html;
    return element;
  }

  function setAttributes(element, attributes) {
    forInLoop(element.setAttribute, attributes, element);
  }

  function preventEvent(e) {
    if (e && e.preventDefault) e.preventDefault();
    e.defaultPrevented = true;
    e.cancelBubble = true;
  }

  function addClass(node, name) {
    classString(name).split(' ').forEach(function (cls) {
      if (cls && node && node.classList) node.classList.add(cls);
    });
  }

  function hasClass(node, name) {
    return node && node.classList.contains(name);
  }

  function removeClass(node, name) {
    if (name && name.length > 0 && node && node.classList)
      node.classList.remove(name);
  }

  exports.ready = function (fn) {
    if (exports.$ready) fn.call();
    else $windowListeners.load.push(fn);
  };

  function buildWindowListener(listeners) {
    assertPropertyValidator(listeners, 'listeners', isArray);
    function executeAllListeners(e) {
      listeners.forEach(function (listener) {
        listener.call(window, e);
      });
    }
    return executeAllListeners;
  }

  $globalListenerIds.mouseup = addListener(window, "mouseup", buildWindowListener($windowListeners.mouseup));
  $globalListenerIds.mousemove = addListener(window, "mousemove", buildWindowListener($windowListeners.mousemove));
  $globalListenerIds.resize = addListener(window, "resize", buildWindowListener($windowListeners.resize));

  if (document.readyState == "complete") {
    windowOnLoad();
  } else {
    $globalListenerIds.load = addListener(window, "load", buildWindowListener($windowListeners.load));
  }

  if (UIkit.support.touch) {
    $globalListenerIds.touchend = addListener(window, "touchend", buildWindowListener($windowListeners.touchend));
    $globalListenerIds.touchmove = addListener(window, "touchmove", buildWindowListener($windowListeners.touchmove));
  }

  function windowOnMouseUp(e) {
    var dragged = exports.$dragged;
    if (dragged) {
      var nodeStyle = dragged.node.style;
      var display = nodeStyle.display;

      nodeStyle.display = 'none';

      var src = e.changedTouches ? e.changedTouches[0] : e;
      var dropTarget = findDroppableParent(document.elementFromPoint(src.clientX, src.clientY));
      if (dropTarget && dropTarget.master.config.droppable(dropTarget.config, dragged.config, dragged.node)) {
        // Must be before dragEnd to prevent position of elements shifting in tree
        // Shifted position will shift the drop target
        dropTarget.master.dispatch("onItemDrop", [dropTarget.config, dragged.config, dropTarget, e]);
      }

      dragged.target.dispatch("onItemDragEnd", [dragged.config, dragged.node, e]);

      removeClass(dragged.node, 'uk-active-drag');

      nodeStyle.top = dragged.originalPos.top;
      nodeStyle.left = dragged.originalPos.left;
      nodeStyle.display = display;
      exports.$dragged = null;
    }
    exports._selectedForDrag = null;
  }

  function windowOnMouseMove(e) {
    var selectedForDrag = exports._selectedForDrag;
    var src = e.touches ? e.touches[0] : e;
    if (selectedForDrag) {
      if (Math.abs(src.clientX - selectedForDrag.pos.x) > exports.$dragThreshold ||
        Math.abs(src.clientY - selectedForDrag.pos.y) > exports.$dragThreshold) {
        // Begin drag event
        exports.$dragged = selectedForDrag;
        exports._selectedForDrag = null;
        addClass(selectedForDrag.node, 'uk-active-drag');

        // Fire drag listener event
        selectedForDrag.target.dispatch("onItemDragStart",
          [selectedForDrag.config, selectedForDrag.node, selectedForDrag.event]);
      }
    }
    else if (exports.$dragged) {
      var dragged = exports.$dragged;
      dragged.node.style.top = (src.clientY + dragged.mouseOffset.top) + 'px';
      dragged.node.style.left = (src.clientX + dragged.mouseOffset.left) + 'px';

      var dropTarget = findDroppableParent(document.elementFromPoint(src.clientX, src.clientY));

      if (dropTarget && dropTarget.master.config.droppable(dropTarget.config, dragged.config, dragged.node)) {
        var oldDropTarget = exports._dropTarget;

        if (oldDropTarget != dropTarget) {
          if (oldDropTarget) {
            oldDropTarget.master.dispatch('onItemDragLeave', [oldDropTarget.config, oldDropTarget, e]);
          }
          dropTarget.master.dispatch('onItemDragEnter', [dropTarget.config, dropTarget, e]);
          exports._dropTarget = dropTarget;
        }
        else if (oldDropTarget) {
          oldDropTarget.master.dispatch('onItemDragOver', [oldDropTarget.config, oldDropTarget, e]);
        }
      }
    }
  }

  function windowOnLoad() {
    exports.$ready = true;
    setAttributes(document.body, {"data-uk-observe": ""});
  }

  function findDroppableParent(node) {
    // Exit after 100 tries, otherwise assume circular reference
    for (var i = 0; i < 100; i++) {
      if (!node)
        break;
      else if (node.config && node.master && node.$droppable)
        return node;
      else
        node = node.parentNode;
    }
  }


  exports.PropertySetter = {
    __name__: "PropertySetter",
    __check__: function (bases) {
      assertBasesCheck('PropertySetter', this.__name__, bases, true);
    },
    __init__: function (config) {
      this.config = config;
    },
    __after__: function (config) {
      if (this.$setters) {
        var names = Object.keys(config);
        for (var name, i = 0; i < names.length; i++) {
          name = names[i];
          this.set(name, config[name]);
        }
      }
    },
    set: function (name, value) {
      /**
       * Sets a property of the component and invokes its setter function.
       * @param name Name of the property.
       * @param value Value of the property.
       * @example set('type', 'primary')
       */
      var $setters = this.$setters;
      if ($setters.hasOwnProperty(name)) {
        assertPropertyValidator($setters[name], 'Property setter for ' + name, isFunction);
        $setters[name].call(this, value);
      }
      this.config[name] = value;
    }
  };

  assignClassToMethods(exports.PropertySetter, exports.PropertySetter.__name__);


  exports.AbsolutePositionMethods = {
    __name__: "AbsolutePositionMethods",
    positionNextTo: function (node, position, marginX, marginY) {
      /**
       * Positions this element next to another element.
       * @param node The anchor element to position next to.
       * @param position Can be 1 of the following values: bottom-right, bottom-left, bottom-center, top-right, top-left, top-center, left-top, left-bottom, left-center, right-top, right-bottom, right-center.
       * @param marginX The amount of x-offset from the anchor element edge.
       * @param marginY The amount of y-offset from the anchor element edge.
       */
      var parent = this.el.parentNode ? this.el.parentNode : document.body;
      var parentPos = parent.getBoundingClientRect(); // Affected by scrolling
      var origin = node.getBoundingClientRect();
      var rect = this.getBoundingClientRect();
      var width = rect.width,
        height = rect.height;

      marginX = marginX || 0;
      marginY = marginY || 0;

      var variants = {
        "bottom-left": pos(origin.height + marginY, marginX),
        "bottom-right": pos(origin.height + marginY, origin.width - width + marginX),
        "bottom-center": pos(origin.height + marginY, origin.width / 2 - width / 2 + marginX),
        "top-left": pos(-marginY - height, marginX),
        "top-right": pos(-marginY - height, origin.width - width + marginX),
        "top-center": pos(-marginY - height, origin.width / 2 - width / 2 + marginX),
        "left-top": pos(marginY, -marginX - width),
        "left-bottom": pos(origin.height - height, -marginX - width),
        "left-center": pos(origin.height / 2 - height / 2, -marginX - width),
        "right-top": pos(marginY, origin.width + marginX),
        "right-bottom": pos(origin.height - height, origin.width + marginX),
        "right-center": pos(origin.height / 2 - height / 2, origin.width + marginX)
      };

      this.position(
        origin.top - parentPos.top + variants[position].top,
        origin.left + variants[position].left - parentPos.left);

      function pos(top, left) {
        return {top: top, left: left};
      }
    },
    getBoundingClientRect: function () {
      /**
       * Gets the bounding rectangle of the element. Needs to be added first since this delegates the call to element.getBoundingClientRect.
       * @returns {any | ClientRect}
       */
      return this.el.getBoundingClientRect();
    },
    position: function (top, left) {
      /**
       * Sets the position of the element.
       * @param top Top position in pixels.
       * @param left Left position in pixels.
       * @example position(10, 10)
       */
      var style = this.el.style;
      style.top = (top || 0) + "px";
      style.left = (left || 0) + "px";
      style.position = "absolute";
    },

    moveWithinBoundary: function (boundary, pivot, padding, offset) {
      /**
       * Moves the element to be within the specified boundary.
       * @param boundary The bounding box to move the element inside of.
       * @param pivot Use this to override the final boundary edges values.
       * @param padding The amount of padding to the edges of the boundary.
       * @param offset The amount of final offset added to the position depending on which edges are hidden.
       * @example moveWithinBoundary({top: 0, bottom: 500, left: 0, right: 1000}, {top: 100, bottom: 100}, {top: 10, left: 10}, {top: 10, left: 20, right: 30, bottom: 40})
       */
      var parent = this.el.parentNode ? this.el.parentNode : document.body;
      var parentPos = parent.getBoundingClientRect(); // Affected by scrolling

      padding = padding || {};
      pivot = pivot || {};
      boundary = boundary || {};
      offset = offset || {};

      var paddingTop = padding.top || 0;
      var paddingRight = padding.right || 0;
      var paddingBottom = padding.bottom || 0;
      var paddingLeft = padding.left || 0;

      var boundaryTop = boundary.top || 0;
      var boundaryBottom = boundary.bottom || window.innerHeight;
      var boundaryLeft = boundary.left || 0;
      var boundaryRight = boundary.right || window.innerWidth;

      var pivotLeft = pivot.left || boundaryLeft + paddingLeft;
      var pivotRight = pivot.right || boundaryRight - paddingRight;
      var pivotTop = pivot.top || boundaryTop + paddingTop;
      var pivotBottom = pivot.bottom || boundaryBottom - paddingBottom;

      var rect = this.getBoundingClientRect();
      var htmlStyle = this.el.style;

      rect.left = htmlStyle.left || rect.left;
      rect.top = htmlStyle.top || rect.top;

      var hiddenLeft = rect.left < boundaryLeft + paddingLeft;
      var hiddenRight = rect.left + rect.width > boundaryRight - paddingRight;
      var hiddenTop = rect.top < boundaryTop + paddingTop;
      var hiddenBottom = rect.top + rect.height > boundaryBottom - paddingBottom;

      var offsetTop = offset.top || 0;
      var offsetBottom = offset.bottom || 0;
      var offsetLeft = offset.left || 0;
      var offsetRight = offset.right || 0;

      if (hiddenLeft) {
        htmlStyle.left = (pivotLeft + offsetLeft - parentPos.left) + "px";
      }
      else if (hiddenRight) {
        htmlStyle.left = (pivotRight - rect.width + offsetRight - parentPos.left) + "px";
      }

      if (hiddenTop) {
        htmlStyle.top = (pivotTop + offsetTop - parentPos.top) + "px";
      }
      else if (hiddenBottom) {
        htmlStyle.top = (pivotBottom - rect.height + offsetBottom - parentPos.top) + "px";
      }
    }
  };

  assignClassToMethods(exports.AbsolutePositionMethods, exports.AbsolutePositionMethods.__name__);


  exports.new = function (config, callback) {
    if (callback && !isFunction(callback)) callback = callback.appendChild.bind(callback);
    return makeView(config, callback);

    function makeView(config, callback) {
      var view;
      if (config.view) view = config.view;
      else if (config.cells) view = 'flexgrid';
      else view = 'element';
      assertPropertyValidator($definitions[view], 'definition ' + view, isDefined);
      return new $definitions[view](config, callback);
    }
  };

  function $$(id) {
    if (!id)
      return null;
    else if ($components[id])
      return $components[id];
  }

  function forInLoop(func, obj, thisArg) {
    for (var i in obj) {
      if (obj.hasOwnProperty(i)) {
        if (func.call(thisArg, i, obj[i]) === false) {
          break;
        }
      }
    }
  }

  function forIn(func, obj, thisArg) {
    var result = {};
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = func.call(thisArg, key, obj[key]);
      }
    }
    return result;
  }

  function forEachUntil(predicate, array, thisArg) {
    var copy = array.slice();
    var value, i = 0;
    while (copy.length) {
      value = copy.shift();
      if (!predicate.call(thisArg, value, copy)) {
        copy.push(value);
        i++;
      }
      else {
        i = 0;
      }
      if (copy.length == 0) {
        break;
      }
      else if (i > copy.length) {
        fail("Infinite loop detected.");
        break;  // Infinite loop detected.
      }
    }
  }

  function removeFromArray(array, value) {
    var index = array.indexOf(value);
    if (index !== -1) array.splice(index, 1);
  }

  function prefixClassOptions(obj, prefix, mirrorKey, exclude) {
    prefix = prefix || '';

    return forIn(function (key, value) {
      if (isArray(exclude) && exclude.indexOf(key) != -1) {
        return value;
      }
      else if (isArray(value)) {
        return value.map(function (string) {
          return !string.length ? string : prefix + string;
        });
      }
      else {
        value = mirrorKey ? key : value;
        return !value.length ? value : prefix + value;
      }
    }, obj);
  }

  function classSetters(classOptions) {
    return forIn(function (property, options) {
      var setter = function (value) {
        var self = this;
        var oldValue = self.config[property];
        if (options[oldValue])
          removeClass(self.el, options[oldValue]);

        var values = classString(value).split(" ");

        for (var v, i = 0; i < values.length; i++) {
          v = values[i];

          assertPropertyValidator(options[v], 'value ' + v + ' for property ' + property, isDefined);

          var classes = options[v];

          if (isArray(classes))
            for (var c = 0; c < classes.length; c++)
              addClass(self.el, classes[c]);
          else
            addClass(self.el, classes);
        }
      };
      setter.options = options;
      return setter;
    }, classOptions);
  }


  exports.CommonCSS = {
    __name__: "CommonCSS",
    __check__: function (bases) {
      assertBasesCheck('CommonCSS', 'CommonCSS', bases);
      assertBasesCheck('PropertySetter', 'CommonCSS', bases);
    },
    $setters: classSetters(exports.classOptions)
  };

  assignClassToMethods(exports.CommonCSS.$setters, exports.CommonCSS.__name__);


  exports.CommonEvents = {
    __name__: "CommonEvents",
    __check__: function (bases) {
      assertBasesCheck('Responder', 'CommonEvents', bases);
    },
    $events: {
      focus: {lazy: true, dispatch: "onFocus", defaultEvent: true},
      blur: {lazy: true, dispatch: "onBlur", defaultEvent: true}
    },
    __after__: function (config) {
      var $this = this;
      if (config.on) {
        if (config.on.onResize) {
          $windowListeners.resize.push(function (e) {
            $this.dispatch("onResize", [e]);
          });
        }
        if (config.on.onDebounceResize) {
          $windowListeners.resize.push(UIkit.Utils.debounce(function (e) {
            $this.dispatch("onDebounceResize", [e]);
          }, 1000));
        }
      }
    }
  };


  $definitions.element = def({
    __name__: "element",
    $defaults: {
      tooltipPos: "bottom",
      dropdownEvent: "onClick",
      dropdownOptions: {
        pos: "bottom-center",
        marginX: 0,
        marginY: 8
      }
    },
    $setters: {
      disabled: function (value) {
        if (value)
          this.disable();
        else
          this.enable();
      },
      css: function (value) {
        addClass(this.el, classString(value));
      },
      tooltip: function (value) {
        var self = this;

        if (value)
          setAttributes(self.el, {
            "title": value,
            "data-uk-tooltip": interpolate("{pos: '{{pos}}'}", {pos: self.config.tooltipPos})
          });
        else
          removeClass(self.el, "data-uk-tooltip");
      },
      dropdown: function (value) {
        var self = this;
        var config = self.config;

        var dropdownOptions = config.dropdownOptions;
        var dropdown = extend({
          view: "dropdown",
          dropdown: value
        }, dropdownOptions);

        var ui = exports.new(dropdown, document.body);

        config.on = config.on || {};
        self.addListener(config.dropdownEvent, function (config, node) {
          var relativeNode = $$(dropdownOptions.relativeTo);
          relativeNode = relativeNode ? relativeNode.el : node;
          var bb = {left: 0, right: window.innerWidth, top: 0, bottom: window.innerHeight};
          ui.open(config);
          ui.positionNextTo(relativeNode, dropdown.pos, dropdownOptions.marginX, dropdownOptions.marginY);
          ui.moveWithinBoundary(bb);
        });
        self.dropdownPopup = ui;
      },
      uploader: function (value) {
        if (value) {
          // Must allow default events to open uploader
          var $this = this;
          addClass($this.el, "uk-form-file");
          var uploader = $this._uploader = createElement('INPUT', {type: 'file', multiple: value == 'multiple' ? value : null});
          uploader.onchange = function (e) {
            $this.dispatch('onFileChange', [$this.config, this, e])
          };
          $this.el.appendChild(uploader);
        }
      }
    },
    __init__: function (config) {
      var self = this;
      if (!config.id) config.id = uid(self.__name__);
      var element = document.getElementById(config.id);

      assertPropertyValidator(element, 'node ' + config.id + ' exist check', isFalsy);

      $components[config.id] = self;

      self.$components = [];
      self.element = self.el = createElement(config.htmlTag || "DIV", {id: config.id});

      if (isString(config.tagClass))
        setAttributes(self.el, {class: config.tagClass});

      extend(self.el.style, config.style || {});

      self.render();
    },
    dispose: function () {
      var self = this;
      self.dispatch("onDispose");
      self.$components.forEach(function (component) {
        component.dispose();
      });
      delete $components[getConfig(self).id];
      self.$listeners.forEach(removeListener);
    },
    render: function () {
      /**
       * Force a rerender of the element, which runs the template function.
       */
      var self = this;
      template(self.template, self.config, self, self.el);
    },
    template: function () {
      /**
       * The template function of the final HTML.
       * @param config The configuration JSON.
       * @param component The created component object with functions.
       * @param parent The parent HTML element.
       * @returns {string}
       */
      return ""
    },
    isVisible: function () {
      /**
       * Checks if the element is hidden. (Not to be confused with conceal/reveal.)
       */
      return !hasClass(this.el, HIDDEN_CLASS);
    },
    show: function () {
      /**
       * Shows the element.
       */
      removeClass(this.el, HIDDEN_CLASS);
    },
    hide: function () {
      /**
       * Hides the element.
       */
      addClass(this.el, HIDDEN_CLASS);
    },
    conceal: function () {
      /**
       * Makes the element invisible, which doesn't affect the layout.
       */
      addClass(this.el, "uk-invisible");
    },
    reveal: function () {
      /**
       * Makes the element visible again.
       */
      removeClass(this.el, "uk-invisible");
    },
    isEnabled: function () {
      /**
       * Checks if the element is enabled.
       * @returns {boolean}
       */
      return !this.el.getAttribute('disabled');
    },
    disable: function () {
      /**
       * Disables the element.
       */
      setAttributes(this.el, {disabled: ""});
    },
    enable: function () {
      /**
       * Enables the element.
       */
      this.el.removeAttribute('disabled');
    },
    getComponent: function (key, value) {
      /**
       * Gets a child component from a key value match.
       * @param key The key to look up.
       * @param value The compared value.
       * @returns {Component}
       */
      return this.$components.filter(function (item) {
        return item[key] === value;
      })[0];
    }
  }, exports.Dispatcher, exports.Responder, exports.CommonEvents, exports.CommonCSS, exports.PropertySetter);

  
  $definitions.flexgrid = def({
    __name__: "flexgrid",
    $defaults: {
      layout: "row",
      flex: true,
      flexSize: "flex",
      singleView: false
    },
    $setters: {
      cells: function (value) {
        assertPropertyValidator(value, 'cells', isArray);

        var self = this;

        for (var config, i = 0; i < value.length; i++) {
          config = value[i];
          self.addChild(config);
        }

        if (self.config.singleView && self.config.defaultView)
          self.setChild(self.config.defaultView);
      }
    },
    render: function () {
      // Do nothing, overwrites render function.
    },
    each: function (func, thisArg) {
      /**
       * Invokes a function on each child of the flexgrid.
       * @param func The invoked function.
       * @param thisArg The 'this' object passed to the invoked function.
       * @returns Return an array containing the results of the invoked call.
       */
      return this.$components.map(func, thisArg);
    },
    insertChild: function (index, config) {
      /**
       * Inserts a child configuration object at a particular index.
       * @param index Index to insert at.
       * @param config The configuration object representing the new child.
       * @returns {Component} The child component
       */
      var self = this;
      var ui;

      if (config.el) {
        ui = config;
        appendChild(ui.el);
      } else {
        ui = exports.new(config, appendChild);
      }

      self.$components.splice(index, 0, ui);

      return ui;

      function appendChild(element) {
        if (!self.config.singleView) {
          if (index > 0)
            self.el.insertAfter(element, self.$components[index - 1].el);
          else if (index + 1 < self.$components.length)
            self.el.insertBefore(element, self.$components[index + 1].el);
          else
            self.el.appendChild(element)
        }
      }
    },
    addChild: function (config) {
      /**
       * Adds a child to the end of the stack.
       * @param config Configuration of the new child.
       * @returns {Component} The child component
       */
      var self = this;
      var component = config.element ? config : exports.new(config, function (el) {
        if (!self.config.singleView) self.el.appendChild(el);
      });
      self.$components.push(component);
      return component;
    },
    removeChild: function (id) {
      /**
       * Removes a child by its id.
       * @param id Id of the child to remove.
       */
      var self = this;
      var components = self.$components;
      var target;

      if (id.el) {
        target = id;
      } else if (isString(id)) {
        target = self.getChild(id);
      } else {
        fail("flexgrid: unknown argument id " + id + " received in removeChild().");
      }

      self.el.removeChild(target.el);
      removeFromArray(components, target);
    },
    getChild: function (id) {
      /**
       * Get a child of the flexgrid by id.
       * @param id The string id of the component.
       * @returns {Component}
       */
      return this.getComponent('id', id);
    },
    getChildren: function () {
      /**
       * Get a list of all children. Make a copy if mutating this object.
       * @returns {Component[]} Array of child components.
       */
      return this.$components;
    },
    getItems: function () {
      /**
       * Get a list of the children's JSON configuration objects. Do not need to make a copy if mutating.
       * @returns {any[]} Array of child components config objects.
       */
      return this.$components.map(function (item) {
        return item.config;
      });
    },
    activeChild: function () {
      /**
       * Returns the current active child.
       */
      return this._activeChild;
    },

    setChild: function (id) {
      /**
       * Makes a child visible, also makes it the active child.
       * @dispatch onChildChange
       * @param id The id of a child.
       */
      var self = this;
      self._setVisible('id', [id]);
      var newChild = self.getChild(id);
      self.dispatch("onChildChange", [self._activeChild, newChild]);
      self._activeChild = newChild;
    },
    getBatch: function () {
      /**
       * Get the 'batch' value that was passed to `setBatch`.
       */
      return this.$batch;
    },
    showBatch: function (name) {
      /**
       * Checks the batch property of all children and makes all matching batch visible.
       * @param name An array or a string to identify batch(es). Matching is done using indexOf.
       */
      // Tricky: Rendering input fields will cause problems with on-screen keyboards.
      // However, to preserve the order of elements, will need to rerender.
      this._setVisible('batch', isArray(name) ? name : [name], true);
      this.$batch = name;
    },
    _setVisible: function (key, value, rerender) {
      var self = this;
      var el = self.el;
      self.$components.forEach(function (item) {
        if (value.indexOf(item.config[key]) != -1) {
          if (item.el.parentNode != el || rerender) {
            el.appendChild(item.el);
          }
        }
        else if (item.el.parentNode) {
          el.removeChild(item.el);
        }
      });
    }
  }, $definitions.element);


  exports.FormControl = {
    __name__: 'FormControl',
    $defaults: {
      formDangerClass: "uk-form-danger",
      formSuccessClass: "uk-form-success",
      helpDangerClass: "uk-text-danger",
      helpSuccessClass: "uk-text-success",
      helpTag: "P",
      helpTagClass: "uk-form-help-block",
      helpTagClassInline: "uk-form-help-inline"
    },
    $setters: extend(
      classSetters({
        size: prefixClassOptions({
          large: "",
          small: "",
          "": ""
        }, 'uk-form-', true)
      }),
      {
        formClass: function (value) {
          this.setFormClass(value);
        },
        help: function (value) {
          var self = this;
          if (self.help && self.help.parentNode) {
            self.help.parentNode.removeChild(self.help);
          }
          if (value) {
            self.help = createElement(this.helpTag, {class: (self.config.inline ?
              this.helpTagClassInline : this.helpTagClass)});
            self.help.innerHTML = value;
            self.getFormControl().parentNode.appendChild(self.help);
          }
        },
        multiple: function (value) {
          setAttributes(this.getFormControl(), isString(value) ? {multiple: value} : {});
        },
        type: function (value) {
          setAttributes(this.getFormControl(), {type: value});
        },
        value: function (value) {
          if (isDefined(value))
            this.setValue(value);
        }
      }
    ),
    responder: function () {
      /**
       * The responder to events.
       * This element will get bound to events such as blur/focus/change etc.
       * @returns {Element}
       */
      return this.getFormControl();
    },
    getFormControl: function () {
      /**
       * Get the HTML element.
       * @returns {Element}
       */
      return this.el;
    },
    clearFormClass: function () {
      /**
       * Clear any of display class applied to the form control.
       */
      var formControl = this.getFormControl();
      removeClass(formControl, this.formDangerClass);
      removeClass(formControl, this.formSuccessClass);

      var helpControl = this.help;
      if (helpControl) {
        removeClass(helpControl, this.helpDangerClass);
        removeClass(helpControl, this.helpSuccessClass);
      }
    },
    setFormClass: function (value) {
      /**
       * Set the display class for the form control.
       * @param value One of ['success', 'danger']
       */
      var formControl = this.getFormControl();
      var helpControl = this.help;

      this.clearFormClass();

      if (value == 'success') {
        addClass(formControl, this.formSuccessClass);
        if (helpControl) addClass(helpControl, this.helpSuccessClass);
      }
      else if (value == 'danger') {
        addClass(formControl, this.formDangerClass);
        if (helpControl) addClass(helpControl, this.helpDangerClass);
      }
    },
    reset: function () {
      /**
       * Clear the form control.
       */
      this.getFormControl().value = "";
    },
    enable: function () {
      /**
       * Enable the form control.
       */
      this.getFormControl().removeAttribute('disabled');
    },
    disable: function () {
      /**
       * Disable the form control.
       */
      setAttributes(this.getFormControl(), {disabled: 'disabled'});
    },
    getValue: function () {
      /**
       * Get the value of the form control.
       * @returns {any}
       */
      return this.getFormControl().value;
    },
    setValue: function (value) {
      /**
       * Set the value of the form control.
       * @param value
       */
      this.getFormControl().value = value;
    }
  };

  assignClassToMethods(exports.FormControl.$setters, exports.FormControl.__name__);
  assignClassToMethods(exports.FormControl, exports.FormControl.__name__);


  exports.ClickEvents = {
    __name__: 'ClickEvents',
    $events: {
      click: {dispatch: "onClick", defaultEvent: true},
      contextmenu: {lazy: true, dispatch: "onContext"},
      mousedown: {lazy: true, dispatch: "onMouseDown"},
      mouseup: {lazy: true, dispatch: "onMouseUp", callback: function (config, el, e) {
        windowOnMouseUp(e);
      }}
    },
    $setters: {
      target: function (value) {
        setAttributes(this.el, {target: value});
      },
      href: function (value) {
        setAttributes(this.el, {href: value});
      }
    },
    __check__: function (bases) {
      assertBasesCheck('Responder', 'ClickEvents', bases);
    }
  };

  assignClassToMethods(exports.ClickEvents.$setters, exports.ClickEvents.__name__);


  $definitions.modal = def({
    __name__: "modal",
    $defaults: {
      tagClass: "uk-modal",
      light: false,
      closeButton: true,
      bgClose: true,
      keyboard: true,
      minScrollHeight: 150,
      closeModals: false,
      center: true,
      flex: false,
      flexSize: "",
      layout: "",
      dialogClass: "",
      headerClass: "",
      footerClass: ""
    },
    __init__: function (config) {
      var self = this;
      self.header = self._header = createElement("DIV", {class: "uk-modal-header"});
      self.footer = self._footer = createElement("DIV", {class: "uk-modal-footer"});
      self.body = self._body = createElement("DIV", {class: "uk-modal-dialog"});

      if (config.headerClass) addClass(self._header, config.headerClass);
      if (config.dialogClass) addClass(self._body, config.dialogClass);
      if (config.footerClass) addClass(self._footer, config.footerClass);

      self.el.appendChild(self._body);
      if (config.header) self._body.appendChild(self._header);
      if (config.footer) self._body.appendChild(self._footer);
    },
    $setters: {
      light: function (value) {
        if (value)
          addClass(this.el, "uk-modal-dialog-lightbox");
      },
      bodyWidth: function (value) {
        value = isNumber(value) ? value + "px" : value;
        this._body.style.width = value;
      },
      bodyHeight: function (value) {
        value = isNumber(value) ? value + "px" : value;
        this._body.style.height = value;
      },
      closeButton: function (value) {
        if (value) {
          var self = this;
          self._close = createElement("A",
            {class: "uk-modal-close uk-close"});
          if (self._body.firstChild) {
            self._body.insertBefore(self._close, self._body.firstChild);
          }
          else {
            self._body.appendChild(self._close);
          }
        }
      },
      body: function (value) {
        var self = this;
        self.bodyContent = exports.new(value, function (el) {
          if (self._footer.parentNode) {
            self._body.insertBefore(el, self._footer);
          } else {
            self._body.appendChild(el);
          }
        });
        self.$components.push(self.bodyContent);
      },
      header: function (value) {
        var self = this;
        self.headerContent = exports.new(value, self._header);
        self.$components.push(self.headerContent);
      },
      footer: function (value) {
        var self = this;
        self.footerContent = exports.new(value, self._footer);
        self.$components.push(self.footerContent);
      },
      caption: function (value) {
        var self = this;
        if (!self._caption)
          self._caption = createElement("DIV", {class: "uk-modal-caption"});
        self._caption.innerHTML = value;
        self._body.appendChild(self._caption);
      }
    },
    open: function (args) {
      /**
       * Opens the modal.
       * @dispatch onOpen, onOpened
       * @param args Parameter to pass into the dispatch handlers. (3rd argument of the callback.)
       */
      var self = this;
      var config = self.config;
      self.dispatch("onOpen", [config, self.el, args]);
      UIkit.modal('#' + config.id, {
        center: config.center,
        bgclose: config.bgClose,
        keyboard: config.keyboard,
        modal: config.closeModals,
        minScrollHeight: config.minScrollHeight
      }).show();
      self.dispatch("onOpened", [config, self.el, args]);
    },
    close: function (args) {
      /**
       * Closes the modal.
       * @dispatch onClose, onClosed
       * @param args Parameter to pass into the dispatch handlers. (3rd argument of the callback.)
       */
      var self = this;
      self.dispatch("onClose", [self.config, self.el, args]);
      UIkit.modal('#' + self.config.id).hide();
      self.dispatch("onClosed", [self.config, self.el, args]);
    }
  }, $definitions.flexgrid);


  $definitions.button = def({
    __name__: "button",
    $defaults: {
      label: "",
      htmlTag: "BUTTON",
      tagClass: "uk-button",
      iconClass: "",
      selectable: false
    },
    $setters: classSetters({
      link: prefixClassOptions({
        true: "uk-button-link",
        "": ""
      }),
      color: prefixClassOptions({
        primary: "",
        success: "",
        danger: "",
        "": ""
      }, 'uk-button-', true),
      size: prefixClassOptions({
        mini: "",
        small: "",
        large: "",
        "": ""
      }, 'uk-button-', true)
    }),
    template: function (config) {
      if (config.type == "icon")
        return "<i class='{{icon}} {{iconClass}}'></i><span>{{label}}</span>";
      else if (config.label)
        return "<span>{{label}}</span>";
      else
        return "";
    },
    select: function () {
      /**
       * Change the button state to selected.
       */
      getConfig(this).$selected = true;
      addClass(this.el, ACTIVE_CLASS);
    },
    isSelected: function () {
      /**
       * Returns if the button is in the selected state.
       * @returns {boolean}
       */
      return !!getConfig(this).$selected;
    },
    deselect: function () {
      /**
       * Change the button state to deselected.
       */
      getConfig(this).$selected = false;
      removeClass(this.el, ACTIVE_CLASS);
    },
    getLabel: function () {
      /**
       * Gets the label value of the button.
       * @returns {string}
       */
      return getConfig(this).label;
    },
    setLabel: function (value) {
      /**
       * Sets the label (HTML accepted) of the button component.
       * @param value
       */
      getConfig(this).label = value;
      this.render();
    }
  }, $definitions.element, exports.ClickEvents);


  $definitions.icon = def({
    __name__: "icon",
    $defaults: {
      htmlTag: "A",
      iconStyle: "hover",
      selectable: false,
      content: ""
    },
    $setters: classSetters({
      iconStyle: prefixClassOptions({
        hover: "",
        small: "",
        medium: "",
        large: "",
        button: "",
        justify: "",
        "": ""
      }, 'uk-icon-', true)
    }),
    template: "<i class='{{icon}}'>{{content}}</i>"
  }, $definitions.element, exports.ClickEvents);


  $definitions.label = def({
    __name__: "label",
    $defaults: {
      label: "",
      htmlTag: "SPAN",
      selectable: false
    },
    $setters: classSetters({
      labelStyle: {
        form: "uk-form-label",
        "": ""
      }
    }),
    template: function (config) {
      return config.label;
    },
    getValue: function () {
      /**
       * Gets the text value of the label.
       * @returns {string}
       */
      return getConfig(this).label;
    },
    setValue: function (value) {
      /**
       * Sets the value (HTML accepted) of the label component.
       * @param value
       */
      getConfig(this).label = value;
      this.render();
    }
  }, $definitions.element);


  $definitions.link = def({
    __name__: "link",
    $defaults: {
      label: "",
      htmlTag: "A"
    },
    template: function (config) {
      return config.label;
    }
  }, $definitions.element, exports.ClickEvents);


  $definitions.progress = def({
    __name__: "progress",
    $defaults: {
      htmlTag: "DIV",
      tagClass: "uk-progress",
      fill: "width"
    },
    $setters: classSetters({
      size: prefixClassOptions({
        mini: "",
        small: "",
        "": ""
      }, 'uk-progress-', true),
      color: prefixClassOptions({
        danger: "",
        warning: "",
        success: "",
        striped: "",
        "": ""
      }, 'uk-progress-', true)
    }),
    render: function () {
    },
    __init__: function () {
      this._bar = createElement("DIV", {class: "uk-progress-bar"});
      this.el.appendChild(this._bar);
    },
    getValue: function () {
      /**
       * Gets the value of the progress component.
       * @returns {number}
       */
      return this._progress;
    },
    setValue: function (value) {
      /**
       * Sets the value of the progress component.
       * @param value A percentage value from 0-100.
       */
      assertPropertyValidator(value, 'value', isNumber);

      var self = this;
      self._bar.style.width = value + '%';
      self._progress = value;
    }
  }, $definitions.element);


  $definitions.image = def({
    __name__: "image",
    $defaults: {
      htmlTag: "IMG"
    },
    $events: {
      load: {lazy: true, dispatch: "onLoad"}
    },
    $setters: {
      src: function (value) {
        setAttributes(this.el, {src: value});
      }
    }
  }, $definitions.element, exports.ClickEvents);


  exports.ChangeEvent = {
    __name__: 'ChangeEvent',
    __check__: function (bases) {
      assertBasesCheck('Responder', 'ChangeEvent', bases);
    },
    $events: {
      change: {lazy: true, dispatch: "onChange", defaultEvent: true}
    }
  };

  exports.InputControl = {
    __name__: 'InputControl',
    __check__: function (bases) {
      assertBasesCheck('Responder', 'InputControl', bases);
      assertBasesCheck('FormControl', 'InputControl', bases);
    },
    $events: {
      input: {lazy: true, dispatch: 'onInput', defaultEvent: true},
      keyup: {lazy: true, dispatch: 'onKeyUp', defaultEvent: true}
    },
    $setters: {
      autocomplete: function (value) {
        setAttributes(this.getFormControl(), {autocomplete: value});
      },
      autocapitalize: function (value) {
        setAttributes(this.getFormControl(), {autocapitalize: value});
      },
      autocorrect: function (value) {
        setAttributes(this.getFormControl(), {autocorrect: value});
      },
      placeholder: function (value) {
        setAttributes(this.getFormControl(), {placeholder: value});
      }
    }
  };

  assignClassToMethods(exports.InputControl.$setters, exports.InputControl.__name__);


  $definitions.toggle = def({
    __name__: "toggle",
    $setters: extend(
      classSetters({
        color: prefixClassOptions({
          "success": "",
          "danger": "",
          "warning": "",
          "": ""
        }, 'uk-toggle-', true)
      }),
      {
        checked: function (value) {
          this.getFormControl().checked = value;
        }
      }
    ),
    $defaults: {
      htmlTag: "LABEL",
      tagClass: "uk-toggle",
      type: 'checkbox'
    },
    template: '<input><div class="uk-toggle-slider"></div>',
    getFormControl: function () {
      /**
       * Get the HTML input element.
       * @returns {Element}
       */
      return this.el.firstChild;
    },
    reset: function () {
      /**
       * Reset the toggle.
       */
      this.getFormControl().checked = false;
    },
    getValue: function () {
      /**
       * Get the value of the toggle.
       * @returns {boolean}
       */
      return this.getFormControl().checked;
    },
    setValue: function (value) {
      /**
       * Set the value of the toggle.
       * @param value
       */
      this.getFormControl().checked = value;
    }
  }, exports.ChangeEvent, exports.FormControl, $definitions.element);


  $definitions.input = def({
    __name__: "input",
    $defaults: {
      htmlTag: "INPUT",
      inputWidth: "medium"
    },
    $setters: extend(
      classSetters({
        width: prefixClassOptions({
          "": "",
          mini: "",
          small: "",
          medium: "",
          large: "",
          full: "uk-width-100"
        }, 'uk-form-width-', true, ['full']),
        size: prefixClassOptions({
          "": "",
          small: "",
          large: ""
        }, 'uk-form-', true)
      }),
      {
      checked: function (value) {
        this.getFormControl().checked = value;
      },
      readonly: function (value) {
        setAttributes(this.getFormControl(), {readonly: value});
      }
    }),
    reset: function () {
      /**
       * Clear the HTML input element.
       */
      var self = this;
      var formControl = self.getFormControl();
      switch (self.config.type) {
        case "checkbox":
          formControl.checked = self.config.checked;
          break;
        case "number":
          formControl.value = 0;
          break;
        default:
          formControl.value = "";
          break;
      }
    },
    getValue: function () {
      /**
       * Get the value of the HTML input element.
       * @returns {string | boolean}
       */
      var self = this;
      if (self.config.type == "checkbox")
        return self.getFormControl().checked;
      else
        return self.getFormControl().value;
    },
    setValue: function (value) {
      /**
       * Set the value of the HTML input element.
       * @param value
       */
      var self = this;
      if (self.config.type == "checkbox")
        self.getFormControl().checked = value;
      else
        self.getFormControl().value = value;
    }
  }, exports.InputControl, exports.ChangeEvent, exports.FormControl, $definitions.element);


  $definitions.autocomplete = def({
    __name__: "autocomplete",
    template: '<input style="width:100%">',
    $defaults: {
      htmlTag: "DIV",
      tagClass: "uk-autocomplete",
      placeholder: "",
      type: "text",
      minLength: 0,
      caseSensitive: false,
      sources: [],
      autocomplete: function (release) {
        var self = this;
        var searchValue = self.getValue();
        var config = self.config;
        if (!config.caseSensitive) searchValue = searchValue.toLowerCase();

        release(self._getSource().filter(function (item) {
          var value = config.caseSensitive ? item.value : item.value.toLowerCase();
          return value.indexOf(searchValue) != -1;
        }));
      }
    },
    $setters: {
      sources: function (value) {
        if (isFunction(value))
          this._getSource = value;
        else
          this._getSource = echo(value);
      },
      autocomplete: function (value) {
        var self = this;
        var autocomplete = self._autocomplete = UIkit.autocomplete(self.el,
          {source: bind(value, self), minLength: self.config.minLength});
        self.el.style.wordBreak = "break-word";
        autocomplete.dropdown.attr("style", "width:100%");
        autocomplete.dropdown.addClass('uk-dropdown-small');
        autocomplete.on("selectitem.uk.autocomplete", function (e, obj) {
          self.dispatch("onChange", [obj.value]);
          self.dispatch("onAutocomplete", [obj]);
        });
      }
    },
    getFormControl: function () {
      /**
       * Gets the HTML input element.
       * @returns {Element}
       */
      return this.el.firstChild;
    }
  }, $definitions.input);


  $definitions.search = def({
    __name__: "search",
    template: '{{iconTemplate}}<input class="{{inputClass}}">',
    $defaults: {
      htmlTag: "DIV",
      tagClass: "uk-search",
      placeholder: "Search...",
      iconTemplate: "<i class='uk-icon-search uk-search-icon'></i>",
      inputClass: "uk-search-field",
      type: "search"
    },
    getFormControl: function () {
      /**
       * Gets the HTML input element.
       * @returns {Element}
       */
      return this.el.lastChild;
    }
  }, $definitions.input);


  $definitions.dropdown = def({
    __name__: "dropdown",
    $defaults: {
      mode: "click",
      pos: "bottom-center",
      padding: "none",
      justify: false,
      dropdownDelay: 0,
      dropdownCSS: "uk-dropdown-close",
      dropdownAnimation: "uk-animation-scale-up-y uk-animation-top-center",
      dropdownRect: null,
      blank: false
    },
    $setters: {
      dropdown: function (value) {
        var self = this;
        var dropdownContainer = createElement("DIV",
          {class: classString(self.dropdownClass())});

        if (!value.listStyle) {
          value.listStyle = "dropdown";
        }
        self.el.appendChild(dropdownContainer);
        self._inner = exports.new(value, dropdownContainer);
        self.$components.push(self._inner);
      }
    },
    __init__: function (config) {
      var self = this;
      var dropdown = self._dropdown = UIkit.dropdown(self.el, {pos: config.pos, justify: config.justify, mode: config.mode});
      dropdown.on('beforehide.uk.dropdown', function (e) {
        var args = [self.config, self.el, e];
        self.dispatch("onClose", args);
        self._inner.dispatch("onClose", args);
      });
      dropdown.on('hide.uk.dropdown', function (e) {
        var args = [self.config, self.el, e];
        self.dispatch("onClosed", args);
        self._inner.dispatch("onClosed", args);
      });
    },
    dropdownClass: function () {
      var config = getConfig(this);
      var result = config.dropdownCSS;
      result += config.blank ? " uk-dropdown-blank" : " uk-dropdown";
      result += config.scrollable ? " uk-dropdown-scrollable" : "";
      result += " " + config.dropdownAnimation;
      return result;
    },
    getBoundingClientRect: function () {
      /**
       * Gets the bounding rectangle of the element. Needs to be added first since this delegates the call to element.getBoundingClientRect.
       * @returns {any | ClientRect}
       */
      return this.config.dropdownRect || this.el.firstChild.getBoundingClientRect();
    },
    isOpened: function () {
      /**
       * Returns if the dropdown is open.
       * @returns {boolean}
       */
      return hasClass(this.el, 'uk-open');
    },
    open: function (args, cb) {
      /**
       * Opens the dropdown.
       * @dispatch onOpen, onOpened
       * @param args Parameter to pass into the dispatch handlers. (3rd argument of the callback.)
       */
      var self = this;
      var config = self.config;
      args = [config, self.el, args];

      if (config.dropdownDelay) {
        setTimeout(open, config.dropdownDelay);
      } else {
        open();
      }

      function open() {
        self.dispatch("onOpen", args);
        self._inner.dispatch("onOpen", args);
        self._dropdown.show();
        self.dispatch("onOpened", args);
        self._inner.dispatch("onOpened", args);
        if (cb && cb.call) cb.call(self);
      }
    },
    close: function (args) {
      /**
       * Close the dropdown.
       * @dispatch onClose, onClosed
       * @param args Parameter to pass into the dispatch handlers. (3rd argument of the callback.)
       */
      var self = this;
      self.dispatch("onClose", args);
      self._inner.dispatch("onClose", args);
      self._dropdown.hide(true);
      self.dispatch("onClosed", args);
      self._inner.dispatch("onClosed", args);
    }
  }, $definitions.flexgrid, exports.AbsolutePositionMethods);


  exports.LinkedList = {
    __name__: "LinkedList",
    __check__: function (bases) {
      assertBasesCheck('LinkedList', 'LinkedList', bases);
      assertBasesCheck('Dispatcher', 'LinkedList', bases);
    },
    __init__: function () {
      this.headNode = null;
      this.tailNode = null;
      this.$items = [];
    },
    id: function (data) {
      /**
       * Assigns an id to an object if one doesn't exist.
       * @param data The object to assign an id to.
       * @returns {any | string} The id of the object.
       */
      return data.id || (data.id = uid("data"));
    },
    getItem: function (id) {
      /**
       * Gets a configuration object by its id.
       * @param id The id of the element.
       * @returns {string}
       */
      return this.findOne('id', id);
    },
    count: function () {
      /**
       * Gets a count of all objects.
       * @returns {number}
       */
      return this.$items.length;
    },
    updateItem: function (item, update) {
      /**
       * Updates an item by adding properties found on the update object.
       * @param item The item to update.
       * @param update An object containing properties and values to modify.
       */
      assertPropertyValidator(update, 'update object for ' + item.id, isDefined);
      var refNode = item.$tailNode;
      this.remove(item);
      extend(item, update, true);
      this.add(item, refNode);
    },
    refresh: function () {
      /**
       * Refresh the list.
       * @dispatch onRefresh
       */
      this.dispatch("onRefresh");
    },
    pluck: function (key) {
      /**
       * Plucks a property from all child objects.
       * @param key The key of the child objects.
       * @returns {any[]}
       */
      return this.each(function (item) {
        return item[key]
      });
    },
    each: function (func, thisArg) {
      /**
       * Invokes a function on each child.
       * @param func The invoked function.
       * @param thisArg The 'this' object passed to the invoked function.
       * @returns {any[]} Return an array containing the results of the invoked call.
       */
      var node = this.headNode;
      var nextNode;
      var results = [];
      while (node) {
        nextNode = node.$tailNode;
        results.push(func.call(thisArg || this, node));
        node = nextNode;
      }
      return results;
    },
    add: function (item, node) {
      /**
       * Adds an item to the end.
       * @param item The item to add.
       * @dispatch onAdd, onAdded
       * @returns {string} The object id after adding.
       */
      return this.insertBefore(item, node);
    },
    insertBefore: function (item, node) {
      /**
       * Add an item before another item.
       * @param item The item to add.
       * @param node The reference item to add the item before.
       * @dispatch onAdd, onAdded
       * @returns {string} The object id after adding.
       */
      var self = this;
      assertPropertyValidator(item, 'HTMLElement', isObject);
      assert(self.$items.indexOf(item) == -1, "Circular reference detected with node insert!");

      item.id = self.id(item);

      if (!node && self.tailNode) {
        // Insert as last node
        return self.insertAfter(item, self.tailNode);
      }
      else {
        self.dispatch("onAdd", [item]);

        if (self.headNode == null || self.tailNode == null) {
          self.headNode = item;
          self.tailNode = item;
          item.$headNode = item.$tailNode = null;
        }
        else {
          if (node.$headNode) {
            node.$headNode.$tailNode = item;
          }
          item.$headNode = node.$headNode;
          item.$tailNode = node;
          node.$headNode = item;

          if (node == self.headNode)
            self.headNode = item;
        }

        self.$items.push(item);

        self.dispatch("onAdded", [item, node]);

        return item.id;
      }
    },
    insertAfter: function (item, node) {
      /**
       * Add an item after another item.
       * @param item The item to add.
       * @param node The reference item to add the item after.
       * @dispatch onAdd, onAdded
       * @returns {string} The object id after adding.
       */
      var self = this;
      assertPropertyValidator(item, 'item object ' + item, isObject);
      assert(self.$items.indexOf(item) == -1, "Circular reference detected with node insert!");

      item.id = self.id(item);

      if (!node && self.headNode) {
        // Insert as first node
        return self.insertBefore(item, self.headNode);
      }
      else {
        self.dispatch("onAdd", [item]);

        if (self.headNode == null || self.tailNode == null) {
          self.headNode = item;
          self.tailNode = item;
          item.$headNode = item.$tailNode = null;
        }
        else {
          if (node.$tailNode) {
            node.$tailNode.$headNode = item;
          }
          item.$tailNode = node.$tailNode;
          item.$headNode = node;
          node.$tailNode = item;

          if (node == self.tailNode)
            self.tailNode = item;
        }

        self.$items.push(item);

        self.dispatch("onAdded", [item]);

        return item.id;
      }
    },
    remove: function (item) {
      /**
       * Removes an item.
       * @param item The item to remove.
       * @dispatch onDelete, onDeleted
       * @returns {any} The item object.
       */
      assertPropertyValidator(item, 'item', isObject);

      var self = this;
      self.dispatch("onDelete", [item]);

      if (item.$headNode) item.$headNode.$tailNode = item.$tailNode;
      if (item.$tailNode) item.$tailNode.$headNode = item.$headNode;
      if (item == self.headNode)
        self.headNode = item.$tailNode;
      if (item == self.tailNode)
        self.tailNode = item.$headNode;
      item.$tailNode = item.$headNode = null;

      removeFromArray(self.$items, item);

      self.dispatch("onDeleted", [item]);
      return item;
    },
    clearAll: function () {
      /**
       * Remove all items.
       */
      var self = this;
      self.headNode = null;
      self.tailNode = null;
      self.$items = [];
      self.dispatch("onClearAll", []);
    },
    previous: function (node) {
      return node.$headNode;
    },
    next: function (node) {
      return node.$tailNode;
    },
    contains: function (item) {
      /**
       * Checks if an item exists.
       * @param item The item to check for.
       * @returns {boolean} True if the item exists.
       */
      return this.$items.indexOf(item) != -1;
    },
    indexOf: function (item, beginNode) {
      /**
       * Gets the index of an item.
       * @param item The item to find the index for.
       * @param beginNode An optional node which specifies the start.
       * @returns {int | undefined} The index of the item, or undefined if doesn't exist.
       */
      var i = 0;
      var node = beginNode || this.headNode;
      while (node) {
        // Apparently 1 == "1" in JS
        if (node === item)
          return i;
        node = node.$tailNode;
        i++;
      }
    },
    findWhere: function (key, value, beginNode) {
      /**
       * Find all items based on a key and value.
       * @param key The key to look at for matching.
       * @param value The value of the key.
       * @param beginNode An optional node which specifies the start.
       * @returns {any} The item if found, undefined otherwise.
       */
      var result = [];
      var node = beginNode || this.headNode;
      while (node) {
        // Apparently 1 == "1" in JS
        if (node[key] === value)
          result.push(node);
        node = node.$tailNode;
      }
      return result;
    },
    findOne: function (key, value, beginNode) {
      /**
       * Finds an item based on a key and value of the item.
       * @param key The key to look at for matching.
       * @param value The value of the key.
       * @param beginNode An optional node which specifies the start.
       * @returns {any} The item if found, undefined otherwise.
       */
      var node = beginNode || this.headNode;
      while (node) {
        // Apparently 1 == "1" in JS
        if (node[key] === value)
          return node;
        node = node.$tailNode;
      }
    },
    findFirst: function (cond, beginNode, thisArg) {
      /**
       * Finds the first item which matches a condition predicate function.
       * @param cond The condition function.
       * @param beginNode An optional node which specifies the start.
       * @param thisArg The 'this' argument to pass to the function.
       * @returns {any} The item if found, undefined otherwise.
       */
      var node = beginNode || this.headNode;
      while (node) {
        if (cond.call(thisArg || this, node)) {
          return node;
        }
        node = node.$tailNode;
      }
    },
    findLast: function (cond, beginNode, thisArg) {
      /**
       * Finds the last item which matches a condition predicate function.
       * @param cond The condition function.
       * @param beginNode An optional node which specifies the start.
       * @param thisArg The 'this' argument to pass to the function.
       * @returns {any} The item if found, undefined otherwise.
       */
      var node = beginNode || this.headNode;
      var lastNode = null;
      while (node) {
        if (cond.call(thisArg || this, node)) {
          lastNode = node;
        }
        else {
          return lastNode;
        }
        node = node.$tailNode;
      }
      return lastNode;
    }
  };

  assignClassToMethods(exports.LinkedList, 'LinkedList');


  $definitions.stack = def({
    __name__: "stack",
    $defaults: {
      filter: function (item) {
        return !item.$parentClosed;
      },
      droppable: returnTrue,
      itemTag: 'DIV',
      itemTagClass: ''
    },
    $setters: {
      filter: function (value) {
        assertPropertyValidator(value, 'filter', isFunction);
      },
      droppable: function (value) {
        assertPropertyValidator(value, 'value', isFunction);
      }
    },
    __after__: function (config) {
      var self = this;
      self.addListener("onAdded", self._onAdded);
      self.addListener("onDeleted", self._onDeleted);
      self.addListener("onRefresh", self._onRefresh);
      self.addListener("onClearAll", self._onClearAll);
      self.addListener("onDispose", self._onClearAll);

      if (config.data) self.setData(config.data);
    },
    __init__: function () {
      this.$elements = {};
      this.$itemListeners = {};
      this.$itemComponents = {};  // Mapping of item ids to component objects;
    },
    getItemNode: function (id) {
      /**
       * Get the wrapper element that used to hold a child component with a specific id. For example, this would be an LI in a list.
       * @returns {Element}
       */
      return this.$elements[id];
    },
    render: function () {
      // Do nothing, overwrites render function.
    },
    containerElement: function () {
      return this.el;
    },
    itemElement: function (item) {
      return createElement(this.itemTagString(item), {class: this.itemClass(item)});
    },
    itemClass: function (item) {
      var itemClass = classString(getConfig(this).itemTagClass);
      itemClass += item.$selected ? ' ' + ACTIVE_CLASS : '';
      itemClass += ' ' + classString(item.$css);
      return itemClass;
    },
    itemTagString: function () {
      return getConfig(this).itemTag;
    },
    buildItemElement: function () {
    },
    attachItemEvents: function () {
    },
    createItemElement: function (item) {
      var el = this.itemElement(item);
      setAttributes(el, {'data-id': item.id});
      this.buildItemElement(el, item);
      this.attachItemEvents(el, item);
      this.$elements[item.id] = el;
      return el;
    },
    _onDispose: function () {
      var self = this;
      forInLoop(function (key, node) {
        if (node.parentNode) self.containerElement().removeChild(node);
      }, self.$elements);

      forInLoop(function (id, listeners) {
        listeners.forEach(removeListener);
      }, self.$itemListeners);

      forInLoop(function (id, component) {
        component.dispose();
      }, self.$itemComponents);

      self.$itemListeners = {};
      self.$elements = {};
      self.$itemComponents = {};
      self.$components = [];
    },
    _onAdded: function (obj) {
      var self = this;
      var node = self.createItemElement(obj);

      obj.$hidden = self._checkItemHidden(obj);

      if (obj.$hidden) {
        addClass(node, HIDDEN_CLASS);
      }

      if (obj.$tailNode)
        self.containerElement().insertBefore(node, self.getItemNode(obj.$tailNode.id));
      else
        self.containerElement().appendChild(node);

      if (obj.$parent) {
        var parent = self.getItem(obj.$parent);
        if (parent && parent.$children && parent.$children.length === 1) {
          var parentNode = self.getItemNode(parent.id);
          var newParentNode = self.createItemElement(parent);
          if (parent.$hidden) addClass(newParentNode, HIDDEN_CLASS);
          parentNode.parentNode.replaceChild(newParentNode, parentNode);
        }
      }

      self.dispatch("onDOMChanged", [obj, "added"]);
    },
    _onDeleted: function (obj) {
      var self = this;
      if (obj.$parent) {
        var parent = self.getItem(obj.$parent);
        if (parent && parent.$branch) {
          removeFromArray(parent.$children, obj);
          if (parent.$children.length === 0) {
            var parentNode = self.getItemNode(parent.id);
            var newParentNode = self.createItemElement(parent);
            if (parent.$hidden) addClass(newParentNode, HIDDEN_CLASS);
            parentNode.parentNode.replaceChild(newParentNode, parentNode);
          }
        }
      }
      self.containerElement().removeChild(self.getItemNode(obj.id));
      delete self.$elements[obj.id];

      // Dispose item global listeners
      var itemListeners = self.$itemListeners[obj.id];
      if (itemListeners) {
        itemListeners.forEach(removeListener);
        delete self.$itemListeners[obj.id];
      }

      // Dispose item component
      var itemComponent = self.$itemComponents[obj.id];
      if (itemComponent) {
        itemComponent.dispose();
        delete self.$itemComponents[obj.id];
      }

      self.dispatch("onDOMChanged", [obj, "deleted"]);
    },
    _onRefresh: function () {
      var self = this;
      self.each(function (item) {
        var node = self.getItemNode(item.id);
        item.$hidden = self._checkItemHidden(item);
        if (item.$hidden) addClass(node, HIDDEN_CLASS);
        else removeClass(node, HIDDEN_CLASS);
      });

      self.dispatch("onDOMChanged", [null, "refresh"]);
    },
    _onClearAll: function () {
      this._onDispose();  // This just cleans up the item listeners and global references
      this.dispatch("onDOMChanged", [null, "clear"]);
    },
    _checkItemHidden: function (item) {
      return !this.filter(item);
    },
    setData: function (data) {
      /**
       * Sets the data for the component.
       * @param data An array of component configuration objects. The default view object is 'link' if none is specified.
       */
      assertPropertyValidator(data, 'setData argument data', isArray);

      var $this = this;
      $this.clearAll();

      data.forEach(function (item) {
        $this.add(item);
      });

      $this.data = data;
    },
    getBatch: function () {
      /**
       * Get the 'batch' value that was passed to `setBatch`.
       */
      return this.$batch;
    },
    showBatch: function (name) {
      /**
       * Show only elements with a specific 'batch' value in its configuration. Hides all other elements.
       * @param name An array or a delimited string with a list of batch values to filter by.
       * @example showBatch('icons sidebar mainWindow')
       */
      this.$batch = name;
      this.each(function (item) {
        if (name.indexOf(item.batch) != -1)
          removeClass(this.$elements[item.id], HIDDEN_CLASS);
        else
          addClass(this.$elements[item.id], HIDDEN_CLASS);
      }, this);
    }
  }, exports.LinkedList, $definitions.element);


  $definitions.list = def({
    __name__: "list",
    $defaults: {
      htmlTag: "UL",
      itemTag: "LI",
      selectable: false,
      closeButton: false,
      listStyle: "list",
      dropdownEvent: "onItemClick"
    },
    $setters: extend(
      classSetters({
        listStyle: prefixClassOptions({
          "nav": "nav",
          "side": ["nav", "nav-side"],
          "dropdown": ["nav", "nav-dropdown", "nav-side"],
          "striped": ["nav", "list", "list-striped"],
          "line": ["list", "list-line"],
          "navbar": "navbar-nav",
          "subnav": "subnav",
          "subnav-line": ["subnav", "subnav-line"],
          "subnav-pill": ["subnav", "subnav-pill"],
          "list": "list",
          "tab": "tab",
          "tab-flip": "tab-flip",
          "tab-bottom": "tab-bottom",
          "tab-center": "tab-center",
          "tab-left": "tab-left",
          "tab-right": "tab-right",
          "breadcrumb": "breadcrumb",
          "": ""
        }, 'uk-')
      }),
      {
        accordion: function (value) {
          if (value) setAttributes(this.el, {"data-uk-nav": ""});
          else this.el.removeAttribute("data-uk-nav");
        },
        tab: function (value) {
          if (value) {
            var self = this;
            self.addListener("onItemClick", self._onTabClick);

            if (value == "responsive") {
              // Create a list of linked data to the actual data
              // This avoids needing to duplicate the data
              var linkedData = self.config.data.map(function (item) {
                return {label: item.label, $link: item, $close: item.$close};
              });

              self.set('dropdownEvent', "onTabMenuClick");
              self.set('dropdown', {
                view: "list",
                data: linkedData,
                on: {
                  onItemClick: function (item, node, e) {
                    self._onTabClick(item.$link, node, e);
                  },
                  onItemSelectionChanged: function (item, node, e) {
                    self._onTabClick(item.$link, node, e);
                  },
                  onItemClosed: function (item) {
                    self.closeItem(item.$link);
                  }
                }
              });
              self.dropdownList = self.dropdownPopup._inner;
            }
          }
        }
      }
    ),
    __after__: function (config) {
      if (config.tab) {
        var self = this;
        self.addListener("onAdded", self._onTabAdded);
        self.addListener("onDeleted", self._onTabDeleted);
        self.addListener("onItemSelectionChanged", self._onItemSelectionChanged);
        if (config.tab == 'responsive') {
          self.addListener("onDOMChanged", self._onDOMChanged);
          self.add({label: "<i class='uk-icon-bars'></i>", $tabMenu: true, batch: "$menu"}, self.headNode);
          $windowListeners.resize.push(bind(self.updateFit, self));
          self.dispatch("onDOMChanged", [null, "refresh"]);
        }
      }
    },
    _onDOMChanged: function () {
      delay(this.updateFit, this);
    },
    _onTabAdded: function (item, before) {
      var self = this;
      if (self.dropdownList && !item.$tabMenu) {
        var linked = {label: item.label, $link: item, $close: item.$close};
        self.dropdownList.add(linked, self.dropdownList.findOne("$link", before));
        // Select dropdown item if item is selected
        if (item.$selected) {
          self.dropdownList.deselectAll();
          self.dropdownList.select(linked);
        }
      }
      if (item.$selected) {
        self.deselectAll();
        self.select(item);
      }
    },
    _onTabDeleted: function (item) {
      if (this.dropdownList) {
        var linked = this.dropdownList.findOne("$link", item);
        if (linked) this.dropdownList.remove(linked);
      }
    },
    _onTabClick: function (item, node, e) {
      var self = this;
      if (item.$tabMenu) {
        self.dispatch("onTabMenuClick", [item, node, e]);
      }
      else if (self.contains(item)) {
        self.dispatch("onItemSelectionChanged", [item]);
      }
    },
    _onItemSelectionChanged: function (item) {
      var self = this;
      self.deselectAll();
      self.select(item);

      // Select item
      if (self.dropdownList) {
        var linked = self.dropdownList.findOne("$link", item);
        if (linked) {
          self.dropdownList.deselectAll();
          self.dropdownList.select(linked);
        }

        // Show active visible item
        self.updateFit();
      }
    },
    updateFit: function () {
      /**
       * Checks if the screen is wide enough to fit all components. Used with tab mode to allow for a responsive tab menu.
       */
      var self = this;
      self.each(function (item) {
        // Show everything for checking y-offset (keep invisible to avoid blink)
        addClass(this.$elements[item.id], "uk-invisible");
        // Update batch according to $selected state
        if (!item.$tabMenu) {
          item.batch = item.$selected ? "$selected" : undefined;
        }
      }, self);

      var offset, doResponsive;
      
      forInLoop(function (key, node) {
        if (offset && node.offsetTop != offset) {
          doResponsive = true;
          return false;
        }
        offset = node.offsetTop;
      }, self.$elements);

      self.each(function (item) {
        removeClass(this.$elements[item.id], "uk-invisible");
      }, self);

      if (doResponsive) {
        self.showBatch(["$menu", "$selected"]);
      }
      else {
        self.showBatch([undefined, "$selected"]);
      }
    },
    setActiveLabel: function (label) {
      /**
       * Sets the active item of the list based on the item's label property. This operates as a single-selection of an item. Returns true on success.
       * @param label The label value of an item.
       * @returns {boolean}
       */
      return this.setActive("label", label);
    },
    setActive: function (key, value) {
      /**
       * Set the active item of the list based on a property. This operates as a single-selection of an item. Returns true on success.
       * @returns {boolean}
       */
      this.deselectAll();
      var item = this.findOne(key, value);
      if (item) this.select(item);
      return !!item;
    },
    isSelected: function (item) {
      /**
       * Checks if an item is selected.
       * @param item An item of the component.
       */
      if (isString(item))
        item = this.getItem(item);
      return item.$selected;
    },
    getSelected: function () {
      /**
       * Return all selected items.
       * @returns {any[]} A list of selected items.
       */
      return this.findWhere('$selected', true);
    },
    select: function (item) {
      /**
       * Selects an active item of the list. This method will not deselect previously selected items.
       * @param item The object to select in the list.
       */
      if (isString(item))
        item = this.getItem(item);
      item.$selected = true;
      addClass(this.getItemNode(item.id), ACTIVE_CLASS);
    },
    deselect: function (item) {
      if (isString(item))
        item = this.getItem(item);
      var node = this.getItemNode(item.id);
      item.$selected = false;
      assert(node, "Node with id " + item.id + " does not exist");
      removeClass(node, ACTIVE_CLASS);
    },
    deselectAll: function () {
      /**
       * Deselects all items in the list, use this for single-selection lists.
       */
      this.each(function (item) {
        this.deselect(item);
      }, this);
    },
    closeItem: function (item) {
      /**
       * For tabs only, closes a tab item and removes it.
       * @param item The item to remove.
       * @dispatch onItemClose, onItemClosed, onItemSelectionChanged
       */
      var self = this;
      self.dispatch("onItemClose", [item]);

      if (self.isSelected(item)) {
        // Select the next tab that's not a tab menu.
        var nextItem = self.previous(item) || self.next(item);
        nextItem = nextItem && nextItem.$tabMenu ? self.next(item) : nextItem;

        if (nextItem && !nextItem.$tabMenu) {
          self.select(nextItem);
          self.dispatch("onItemSelectionChanged", [nextItem]);
        }
      }

      // Don't remove if is tab menu
      if (item && !item.$tabMenu) {
        self.remove(item);
      }

      self.dispatch("onItemClosed", [item]);
    },
    itemClass: function (item) {
      var cls = UI.definitions.stack.prototype.itemClass.call(this, item);
      if (item.$header) cls += " uk-nav-header";
      if (item.$divider) cls += " uk-nav-divider";
      return cls;
    },
    template: function (item) {
      if (item.$header) {
        return item.label;
      }
      else if (item.$divider) {
        return '';
      }
      else {
        return exports.new(item);
      }
    },
    buildItemElement: function (el, item) {
      var self = this;
      var templateArray = self.template(item);

      if (!isArray(templateArray)) {
        templateArray = [templateArray];
      }

      templateArray.forEach(function (itemTemplate) {
        if (isString(itemTemplate)) {
          el.innerHTML = itemTemplate;
        }
        else if (isUndefined(itemTemplate) || itemTemplate === null) {
          // Ignore undefined and nulls
        }
        else if (isElement(itemTemplate)) {
          el.appendChild(itemTemplate);
        }
        else if (itemTemplate.el) {
          el.appendChild(itemTemplate.el);
          self.$itemComponents[item.id] = itemTemplate;
          self.$components.push(itemTemplate);
        }
        else {
          fail('Unrecognized object returned by template function.', itemTemplate);
        }
      });
    },
    attachItemEvents: function (el, item) {
      if (item.header || item.divider) return;

      var self = this;
      var listenerId;
      var on = self.config.on || {};

      var $listeners = self.$itemListeners[item.id] = self.$itemListeners[item.id] || [];

      if (on.onItemClick) {
        listenerId = addListener(el, "click", function (e) {
          if (!exports.$dragged) self.dispatch("onItemClick", [item, el, e]);
        });
        $listeners.push(listenerId);
        self.$listeners.push(listenerId);
      }

      if (on.onItemContext) {
        listenerId = addListener(el, "contextmenu", function (e) {
          self.dispatch("onItemContext", [item, el, e]);
        });
        $listeners.push(listenerId);
        self.$listeners.push(listenerId);
      }

      if (self.droppable && item.$droppable !== false) {
        el.config = item;
        el.master = self;
        el.$droppable = true;
      }

      if (self.draggable && item.$draggable !== false) {
        setAttributes(el, {draggable: 'false'});

        listenerId = addListener(el, "dragstart", function (e) {
          preventEvent(e);
        }, self);

        $listeners.push(listenerId);
        self.$listeners.push(listenerId);

        if (UIkit.support.touch) {
          listenerId = addListener(el, "touchstart", onMouseDown, self);
          $listeners.push(listenerId);
          self.$listeners.push(listenerId);
        }

        listenerId = addListener(el, "mousedown", onMouseDown, self);
        $listeners.push(listenerId);
        self.$listeners.push(listenerId);

        function onMouseDown(e) {
          if (isFunction(this.draggable) && !this.draggable(e)) {
            return;
          }
          var ev = e.touches && e.touches[0] || e;
          var offset = el.getBoundingClientRect();
          exports._selectedForDrag = {
            target: this,
            config: item,
            node: el,
            originalPos: {top: el.style.top, left: el.style.left},
            pos: {x: ev.clientX, y: ev.clientY},
            mouseOffset: {
              left: offset.left - ev.clientX,
              top: offset.top - ev.clientY
            },
            event: e
          };
        }
      }
    }
  }, $definitions.stack);


  $definitions.tree = def({
    __name__: "tree",
    $defaults: {
      listStyle: "side",
      selectable: false,
      indentWidth: 15,
      dataTransfer: 'id',
      draggable: true,
      orderAfter: function (other) {
        var self = this;
        var isParent = self.$parent == other.id;
        var isNestedDeeper = self.$depth < other.$depth;
        var sameParent = self.$parent == other.$parent;
        return (isParent || isNestedDeeper || (sameParent && (
        self.label > other.label && self.$branch == other.$branch || self.$branch < other.$branch)));
      },
      droppable: function (item) {
        return item.$branch;
      }
    },
    __after__: function () {
      var self = this;
      self.addListener("onItemClick", self.toggle);
      self.addListener("onItemDragStart", self._dragStart);
      self.addListener("onItemDragOver", self._dragOver);
      self.addListener("onItemDragLeave", self._dragLeave);
      self.addListener("onItemDragEnd", self._dragEnd);
      self.addListener("onItemDrop", self._dragLeave);
    },
    _dragStart: function (item) {
      var $this = this;
      if (item.$branch)
        $this._hideChildren(item);
    },
    _dragEnd: function (item) {
      if (item.$branch && !item.$closed)
        this._showChildren(item);
    },
    _dragOver: function (item) {
      if (getConfig(this).droppable(item, exports.$dragged.config, exports.$dragged.node))
        addClass(this.getItemNode(item.id), ACTIVE_CLASS);
    },
    _dragLeave: function (item) {
      removeClass(this.getItemNode(item.id), ACTIVE_CLASS);
    },
    _showChildren: function (item) {
      forEachUntil(function (child, queue) {
		child.$parentClosed = false;
		child.$hidden = this._checkItemHidden(child);
        removeClass(this.getItemNode(child.id), HIDDEN_CLASS);

        if (child.$branch && !child.$closed) {
          for (var i = 0; i < child.$children.length; i++) {
            queue.push(child.$children[i]);
          }
        }
        return true;
      }, item.$children, this);
    },
    _hideChildren: function (item) {
      forEachUntil(function (child, queue) {
		child.$parentClosed = true;
		child.$hidden = this._checkItemHidden(child);
        addClass(this.getItemNode(child.id), HIDDEN_CLASS);

        if (child.$branch) {
          for (var i = 0; i < child.$children.length; i++) {
            queue.push(child.$children[i]);
          }
        }
        return true;
      }, item.$children, this);
    },
    _checkParentClosed: function (item) {
      var parent = this.getItem(item.$parent);
      var closed = false;
      while (parent) {
        if (parent.$closed) {
          closed = true;
          break;
        } else {
          parent = this.getItem(parent.$parent);
        }
      }
      return closed;
    },
    add: function (obj) {
      /**
       * Add a child to the tree.
       * @param item A child of the tree. The parent id of the object should be specified in its $parent property.
       */
      obj.$branch = !!obj.$branch; // Convert to boolean
      if (obj.$branch) obj.$children = [];

      var self = this;
      if (!obj.$parent) {
        obj.$depth = 0;
      }
      else {
        var parent = self.getItem(obj.$parent);
        obj.$parentClosed = self._checkParentClosed(obj);
        obj.$depth = parent.$depth + 1;
        obj.$hidden = this._checkItemHidden(obj);
        parent.$branch = true;
        parent.$children = parent.$children || [];
        parent.$children.push(obj);
      }
      var refChild = self.findLast(self.config.orderAfter, parent, obj);
      self.insertAfter(obj, refChild);
    },
    remove: function (obj) {
      /**
       * Removes a child of the tree. If the child is branch, removes all branch children as well.
       * @param item A child of the tree.
       */
      if (obj.$branch) {
        while (obj.$children.length > 0) {
          this.remove(obj.$children[0]);
        }
      }
      exports.LinkedList.remove.call(this, obj);
    },
    template: function (config) {
      return interpolate(
        '<a><i class="uk-icon-{{icon}}" style="margin-left: {{margin}}px">' +
        '</i><span class="uk-margin-small-left">{{label}}</span></a>',
        {
          icon: config.$branch ?
            (config.$children.length ?
              "folder" :
              "folder-o") :
            "file-o",
          label: config.label,
          margin: config.$depth * this.indentWidth
        });
    },
    open: function (item) {
      /**
       * Expand a specific branch of the tree.
       * @param item A child branch of the tree.
       * @dispatch onOpen, onOpened
       */
      if (!item.$branch || !item.$closed) return;

      var self = this;
      self.dispatch("onOpen", [item.id]);

	  item.$closed = false;

      var node = self.getItemNode(item.id);
      node.parentNode.replaceChild(self.createItemElement(item), node);

	  self._showChildren(item);

	  item.$hidden = this._checkItemHidden(item);

      self.dispatch("onOpened", [item.id]);

      if (item.$parent)
        self.open(item.$parent);
    },
    close: function (item) {
      /**
       * Collapse a specific branch of the tree.
       * @param item A child branch of the tree.
       * @dispatch onClose, onClosed
       */
      if (!item.$branch || item.$closed) return;

      var self = this;
      self.dispatch("onClose", [item.id]);

      item.$closed = true;
      var node = self.getItemNode(item.id);
      node.parentNode.replaceChild(self.createItemElement(item), node);

	  self._hideChildren(item);
	  
	  item.$hidden = this._checkItemHidden(item);

      self.dispatch("onClosed", [item.id]);
    },
    openAll: function () {
      /**
       * Expand all children of the tree component.
       * @dispatch onOpen, onOpened
       */
      this.each(function (obj) {
        if (obj.$branch)
          this.open(obj.id);
      });
    },
    closeAll: function () {
      /**
       * Collapse all children of the tree component.
       * @dispatch onClose, onClosed
       */
      this.each(function (obj) {
        if (obj.$branch)
          this.close(obj.id);
      });
    },
    isBranchOpen: function (item) {
      /**
       * Checks if a specific branch of the tree is open.
       * @param item A child branch of the tree.
       * @returns {boolean}
       */
      if (item.$branch && !item.$closed)
        return this.isBranchOpen(item.$parent);
      return false;
    },
    toggle: function (item) {
      /**
       * Toggles a branch child of the tree. If the child is not a branch, ignores it.
       * @param item A child branch of the tree.
       * @dispatch onClose, onClosed, onOpen, onOpened
       */
      if (item.$branch) {
        if (item.$closed)
          this.open(item);
        else
          this.close(item);
      }
    }
  }, $definitions.list);


  $definitions.table = def({
    __name__: "table",
    $defaults: {
      tagClass: "uk-table",
      htmlTag: "TABLE",
      itemTag: "TR",
      flex: false,
      flexSize: "",
      listStyle: ""
    },
    __init__: function () {
      var self = this;
      self.header = self._header = createElement("THEAD");
      self.footer = self._footer = createElement("TFOOT");
      self.body = self._body = createElement("TBODY");

      // Make Chrome wrapping behavior same as firefox
      self._body.style.wordBreak = "break-word";

      self.el.appendChild(self._header);
      self.el.appendChild(self._footer);
      self.el.appendChild(self._body);
    },
    $setters: extend(classSetters({
        tableStyle: prefixClassOptions({
          hover: "",
          striped: "",
          condensed: "",
          "": ""
        }, 'uk-table-', true)
      }),
      {
        columns: function (value) {
          assertPropertyValidator(value, 'columns', isArray);
          value.forEach(function (item) {
            if (isUndefined(item.template) && item.name) {
              item.template = exports.selectors.property(item.name);
            }
          });
        },
        header: function (value) {
          if (value) {
            var self = this;
            if (isObject(value)) {
              var column = self.config.columns.filter(function (item) { return  item.name === value.name} );
              assertPropertyValidator(column, 'column name ' + value.name, isDefined);
              column.header = value.header;
            }
            var columns = self.config.columns;
            var headersHTML = "";

            columns.forEach(function (column) {
              headersHTML += column.align ?
                interpolate("<th style='text-align: {{align}}'>{{text}}</th>", {
                  align: column.align,
                  text: column.header
                })
                : "<th>" + column.header + "</th>";
            });

            self._header.innerHTML = "<tr>" + headersHTML + "</tr>";
          }
        },
        footer: function (value) {
          if (value) {
            var self = this;
            if (isObject(value)) {
              var column = self.config.columns.filter(function (item) { return  item.name === value.name} );
              assertPropertyValidator(column, 'column name ' + value.name, isDefined);
              column.footer = value.footer;
            }
            var footers = pluck(self.config.columns, "footer");
            self._footer.innerHTML = "<tr><td>" + footers.join("</td><td>") + "</td></tr>";
          }
        },
        caption: function (value) {
          var self = this;
          self._caption = createElement("CAPTION");
          self._caption.innerHTML = value;
          self.el.appendChild(self._caption);
        }
      }
    ),
    template: function (item) {
      var self = this;
      return self.config.columns.map(function (column) {
        var td = createElement("TD", {class: column.$css ? classString(column.$css) : ""});

        if (column.align)
          td.style.textAlign = column.align;

        template(column.template, item, self, td);
        return td;
      });
    },
    containerElement: function () {
      return this._body;
    }
  }, $definitions.list);


  $definitions.select = def({
    __name__: "select",
    $defaults: {
      tagClass: "",
      htmlTag: "SELECT",
      itemTag: "OPTION",
      flex: false,
      flexSize: "",
      listStyle: ""
    },
    select: function (item) {
      /**
       * Selects an item in the select component.
       * @param item Object to select.
       */
      var self = this;
      if (isString(item))
        item = self.getItem(item);
      item.$selected = true;
      self.getFormControl().selectedIndex = self.indexOf(item);
    },
    deselectAll: function () {
      // Do nothing, invalid for select component.
    },
    setValue: function (value) {
      /**
       * Sets the selected value of the select component.
       * @param value
       * @returns {boolean} True if value exist in options, false otherwise.
       */
      return this.setActive('value', value);
    },
    template: function (item) {
      return item.label;
    },
    itemElement: function (item) {
      var attributes = {value: item.value, class: this.itemClass(item)};
      if (item.selected) attributes.selected = item.selected;
      return createElement(this.itemTagString(), attributes);
    }
  }, exports.ChangeEvent, exports.FormControl, $definitions.list);


  $definitions.form = def({
    __name__: "form",
    $defaults: {
      htmlTag: "FORM",
      tagClass: "uk-form",
      formStyle: "stacked",
      fieldset: []
    },
    $events: {
      submit: {dispatch: 'onSubmit', callback: returnTrue}
    },
    $setters: extend(
      classSetters({
        formStyle: prefixClassOptions({
          stacked: "",
          horizontal: "",
          line: "",
          "": ""
        }, 'uk-form-', true)
      }),
      {
        fieldset: function (value) {
          this.set('fieldsets', [{
            view: "fieldset",
            formStyle: getConfig(this).formStyle,
            data: value
          }]);
        },
        fieldsets: function (value) {
          assertPropertyValidator(value, 'fieldsets', isArray);
          var self = this;

          value.forEach(function (config) {
            var ui = exports.new(config, self.el);
            self.$fieldsets.push(ui);
            self.$components.push(ui);
          });
        }
      }),
    __init__: function () {
      this.$fieldsets = [];
    },
    clear: function () {
      /**
       * Clear all values from the form.
       */
      this.$fieldsets.forEach(function (fs) {
        fs.clear();
      });
    },
    enable: function () {
      /**
       * Enable the fieldset of the form.
       */
      this.$fieldsets.forEach(function (fs) {
        fs.enable();
      });
    },
    disable: function () {
      /**
       * Disable the fieldset of the form.
       */
      this.$fieldsets.forEach(function (fs) {
        fs.disable();
      });
    },
    getValues: function () {
      /**
       * Gets the values of the form's components.
       * @returns {any} Object of key values of the form.
       */
      var result = {};
      this.$fieldsets.forEach(function (fs) {
        UI.extend(result, fs.getValues());
      });
      return result;
    },
    setValues: function (values) {
      /**
       * Sets the values for the form components. The keys of the object correspond with the 'name' of child components.
       * @param values Object of names and values.
       */
      this.$fieldsets.forEach(function (fs) {
        fs.setValues(values);
      });
    },
    getFieldset: function (index) {
      /**
       * Retrieves the fieldset component of the form.
       * @param index The index of the fieldset in the form, default 0.
       * @returns {Component}
       */
      return this.$fieldsets[index || 0];
    }
  }, $definitions.element);


  $definitions.fieldset = def({
    __name__: "fieldset",
    $defaults: {
      htmlTag: "FIELDSET",
      itemTag: "DIV",
      itemTagClass: "uk-form-row"
    },
    $setters: classSetters({
      formStyle: prefixClassOptions({
        stacked: "",
        horizontal: "",
        line: "",
        "": ""
      }, 'uk-form-', true)
    }),
    itemTagString: function (item) {
      return item.title ? "LEGEND" : getConfig(this).itemTag;
    },
    buildItemElement: function (el, item) {
      if (item.$title) {
        el.innerHTML = item.label;
      }
      else {
        var component = exports.new(item, function (componentElement) {
          if (!item.$inline) {
            var controlContainer = createElement("DIV", {class: "uk-form-controls"});
            controlContainer.appendChild(componentElement);
            el.appendChild(controlContainer);
          }
          else {
            el.appendChild(componentElement);
          }
        });
        this.$itemComponents[item.id] = component;
        this.$components.push(component);

        if (item.formLabel) {
          var label = component.label = createElement("LABEL", {class: "uk-form-label", for: item.id});
          label.innerHTML = item.formLabel;
          if (item.$inline) addClass(label, "uk-display-inline");
          el.insertBefore(label, el.firstChild);
        }
      }
    },
    clear: function () {
      /**
       * Clear all values from the fieldset.
       */
      this.each(function (item) {
        if (item.name) {
          $$(item.id).reset();
        }
      });
    },
    enable: function () {
      /**
       * Enables the fieldset.
       */
      this.each(function (item) {
        if (item.name || item.view == "button") {
          $$(item.id).enable();
        }
      });
    },
    disable: function () {
      /**
       * Disables the fieldset. (Works by disabling each child.)
       */
      this.each(function (item) {
        if (item.name || item.view == "button") {
          $$(item.id).disable();
        }
      });
    },
    getValues: function () {
      /**
       * Gets the values of the form's components.
       * @returns {any} Object of key values of the fieldset.
       */
      var results = {};

      var unprocessed = this.$components.slice();

      // Extract all children with `name` attributes, including nested flexgrid children.
      var ui;
      while (unprocessed.length > 0) {
        ui = unprocessed.pop();
        if (ui && ui.config.name) {
          results[ui.config.name] = ui.getValue();
        }
        else if (ui.$components) {
          unprocessed = unprocessed.concat(ui.$components);
        }
      }

      return results;
    },
    setValues: function (config) {
      /**
       * Sets the values for the form components. The keys of the object correspond with the 'name' of child components.
       * @param values Object of names and values.
       */
      config = config || {};
      var unprocessed = this.$components.slice();

      var ui;
      while (unprocessed.length > 0) {
        ui = unprocessed.pop();
        if (ui && isDefined(config[ui.config.name])) {
          ui.setValue(config[ui.config.name]);
        }
        else if (ui.$components) {
          unprocessed = unprocessed.concat(ui.$components);
        }
      }
    }
  }, $definitions.stack);

  window.$$ = $$;

  return exports;
})({}, window, window.UIkit);
