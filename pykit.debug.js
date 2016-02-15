(function(core) {

    if (typeof define == "function" && define.amd) { // AMD

        define("uikit", function(){

            var uikit = window.UIkit || core(window, window.jQuery, window.document);

            uikit.load = function(res, req, onload, config) {

                var resources = res.split(','), load = [], i, base = (config.config && config.config.uikit && config.config.uikit.base ? config.config.uikit.base : "").replace(/\/+$/g, "");

                if (!base) {
                    throw new Error( "Please define base path to UIkit in the requirejs config." );
                }

                for (i = 0; i < resources.length; i += 1) {
                    var resource = resources[i].replace(/\./g, '/');
                    load.push(base+'/components/'+resource);
                }

                req(load, function() {
                    onload(uikit);
                });
            };

            return uikit;
        });
    }

    if (!window.jQuery) {
        throw new Error( "UIkit requires jQuery" );
    }

    if (window && window.jQuery) {
        core(window, window.jQuery, window.document);
    }


})(function(global, $, doc) {

    "use strict";

    var UI = {}, _UI = global.UIkit ? Object.create(global.UIkit) : undefined;

    UI.version = '2.24.3';

    UI.noConflict = function() {
        // restore UIkit version
        if (_UI) {
            global.UIkit = _UI;
            $.UIkit      = _UI;
            $.fn.uk      = _UI.fn;
        }

        return UI;
    };

    UI.prefix = function(str) {
        return str;
    };

    // cache jQuery
    UI.$ = $;

    UI.$doc  = UI.$(document);
    UI.$win  = UI.$(window);
    UI.$html = UI.$('html');

    UI.support = {};
    UI.support.transition = (function() {

        var transitionEnd = (function() {

            var element = doc.body || doc.documentElement,
                transEndEventNames = {
                    WebkitTransition : 'webkitTransitionEnd',
                    MozTransition    : 'transitionend',
                    OTransition      : 'oTransitionEnd otransitionend',
                    transition       : 'transitionend'
                }, name;

            for (name in transEndEventNames) {
                if (element.style[name] !== undefined) return transEndEventNames[name];
            }
        }());

        return transitionEnd && { end: transitionEnd };
    })();

    UI.support.animation = (function() {

        var animationEnd = (function() {

            var element = doc.body || doc.documentElement,
                animEndEventNames = {
                    WebkitAnimation : 'webkitAnimationEnd',
                    MozAnimation    : 'animationend',
                    OAnimation      : 'oAnimationEnd oanimationend',
                    animation       : 'animationend'
                }, name;

            for (name in animEndEventNames) {
                if (element.style[name] !== undefined) return animEndEventNames[name];
            }
        }());

        return animationEnd && { end: animationEnd };
    })();

    // requestAnimationFrame polyfill
    //https://github.com/darius/requestAnimationFrame
    (function() {

        Date.now = Date.now || function() { return new Date().getTime(); };

        var vendors = ['webkit', 'moz'];
        for (var i = 0; i < vendors.length && !window.requestAnimationFrame; ++i) {
            var vp = vendors[i];
            window.requestAnimationFrame = window[vp+'RequestAnimationFrame'];
            window.cancelAnimationFrame = (window[vp+'CancelAnimationFrame']
                                       || window[vp+'CancelRequestAnimationFrame']);
        }
        if (/iP(ad|hone|od).*OS 6/.test(window.navigator.userAgent) // iOS6 is buggy
            || !window.requestAnimationFrame || !window.cancelAnimationFrame) {
            var lastTime = 0;
            window.requestAnimationFrame = function(callback) {
                var now = Date.now();
                var nextTime = Math.max(lastTime + 16, now);
                return setTimeout(function() { callback(lastTime = nextTime); },
                                  nextTime - now);
            };
            window.cancelAnimationFrame = clearTimeout;
        }
    }());

    UI.support.touch = (
        ('ontouchstart' in document) ||
        (global.DocumentTouch && document instanceof global.DocumentTouch)  ||
        (global.navigator.msPointerEnabled && global.navigator.msMaxTouchPoints > 0) || //IE 10
        (global.navigator.pointerEnabled && global.navigator.maxTouchPoints > 0) || //IE >=11
        false
    );

    UI.support.mutationobserver = (global.MutationObserver || global.WebKitMutationObserver || null);

    UI.Utils = {};

    UI.Utils.isFullscreen = function() {
        return document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement || document.fullscreenElement || false;
    };

    UI.Utils.str2json = function(str, notevil) {
        try {
            if (notevil) {
                return JSON.parse(str
                    // wrap keys without quote with valid double quote
                    .replace(/([\$\w]+)\s*:/g, function(_, $1){return '"'+$1+'":';})
                    // replacing single quote wrapped ones to double quote
                    .replace(/'([^']+)'/g, function(_, $1){return '"'+$1+'"';})
                );
            } else {
                return (new Function("", "var json = " + str + "; return JSON.parse(JSON.stringify(json));"))();
            }
        } catch(e) { return false; }
    };

    UI.Utils.debounce = function(func, wait, immediate) {
        var timeout;
        return function() {
            var context = this, args = arguments;
            var later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    };

    UI.Utils.removeCssRules = function(selectorRegEx) {
        var idx, idxs, stylesheet, _i, _j, _k, _len, _len1, _len2, _ref;

        if(!selectorRegEx) return;

        setTimeout(function(){
            try {
              _ref = document.styleSheets;
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                stylesheet = _ref[_i];
                idxs = [];
                stylesheet.cssRules = stylesheet.cssRules;
                for (idx = _j = 0, _len1 = stylesheet.cssRules.length; _j < _len1; idx = ++_j) {
                  if (stylesheet.cssRules[idx].type === CSSRule.STYLE_RULE && selectorRegEx.test(stylesheet.cssRules[idx].selectorText)) {
                    idxs.unshift(idx);
                  }
                }
                for (_k = 0, _len2 = idxs.length; _k < _len2; _k++) {
                  stylesheet.deleteRule(idxs[_k]);
                }
              }
            } catch (_error) {}
        }, 0);
    };

    UI.Utils.isInView = function(element, options) {

        var $element = $(element);

        if (!$element.is(':visible')) {
            return false;
        }

        var window_left = UI.$win.scrollLeft(), window_top = UI.$win.scrollTop(), offset = $element.offset(), left = offset.left, top = offset.top;

        options = $.extend({topoffset:0, leftoffset:0}, options);

        if (top + $element.height() >= window_top && top - options.topoffset <= window_top + UI.$win.height() &&
            left + $element.width() >= window_left && left - options.leftoffset <= window_left + UI.$win.width()) {
          return true;
        } else {
          return false;
        }
    };

    UI.Utils.checkDisplay = function(context, initanimation) {

        var elements = UI.$('[data-uk-margin], [data-uk-grid-match], [data-uk-grid-margin], [data-uk-check-display]', context || document), animated;

        if (context && !elements.length) {
            elements = $(context);
        }

        elements.trigger('display.uk.check');

        // fix firefox / IE animations
        if (initanimation) {

            if (typeof(initanimation)!='string') {
                initanimation = '[class*="uk-animation-"]';
            }

            elements.find(initanimation).each(function(){

                var ele  = UI.$(this),
                    cls  = ele.attr('class'),
                    anim = cls.match(/uk\-animation\-(.+)/);

                ele.removeClass(anim[0]).width();

                ele.addClass(anim[0]);
            });
        }

        return elements;
    };

    UI.Utils.options = function(string) {

        if ($.type(string)!='string') return string;

        if (string.indexOf(':') != -1 && string.trim().substr(-1) != '}') {
            string = '{'+string+'}';
        }

        var start = (string ? string.indexOf("{") : -1), options = {};

        if (start != -1) {
            try {
                options = UI.Utils.str2json(string.substr(start));
            } catch (e) {}
        }

        return options;
    };

    UI.Utils.animate = function(element, cls) {

        var d = $.Deferred();

        element = UI.$(element);
        cls     = cls;

        element.css('display', 'none').addClass(cls).one(UI.support.animation.end, function() {
            element.removeClass(cls);
            d.resolve();
        }).width();

        element.css('display', '');

        return d.promise();
    };

    UI.Utils.uid = function(prefix) {
        return (prefix || 'id') + (new Date().getTime())+"RAND"+(Math.ceil(Math.random() * 100000));
    };

    UI.Utils.template = function(str, data) {

        var tokens = str.replace(/\n/g, '\\n').replace(/\{\{\{\s*(.+?)\s*\}\}\}/g, "{{!$1}}").split(/(\{\{\s*(.+?)\s*\}\})/g),
            i=0, toc, cmd, prop, val, fn, output = [], openblocks = 0;

        while(i < tokens.length) {

            toc = tokens[i];

            if(toc.match(/\{\{\s*(.+?)\s*\}\}/)) {
                i = i + 1;
                toc  = tokens[i];
                cmd  = toc[0];
                prop = toc.substring(toc.match(/^(\^|\#|\!|\~|\:)/) ? 1:0);

                switch(cmd) {
                    case '~':
                        output.push("for(var $i=0;$i<"+prop+".length;$i++) { var $item = "+prop+"[$i];");
                        openblocks++;
                        break;
                    case ':':
                        output.push("for(var $key in "+prop+") { var $val = "+prop+"[$key];");
                        openblocks++;
                        break;
                    case '#':
                        output.push("if("+prop+") {");
                        openblocks++;
                        break;
                    case '^':
                        output.push("if(!"+prop+") {");
                        openblocks++;
                        break;
                    case '/':
                        output.push("}");
                        openblocks--;
                        break;
                    case '!':
                        output.push("__ret.push("+prop+");");
                        break;
                    default:
                        output.push("__ret.push(escape("+prop+"));");
                        break;
                }
            } else {
                output.push("__ret.push('"+toc.replace(/\'/g, "\\'")+"');");
            }
            i = i + 1;
        }

        fn  = new Function('$data', [
            'var __ret = [];',
            'try {',
            'with($data){', (!openblocks ? output.join('') : '__ret = ["Not all blocks are closed correctly."]'), '};',
            '}catch(e){__ret = [e.message];}',
            'return __ret.join("").replace(/\\n\\n/g, "\\n");',
            "function escape(html) { return String(html).replace(/&/g, '&amp;').replace(/\"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');}"
        ].join("\n"));

        return data ? fn(data) : fn;
    };

    UI.Utils.events       = {};
    UI.Utils.events.click = UI.support.touch ? 'tap' : 'click';

    global.UIkit = UI;

    // deprecated

    UI.fn = function(command, options) {

        var args = arguments, cmd = command.match(/^([a-z\-]+)(?:\.([a-z]+))?/i), component = cmd[1], method = cmd[2];

        if (!UI[component]) {
            $.error("UIkit component [" + component + "] does not exist.");
            return this;
        }

        return this.each(function() {
            var $this = $(this), data = $this.data(component);
            if (!data) $this.data(component, (data = UI[component](this, method ? undefined : options)));
            if (method) data[method].apply(data, Array.prototype.slice.call(args, 1));
        });
    };

    $.UIkit          = UI;
    $.fn.uk          = UI.fn;

    UI.langdirection = UI.$html.attr("dir") == "rtl" ? "right" : "left";

    UI.components    = {};

    UI.component = function(name, def) {

        var fn = function(element, options) {

            var $this = this;

            this.UIkit   = UI;
            this.element = element ? UI.$(element) : null;
            this.options = $.extend(true, {}, this.defaults, options);
            this.plugins = {};

            if (this.element) {
                this.element.data(name, this);
            }

            this.init();

            (this.options.plugins.length ? this.options.plugins : Object.keys(fn.plugins)).forEach(function(plugin) {

                if (fn.plugins[plugin].init) {
                    fn.plugins[plugin].init($this);
                    $this.plugins[plugin] = true;
                }

            });

            this.trigger('init.uk.component', [name, this]);

            return this;
        };

        fn.plugins = {};

        $.extend(true, fn.prototype, {

            defaults : {plugins: []},

            boot: function(){},
            init: function(){},

            on: function(a1,a2,a3){
                return UI.$(this.element || this).on(a1,a2,a3);
            },

            one: function(a1,a2,a3){
                return UI.$(this.element || this).one(a1,a2,a3);
            },

            off: function(evt){
                return UI.$(this.element || this).off(evt);
            },

            trigger: function(evt, params) {
                return UI.$(this.element || this).trigger(evt, params);
            },

            find: function(selector) {
                return UI.$(this.element ? this.element: []).find(selector);
            },

            proxy: function(obj, methods) {

                var $this = this;

                methods.split(' ').forEach(function(method) {
                    if (!$this[method]) $this[method] = function() { return obj[method].apply(obj, arguments); };
                });
            },

            mixin: function(obj, methods) {

                var $this = this;

                methods.split(' ').forEach(function(method) {
                    if (!$this[method]) $this[method] = obj[method].bind($this);
                });
            },

            option: function() {

                if (arguments.length == 1) {
                    return this.options[arguments[0]] || undefined;
                } else if (arguments.length == 2) {
                    this.options[arguments[0]] = arguments[1];
                }
            }

        }, def);

        this.components[name] = fn;

        this[name] = function() {

            var element, options;

            if (arguments.length) {

                switch(arguments.length) {
                    case 1:

                        if (typeof arguments[0] === "string" || arguments[0].nodeType || arguments[0] instanceof jQuery) {
                            element = $(arguments[0]);
                        } else {
                            options = arguments[0];
                        }

                        break;
                    case 2:

                        element = $(arguments[0]);
                        options = arguments[1];
                        break;
                }
            }

            if (element && element.data(name)) {
                return element.data(name);
            }

            return (new UI.components[name](element, options));
        };

        if (UI.domready) {
            UI.component.boot(name);
        }

        return fn;
    };

    UI.plugin = function(component, name, def) {
        this.components[component].plugins[name] = def;
    };

    UI.component.boot = function(name) {

        if (UI.components[name].prototype && UI.components[name].prototype.boot && !UI.components[name].booted) {
            UI.components[name].prototype.boot.apply(UI, []);
            UI.components[name].booted = true;
        }
    };

    UI.component.bootComponents = function() {

        for (var component in UI.components) {
            UI.component.boot(component);
        }
    };


    // DOM mutation save ready helper function

    UI.domObservers = [];
    UI.domready     = false;

    UI.ready = function(fn) {

        UI.domObservers.push(fn);

        if (UI.domready) {
            fn(document);
        }
    };

    UI.on = function(a1,a2,a3){

        if (a1 && a1.indexOf('ready.uk.dom') > -1 && UI.domready) {
            a2.apply(UI.$doc);
        }

        return UI.$doc.on(a1,a2,a3);
    };

    UI.one = function(a1,a2,a3){

        if (a1 && a1.indexOf('ready.uk.dom') > -1 && UI.domready) {
            a2.apply(UI.$doc);
            return UI.$doc;
        }

        return UI.$doc.one(a1,a2,a3);
    };

    UI.trigger = function(evt, params) {
        return UI.$doc.trigger(evt, params);
    };

    UI.domObserve = function(selector, fn) {

        if(!UI.support.mutationobserver) return;

        fn = fn || function() {};

        UI.$(selector).each(function() {

            var element  = this,
                $element = UI.$(element);

            if ($element.data('observer')) {
                return;
            }

            try {

                var observer = new UI.support.mutationobserver(UI.Utils.debounce(function(mutations) {
                    fn.apply(element, []);
                    $element.trigger('changed.uk.dom');
                }, 50));

                // pass in the target node, as well as the observer options
                observer.observe(element, { childList: true, subtree: true });

                $element.data('observer', observer);

            } catch(e) {}
        });
    };

    UI.init = function(root) {

        root = root || document;

        UI.domObservers.forEach(function(fn){
            fn(root);
        });
    };

    UI.on('domready.uk.dom', function(){

        UI.init();

        if (UI.domready) UI.Utils.checkDisplay();
    });

    document.addEventListener('DOMContentLoaded', function(){

        var domReady = function() {

            UI.$body = UI.$('body');

            UI.ready(function(context){
                UI.domObserve('[data-uk-observe]');
            });

            UI.on('changed.uk.dom', function(e) {
                UI.init(e.target);
                UI.Utils.checkDisplay(e.target);
            });

            UI.trigger('beforeready.uk.dom');

            UI.component.bootComponents();

            // custom scroll observer
            requestAnimationFrame((function(){

                var memory = {x: window.pageXOffset, y:window.pageYOffset}, dir;

                var fn = function(){

                    if (memory.x != window.pageXOffset || memory.y != window.pageYOffset) {

                        dir = {x: 0 , y: 0};

                        if (window.pageXOffset != memory.x) dir.x = window.pageXOffset > memory.x ? 1:-1;
                        if (window.pageYOffset != memory.y) dir.y = window.pageYOffset > memory.y ? 1:-1;

                        memory = {
                            "dir": dir, "x": window.pageXOffset, "y": window.pageYOffset
                        };

                        UI.$doc.trigger('scrolling.uk.document', [memory]);
                    }

                    requestAnimationFrame(fn);
                };

                if (UI.support.touch) {
                    UI.$html.on('touchmove touchend MSPointerMove MSPointerUp pointermove pointerup', fn);
                }

                if (memory.x || memory.y) fn();

                return fn;

            })());

            // run component init functions on dom
            UI.trigger('domready.uk.dom');

            if (UI.support.touch) {

                // remove css hover rules for touch devices
                // UI.Utils.removeCssRules(/\.uk-(?!navbar).*:hover/);

                // viewport unit fix for uk-height-viewport - should be fixed in iOS 8
                if (navigator.userAgent.match(/(iPad|iPhone|iPod)/g)) {

                    UI.$win.on('load orientationchange resize', UI.Utils.debounce((function(){

                        var fn = function() {
                            $('.uk-height-viewport').css('height', window.innerHeight);
                            return fn;
                        };

                        return fn();

                    })(), 100));
                }
            }

            UI.trigger('afterready.uk.dom');

            // mark that domready is left behind
            UI.domready = true;
        };

        if (document.readyState == 'complete' || document.readyState == 'interactive') {
            setTimeout(domReady);
        }

        return domReady;

    }());

    // add touch identifier class
    UI.$html.addClass(UI.support.touch ? "uk-touch" : "uk-notouch");

    // add uk-hover class on tap to support overlays on touch devices
    if (UI.support.touch) {

        var hoverset = false,
            exclude,
            hovercls = 'uk-hover',
            selector = '.uk-overlay, .uk-overlay-hover, .uk-overlay-toggle, .uk-animation-hover, .uk-has-hover';

        UI.$html.on('mouseenter touchstart MSPointerDown pointerdown', selector, function() {

            if (hoverset) $('.'+hovercls).removeClass(hovercls);

            hoverset = $(this).addClass(hovercls);

        }).on('mouseleave touchend MSPointerUp pointerup', function(e) {

            exclude = $(e.target).parents(selector);

            if (hoverset) {
                hoverset.not(exclude).removeClass(hovercls);
            }
        });
    }

    return UI;
});

//  Based on Zeptos touch.js
//  https://raw.github.com/madrobby/zepto/master/src/touch.js
//  Zepto.js may be freely distributed under the MIT license.

;(function($){

  if ($.fn.swipeLeft) {
    return;
  }


  var touch = {}, touchTimeout, tapTimeout, swipeTimeout, longTapTimeout, longTapDelay = 750, gesture;

  function swipeDirection(x1, x2, y1, y2) {
    return Math.abs(x1 - x2) >= Math.abs(y1 - y2) ? (x1 - x2 > 0 ? 'Left' : 'Right') : (y1 - y2 > 0 ? 'Up' : 'Down');
  }

  function longTap() {
    longTapTimeout = null;
    if (touch.last) {
      if ( touch.el !== undefined ) touch.el.trigger('longTap');
      touch = {};
    }
  }

  function cancelLongTap() {
    if (longTapTimeout) clearTimeout(longTapTimeout);
    longTapTimeout = null;
  }

  function cancelAll() {
    if (touchTimeout)   clearTimeout(touchTimeout);
    if (tapTimeout)     clearTimeout(tapTimeout);
    if (swipeTimeout)   clearTimeout(swipeTimeout);
    if (longTapTimeout) clearTimeout(longTapTimeout);
    touchTimeout = tapTimeout = swipeTimeout = longTapTimeout = null;
    touch = {};
  }

  function isPrimaryTouch(event){
    return event.pointerType == event.MSPOINTER_TYPE_TOUCH && event.isPrimary;
  }

  $(function(){
    var now, delta, deltaX = 0, deltaY = 0, firstTouch;

    if ('MSGesture' in window) {
      gesture = new MSGesture();
      gesture.target = document.body;
    }

    $(document)
      .on('MSGestureEnd gestureend', function(e){

        var swipeDirectionFromVelocity = e.originalEvent.velocityX > 1 ? 'Right' : e.originalEvent.velocityX < -1 ? 'Left' : e.originalEvent.velocityY > 1 ? 'Down' : e.originalEvent.velocityY < -1 ? 'Up' : null;

        if (swipeDirectionFromVelocity && touch.el !== undefined) {
          touch.el.trigger('swipe');
          touch.el.trigger('swipe'+ swipeDirectionFromVelocity);
        }
      })
      // MSPointerDown: for IE10
      // pointerdown: for IE11
      .on('touchstart MSPointerDown pointerdown', function(e){

        if(e.type == 'MSPointerDown' && !isPrimaryTouch(e.originalEvent)) return;

        firstTouch = (e.type == 'MSPointerDown' || e.type == 'pointerdown') ? e : e.originalEvent.touches[0];

        now      = Date.now();
        delta    = now - (touch.last || now);
        touch.el = $('tagName' in firstTouch.target ? firstTouch.target : firstTouch.target.parentNode);

        if(touchTimeout) clearTimeout(touchTimeout);

        touch.x1 = firstTouch.pageX;
        touch.y1 = firstTouch.pageY;

        if (delta > 0 && delta <= 250) touch.isDoubleTap = true;

        touch.last = now;
        longTapTimeout = setTimeout(longTap, longTapDelay);

        // adds the current touch contact for IE gesture recognition
        if (gesture && ( e.type == 'MSPointerDown' || e.type == 'pointerdown' || e.type == 'touchstart' ) ) {
          gesture.addPointer(e.originalEvent.pointerId);
        }

      })
      // MSPointerMove: for IE10
      // pointermove: for IE11
      .on('touchmove MSPointerMove pointermove', function(e){

        if (e.type == 'MSPointerMove' && !isPrimaryTouch(e.originalEvent)) return;

        firstTouch = (e.type == 'MSPointerMove' || e.type == 'pointermove') ? e : e.originalEvent.touches[0];

        cancelLongTap();
        touch.x2 = firstTouch.pageX;
        touch.y2 = firstTouch.pageY;

        deltaX += Math.abs(touch.x1 - touch.x2);
        deltaY += Math.abs(touch.y1 - touch.y2);
      })
      // MSPointerUp: for IE10
      // pointerup: for IE11
      .on('touchend MSPointerUp pointerup', function(e){

        if (e.type == 'MSPointerUp' && !isPrimaryTouch(e.originalEvent)) return;

        cancelLongTap();

        // swipe
        if ((touch.x2 && Math.abs(touch.x1 - touch.x2) > 30) || (touch.y2 && Math.abs(touch.y1 - touch.y2) > 30)){

          swipeTimeout = setTimeout(function() {
            if ( touch.el !== undefined ) {
              touch.el.trigger('swipe');
              touch.el.trigger('swipe' + (swipeDirection(touch.x1, touch.x2, touch.y1, touch.y2)));
            }
            touch = {};
          }, 0);

        // normal tap
        } else if ('last' in touch) {

          // don't fire tap when delta position changed by more than 30 pixels,
          // for instance when moving to a point and back to origin
          if (isNaN(deltaX) || (deltaX < 30 && deltaY < 30)) {
            // delay by one tick so we can cancel the 'tap' event if 'scroll' fires
            // ('tap' fires before 'scroll')
            tapTimeout = setTimeout(function() {

              // trigger universal 'tap' with the option to cancelTouch()
              // (cancelTouch cancels processing of single vs double taps for faster 'tap' response)
              var event = $.Event('tap');
              event.cancelTouch = cancelAll;
              if ( touch.el !== undefined ) touch.el.trigger(event);

              // trigger double tap immediately
              if (touch.isDoubleTap) {
                if ( touch.el !== undefined ) touch.el.trigger('doubleTap');
                touch = {};
              }

              // trigger single tap after 250ms of inactivity
              else {
                touchTimeout = setTimeout(function(){
                  touchTimeout = null;
                  if ( touch.el !== undefined ) touch.el.trigger('singleTap');
                  touch = {};
                }, 250);
              }
            }, 0);
          } else {
            touch = {};
          }
          deltaX = deltaY = 0;
        }
      })
      // when the browser window loses focus,
      // for example when a modal dialog is shown,
      // cancel all ongoing events
      .on('touchcancel MSPointerCancel', cancelAll);

    // scrolling the window indicates intention of the user
    // to scroll, not tap or swipe, so cancel all ongoing events
    $(window).on('scroll', cancelAll);
  });

  ['swipe', 'swipeLeft', 'swipeRight', 'swipeUp', 'swipeDown', 'doubleTap', 'tap', 'singleTap', 'longTap'].forEach(function(eventName){
    $.fn[eventName] = function(callback){ return $(this).on(eventName, callback); };
  });
})(jQuery);

(function(UI) {

    "use strict";

    var stacks = [];

    UI.component('stackMargin', {

        defaults: {
            cls: 'uk-margin-small-top',
            rowfirst: false
        },

        boot: function() {

            // init code
            UI.ready(function(context) {

                UI.$("[data-uk-margin]", context).each(function() {

                    var ele = UI.$(this), obj;

                    if (!ele.data("stackMargin")) {
                        obj = UI.stackMargin(ele, UI.Utils.options(ele.attr("data-uk-margin")));
                    }
                });
            });
        },

        init: function() {

            var $this = this;

            this.columns = [];

            UI.$win.on('resize orientationchange', (function() {

                var fn = function() {
                    $this.process();
                };

                UI.$(function() {
                    fn();
                    UI.$win.on("load", fn);
                });

                return UI.Utils.debounce(fn, 20);
            })());

            UI.$html.on("changed.uk.dom", function(e) {
                $this.process();
            });

            this.on("display.uk.check", function(e) {
                if (this.element.is(":visible")) this.process();
            }.bind(this));

            stacks.push(this);
        },

        process: function() {

            var $this = this;

            this.columns = this.element.children();

            UI.Utils.stackMargin(this.columns, this.options);

            if (!this.options.rowfirst) {
                return this;
            }

            // Mark first column elements
            var pos_cache = this.columns.removeClass(this.options.rowfirst).filter(':visible').first().position();

            if (pos_cache) {
                this.columns.each(function() {
                    UI.$(this)[UI.$(this).position().left == pos_cache.left ? 'addClass':'removeClass']($this.options.rowfirst);
                });
            }

            return this;
        },

        revert: function() {
            this.columns.removeClass(this.options.cls);
            return this;
        }
    });


    // responsive element e.g. iframes

    (function(){

        var elements = [], check = function(ele) {

            if (!ele.is(':visible')) return;

            var width  = ele.parent().width(),
                iwidth = ele.data('width'),
                ratio  = (width / iwidth),
                height = Math.floor(ratio * ele.data('height'));

            ele.css({'height': (width < iwidth) ? height : ele.data('height')});
        };

        UI.component('responsiveElement', {

            defaults: {},

            boot: function() {

                // init code
                UI.ready(function(context) {

                    UI.$("iframe.uk-responsive-width, [data-uk-responsive]", context).each(function() {

                        var ele = UI.$(this), obj;

                        if (!ele.data("responsiveIframe")) {
                            obj = UI.responsiveElement(ele, {});
                        }
                    });
                });
            },

            init: function() {

                var ele = this.element;

                if (ele.attr('width') && ele.attr('height')) {

                    ele.data({

                        'width' : ele.attr('width'),
                        'height': ele.attr('height')

                    }).on('display.uk.check', function(){
                        check(ele);
                    });

                    check(ele);

                    elements.push(ele);
                }
            }
        });

        UI.$win.on('resize load', UI.Utils.debounce(function(){

            elements.forEach(function(ele){
                check(ele);
            });

        }, 15));

    })();



    // helper

    UI.Utils.stackMargin = function(elements, options) {

        options = UI.$.extend({
            'cls': 'uk-margin-small-top'
        }, options);

        options.cls = options.cls;

        elements = UI.$(elements).removeClass(options.cls);

        var skip         = false,
            firstvisible = elements.filter(":visible:first"),
            offset       = firstvisible.length ? (firstvisible.position().top + firstvisible.outerHeight()) - 1 : false; // (-1): weird firefox bug when parent container is display:flex

        if (offset === false || elements.length == 1) return;

        elements.each(function() {

            var column = UI.$(this);

            if (column.is(":visible")) {

                if (skip) {
                    column.addClass(options.cls);
                } else {

                    if (column.position().top >= offset) {
                        skip = column.addClass(options.cls);
                    }
                }
            }
        });
    };

    UI.Utils.matchHeights = function(elements, options) {

        elements = UI.$(elements).css('min-height', '');
        options  = UI.$.extend({ row : true }, options);

        var matchHeights = function(group){

            if (group.length < 2) return;

            var max = 0;

            group.each(function() {
                max = Math.max(max, UI.$(this).outerHeight());
            }).each(function() {

                var element = UI.$(this),
                    height  = max - (element.css('box-sizing') == 'border-box' ? 0 : (element.outerHeight() - element.height()));

                element.css('min-height', height + 'px');
            });
        };

        if (options.row) {

            elements.first().width(); // force redraw

            setTimeout(function(){

                var lastoffset = false, group = [];

                elements.each(function() {

                    var ele = UI.$(this), offset = ele.offset().top;

                    if (offset != lastoffset && group.length) {

                        matchHeights(UI.$(group));
                        group  = [];
                        offset = ele.offset().top;
                    }

                    group.push(ele);
                    lastoffset = offset;
                });

                if (group.length) {
                    matchHeights(UI.$(group));
                }

            }, 0);

        } else {
            matchHeights(elements);
        }
    };

    (function(cacheSvgs){

        UI.Utils.inlineSvg = function(selector, root) {

            var images = UI.$(selector || 'img[src$=".svg"]', root || document).each(function(){

                var img = UI.$(this),
                    src = img.attr('src');

                if (!cacheSvgs[src]) {

                    var d = UI.$.Deferred();

                    UI.$.get(src, {nc: Math.random()}, function(data){
                        d.resolve(UI.$(data).find('svg'));
                    });

                    cacheSvgs[src] = d.promise();
                }

                cacheSvgs[src].then(function(svg) {

                    var $svg = UI.$(svg).clone();

                    if (img.attr('id')) $svg.attr('id', img.attr('id'));
                    if (img.attr('class')) $svg.attr('class', img.attr('class'));
                    if (img.attr('style')) $svg.attr('style', img.attr('style'));

                    if (img.attr('width')) {
                        $svg.attr('width', img.attr('width'));
                        if (!img.attr('height'))  $svg.removeAttr('height');
                    }

                    if (img.attr('height')){
                        $svg.attr('height', img.attr('height'));
                        if (!img.attr('width')) $svg.removeAttr('width');
                    }

                    img.replaceWith($svg);
                });
            });
        };

        // init code
        UI.ready(function(context) {
            UI.Utils.inlineSvg('[data-uk-svg]', context);
        });

    })({});

})(UIkit);

(function(UI) {

    "use strict";

    UI.component('smoothScroll', {

        boot: function() {

            // init code
            UI.$html.on("click.smooth-scroll.uikit", "[data-uk-smooth-scroll]", function(e) {
                var ele = UI.$(this);

                if (!ele.data("smoothScroll")) {
                    var obj = UI.smoothScroll(ele, UI.Utils.options(ele.attr("data-uk-smooth-scroll")));
                    ele.trigger("click");
                }

                return false;
            });
        },

        init: function() {

            var $this = this;

            this.on("click", function(e) {
                e.preventDefault();
                scrollToElement(UI.$(this.hash).length ? UI.$(this.hash) : UI.$("body"), $this.options);
            });
        }
    });

    function scrollToElement(ele, options) {

        options = UI.$.extend({
            duration: 1000,
            transition: 'easeOutExpo',
            offset: 0,
            complete: function(){}
        }, options);

        // get / set parameters
        var target    = ele.offset().top - options.offset,
            docheight = UI.$doc.height(),
            winheight = window.innerHeight;

        if ((target + winheight) > docheight) {
            target = docheight - winheight;
        }

        // animate to target, fire callback when done
        UI.$("html,body").stop().animate({scrollTop: target}, options.duration, options.transition).promise().done(options.complete);
    }

    UI.Utils.scrollToElement = scrollToElement;

    if (!UI.$.easing.easeOutExpo) {
        UI.$.easing.easeOutExpo = function(x, t, b, c, d) { return (t == d) ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b; };
    }

})(UIkit);

(function(UI) {

    "use strict";

    var $win           = UI.$win,
        $doc           = UI.$doc,
        scrollspies    = [],
        checkScrollSpy = function() {
            for(var i=0; i < scrollspies.length; i++) {
                window.requestAnimationFrame.apply(window, [scrollspies[i].check]);
            }
        };

    UI.component('scrollspy', {

        defaults: {
            "target"     : false,
            "cls"        : "uk-scrollspy-inview",
            "initcls"    : "uk-scrollspy-init-inview",
            "topoffset"  : 0,
            "leftoffset" : 0,
            "repeat"     : false,
            "delay"      : 0
        },

        boot: function() {

            // listen to scroll and resize
            $doc.on("scrolling.uk.document", checkScrollSpy);
            $win.on("load resize orientationchange", UI.Utils.debounce(checkScrollSpy, 50));

            // init code
            UI.ready(function(context) {

                UI.$("[data-uk-scrollspy]", context).each(function() {

                    var element = UI.$(this);

                    if (!element.data("scrollspy")) {
                        var obj = UI.scrollspy(element, UI.Utils.options(element.attr("data-uk-scrollspy")));
                    }
                });
            });
        },

        init: function() {

            var $this = this, inviewstate, initinview, togglecls = this.options.cls.split(/,/), fn = function(){

                var elements     = $this.options.target ? $this.element.find($this.options.target) : $this.element,
                    delayIdx     = elements.length === 1 ? 1 : 0,
                    toggleclsIdx = 0;

                elements.each(function(idx){

                    var element     = UI.$(this),
                        inviewstate = element.data('inviewstate'),
                        inview      = UI.Utils.isInView(element, $this.options),
                        toggle      = element.data('ukScrollspyCls') || togglecls[toggleclsIdx].trim();

                    if (inview && !inviewstate && !element.data('scrollspy-idle')) {

                        if (!initinview) {
                            element.addClass($this.options.initcls);
                            $this.offset = element.offset();
                            initinview = true;

                            element.trigger("init.uk.scrollspy");
                        }

                        element.data('scrollspy-idle', setTimeout(function(){

                            element.addClass("uk-scrollspy-inview").toggleClass(toggle).width();
                            element.trigger("inview.uk.scrollspy");

                            element.data('scrollspy-idle', false);
                            element.data('inviewstate', true);

                        }, $this.options.delay * delayIdx));

                        delayIdx++;
                    }

                    if (!inview && inviewstate && $this.options.repeat) {

                        if (element.data('scrollspy-idle')) {
                            clearTimeout(element.data('scrollspy-idle'));
                        }

                        element.removeClass("uk-scrollspy-inview").toggleClass(toggle);
                        element.data('inviewstate', false);

                        element.trigger("outview.uk.scrollspy");
                    }

                    toggleclsIdx = togglecls[toggleclsIdx + 1] ? (toggleclsIdx + 1) : 0;

                });
            };

            fn();

            this.check = fn;

            scrollspies.push(this);
        }
    });


    var scrollspynavs = [],
        checkScrollSpyNavs = function() {
            for(var i=0; i < scrollspynavs.length; i++) {
                window.requestAnimationFrame.apply(window, [scrollspynavs[i].check]);
            }
        };

    UI.component('scrollspynav', {

        defaults: {
            "cls"          : 'uk-active',
            "closest"      : false,
            "topoffset"    : 0,
            "leftoffset"   : 0,
            "smoothscroll" : false
        },

        boot: function() {

            // listen to scroll and resize
            $doc.on("scrolling.uk.document", checkScrollSpyNavs);
            $win.on("resize orientationchange", UI.Utils.debounce(checkScrollSpyNavs, 50));

            // init code
            UI.ready(function(context) {

                UI.$("[data-uk-scrollspy-nav]", context).each(function() {

                    var element = UI.$(this);

                    if (!element.data("scrollspynav")) {
                        var obj = UI.scrollspynav(element, UI.Utils.options(element.attr("data-uk-scrollspy-nav")));
                    }
                });
            });
        },

        init: function() {

            var ids     = [],
                links   = this.find("a[href^='#']").each(function(){ if(this.getAttribute("href").trim()!=='#') ids.push(this.getAttribute("href")); }),
                targets = UI.$(ids.join(",")),

                clsActive  = this.options.cls,
                clsClosest = this.options.closest || this.options.closest;

            var $this = this, inviews, fn = function(){

                inviews = [];

                for (var i=0 ; i < targets.length ; i++) {
                    if (UI.Utils.isInView(targets.eq(i), $this.options)) {
                        inviews.push(targets.eq(i));
                    }
                }

                if (inviews.length) {

                    var navitems,
                        scrollTop = $win.scrollTop(),
                        target = (function(){
                            for(var i=0; i< inviews.length;i++){
                                if(inviews[i].offset().top >= scrollTop){
                                    return inviews[i];
                                }
                            }
                        })();

                    if (!target) return;

                    if ($this.options.closest) {
                        links.blur().closest(clsClosest).removeClass(clsActive);
                        navitems = links.filter("a[href='#"+target.attr("id")+"']").closest(clsClosest).addClass(clsActive);
                    } else {
                        navitems = links.removeClass(clsActive).filter("a[href='#"+target.attr("id")+"']").addClass(clsActive);
                    }

                    $this.element.trigger("inview.uk.scrollspynav", [target, navitems]);
                }
            };

            if (this.options.smoothscroll && UI.smoothScroll) {
                links.each(function(){
                    UI.smoothScroll(this, $this.options.smoothscroll);
                });
            }

            fn();

            this.element.data("scrollspynav", this);

            this.check = fn;
            scrollspynavs.push(this);

        }
    });

})(UIkit);

(function(UI){

    "use strict";

    var toggles = [];

    UI.component('toggle', {

        defaults: {
            target    : false,
            cls       : 'uk-hidden',
            animation : false,
            duration  : 200
        },

        boot: function(){

            // init code
            UI.ready(function(context) {

                UI.$("[data-uk-toggle]", context).each(function() {
                    var ele = UI.$(this);

                    if (!ele.data("toggle")) {
                        var obj = UI.toggle(ele, UI.Utils.options(ele.attr("data-uk-toggle")));
                    }
                });

                setTimeout(function(){

                    toggles.forEach(function(toggle){
                        toggle.getToggles();
                    });

                }, 0);
            });
        },

        init: function() {

            var $this = this;

            this.aria = (this.options.cls.indexOf('uk-hidden') !== -1);

            this.getToggles();

            this.on("click", function(e) {
                if ($this.element.is('a[href="#"]')) e.preventDefault();
                $this.toggle();
            });

            toggles.push(this);
        },

        toggle: function() {

            if(!this.totoggle.length) return;

            if (this.options.animation && UI.support.animation) {

                var $this = this, animations = this.options.animation.split(',');

                if (animations.length == 1) {
                    animations[1] = animations[0];
                }

                animations[0] = animations[0].trim();
                animations[1] = animations[1].trim();

                this.totoggle.css('animation-duration', this.options.duration+'ms');

                this.totoggle.each(function(){

                    var ele = UI.$(this);

                    if (ele.hasClass($this.options.cls)) {

                        ele.toggleClass($this.options.cls);

                        UI.Utils.animate(ele, animations[0]).then(function(){
                            ele.css('animation-duration', '');
                            UI.Utils.checkDisplay(ele);
                        });

                    } else {

                        UI.Utils.animate(this, animations[1]+' uk-animation-reverse').then(function(){
                            ele.toggleClass($this.options.cls).css('animation-duration', '');
                            UI.Utils.checkDisplay(ele);
                        });

                    }

                });

            } else {
                this.totoggle.toggleClass(this.options.cls);
                UI.Utils.checkDisplay(this.totoggle);
            }

            this.updateAria();

        },

        getToggles: function() {
            this.totoggle = this.options.target ? UI.$(this.options.target):[];
            this.updateAria();
        },

        updateAria: function() {
            if (this.aria && this.totoggle.length) {
                this.totoggle.each(function(){
                    UI.$(this).attr('aria-hidden', UI.$(this).hasClass('uk-hidden'));
                });
            }
        }
    });

})(UIkit);

(function(UI) {

    "use strict";

    UI.component('alert', {

        defaults: {
            "fade": true,
            "duration": 200,
            "trigger": ".uk-alert-close"
        },

        boot: function() {

            // init code
            UI.$html.on("click.alert.uikit", "[data-uk-alert]", function(e) {

                var ele = UI.$(this);

                if (!ele.data("alert")) {

                    var alert = UI.alert(ele, UI.Utils.options(ele.attr("data-uk-alert")));

                    if (UI.$(e.target).is(alert.options.trigger)) {
                        e.preventDefault();
                        alert.close();
                    }
                }
            });
        },

        init: function() {

            var $this = this;

            this.on("click", this.options.trigger, function(e) {
                e.preventDefault();
                $this.close();
            });
        },

        close: function() {

            var element       = this.trigger("close.uk.alert"),
                removeElement = function () {
                    this.trigger("closed.uk.alert").remove();
                }.bind(this);

            if (this.options.fade) {
                element.css("overflow", "hidden").css("max-height", element.height()).animate({
                    "height"         : 0,
                    "opacity"        : 0,
                    "padding-top"    : 0,
                    "padding-bottom" : 0,
                    "margin-top"     : 0,
                    "margin-bottom"  : 0
                }, this.options.duration, removeElement);
            } else {
                removeElement();
            }
        }

    });

})(UIkit);

(function(UI) {

    "use strict";

    UI.component('buttonRadio', {

        defaults: {
            "activeClass": 'uk-active',
            "target": ".uk-button"
        },

        boot: function() {

            // init code
            UI.$html.on("click.buttonradio.uikit", "[data-uk-button-radio]", function(e) {

                var ele = UI.$(this);

                if (!ele.data("buttonRadio")) {

                    var obj    = UI.buttonRadio(ele, UI.Utils.options(ele.attr("data-uk-button-radio"))),
                        target = UI.$(e.target);

                    if (target.is(obj.options.target)) {
                        target.trigger("click");
                    }
                }
            });
        },

        init: function() {

            var $this = this;

            // Init ARIA
            this.find($this.options.target).attr('aria-checked', 'false').filter('.' + $this.options.activeClass).attr('aria-checked', 'true');

            this.on("click", this.options.target, function(e) {

                var ele = UI.$(this);

                if (ele.is('a[href="#"]')) e.preventDefault();

                $this.find($this.options.target).not(ele).removeClass($this.options.activeClass).blur();
                ele.addClass($this.options.activeClass);

                // Update ARIA
                $this.find($this.options.target).not(ele).attr('aria-checked', 'false');
                ele.attr('aria-checked', 'true');

                $this.trigger("change.uk.button", [ele]);
            });

        },

        getSelected: function() {
            return this.find('.' + this.options.activeClass);
        }
    });

    UI.component('buttonCheckbox', {

        defaults: {
            "activeClass": 'uk-active',
            "target": ".uk-button"
        },

        boot: function() {

            UI.$html.on("click.buttoncheckbox.uikit", "[data-uk-button-checkbox]", function(e) {
                var ele = UI.$(this);

                if (!ele.data("buttonCheckbox")) {

                    var obj    = UI.buttonCheckbox(ele, UI.Utils.options(ele.attr("data-uk-button-checkbox"))),
                        target = UI.$(e.target);

                    if (target.is(obj.options.target)) {
                        target.trigger("click");
                    }
                }
            });
        },

        init: function() {

            var $this = this;

            // Init ARIA
            this.find($this.options.target).attr('aria-checked', 'false').filter('.' + $this.options.activeClass).attr('aria-checked', 'true');

            this.on("click", this.options.target, function(e) {
                var ele = UI.$(this);

                if (ele.is('a[href="#"]')) e.preventDefault();

                ele.toggleClass($this.options.activeClass).blur();

                // Update ARIA
                ele.attr('aria-checked', ele.hasClass($this.options.activeClass));

                $this.trigger("change.uk.button", [ele]);
            });

        },

        getSelected: function() {
            return this.find('.' + this.options.activeClass);
        }
    });


    UI.component('button', {

        defaults: {},

        boot: function() {

            UI.$html.on("click.button.uikit", "[data-uk-button]", function(e) {
                var ele = UI.$(this);

                if (!ele.data("button")) {

                    var obj = UI.button(ele, UI.Utils.options(ele.attr("data-uk-button")));
                    ele.trigger("click");
                }
            });
        },

        init: function() {

            var $this = this;

            // Init ARIA
            this.element.attr('aria-pressed', this.element.hasClass("uk-active"));

            this.on("click", function(e) {

                if ($this.element.is('a[href="#"]')) e.preventDefault();

                $this.toggle();
                $this.trigger("change.uk.button", [$this.element.blur().hasClass("uk-active")]);
            });

        },

        toggle: function() {
            this.element.toggleClass("uk-active");

            // Update ARIA
            this.element.attr('aria-pressed', this.element.hasClass("uk-active"));
        }
    });

})(UIkit);


(function(UI) {

    "use strict";

    var active = false, hoverIdle, flips = {
        'x': {
            "bottom-left"   : 'bottom-right',
            "bottom-right"  : 'bottom-left',
            "bottom-center" : 'bottom-right',
            "top-left"      : 'top-right',
            "top-right"     : 'top-left',
            "top-center"    : 'top-right',
            "left-top"      : 'right',
            "left-bottom"   : 'right-bottom',
            "left-center"   : 'right-center',
            "right-top"     : 'left',
            "right-bottom"  : 'left-bottom',
            "right-center"  : 'left-center'
        },
        'y': {
            "bottom-left"   : 'top-left',
            "bottom-right"  : 'top-right',
            "bottom-center" : 'top-center',
            "top-left"      : 'bottom-left',
            "top-right"     : 'bottom-right',
            "top-center"    : 'bottom-center',
            "left-top"      : 'top-left',
            "left-bottom"   : 'left-bottom',
            "left-center"   : 'top-left',
            "right-top"     : 'top-left',
            "right-bottom"  : 'bottom-left',
            "right-center"  : 'top-left'
        },
        'xy': {

        }
    };

    UI.component('dropdown', {

        defaults: {
           'mode'            : 'hover',
           'pos'             : 'bottom-left',
           'offset'          : 0,
           'remaintime'      : 800,
           'justify'         : false,
           'boundary'        : UI.$win,
           'delay'           : 0,
           'dropdownSelector': '.uk-dropdown,.uk-dropdown-blank',
           'hoverDelayIdle'  : 250,
           'preventflip'     : false
        },

        remainIdle: false,

        boot: function() {

            var triggerevent = UI.support.touch ? "click" : "mouseenter";

            // init code
            UI.$html.on(triggerevent+".dropdown.uikit", "[data-uk-dropdown]", function(e) {

                var ele = UI.$(this);

                if (!ele.data("dropdown")) {

                    var dropdown = UI.dropdown(ele, UI.Utils.options(ele.attr("data-uk-dropdown")));

                    if (triggerevent=="click" || (triggerevent=="mouseenter" && dropdown.options.mode=="hover")) {
                        dropdown.element.trigger(triggerevent);
                    }

                    if (dropdown.element.find(dropdown.options.dropdownSelector).length) {
                        e.preventDefault();
                    }
                }
            });
        },

        init: function() {

            var $this = this;

            this.dropdown     = this.find(this.options.dropdownSelector);
            this.offsetParent = this.dropdown.parents().filter(function() {
                return UI.$.inArray(UI.$(this).css('position'), ['relative', 'fixed', 'absolute']) !== -1;
            }).slice(0,1);

            this.centered  = this.dropdown.hasClass('uk-dropdown-center');
            this.justified = this.options.justify ? UI.$(this.options.justify) : false;

            this.boundary  = UI.$(this.options.boundary);

            if (!this.boundary.length) {
                this.boundary = UI.$win;
            }

            // legacy DEPRECATED!
            if (this.dropdown.hasClass('uk-dropdown-up')) {
                this.options.pos = 'top-left';
            }
            if (this.dropdown.hasClass('uk-dropdown-flip')) {
                this.options.pos = this.options.pos.replace('left','right');
            }
            if (this.dropdown.hasClass('uk-dropdown-center')) {
                this.options.pos = this.options.pos.replace(/(left|right)/,'center');
            }
            //-- end legacy

            // Init ARIA
            this.element.attr('aria-haspopup', 'true');
            this.element.attr('aria-expanded', this.element.hasClass("uk-open"));

            if (this.options.mode == "click" || UI.support.touch) {

                this.on("click.uikit.dropdown", function(e) {

                    var $target = UI.$(e.target);

                    if (!$target.parents($this.options.dropdownSelector).length) {

                        if ($target.is("a[href='#']") || $target.parent().is("a[href='#']") || ($this.dropdown.length && !$this.dropdown.is(":visible")) ){
                            e.preventDefault();
                        }

                        $target.blur();
                    }

                    if (!$this.element.hasClass('uk-open')) {

                        $this.show();

                    } else {

                        if (!$this.dropdown.find(e.target).length || $target.is(".uk-dropdown-close") || $target.parents(".uk-dropdown-close").length) {
                            $this.hide();
                        }
                    }
                });

            } else {

                this.on("mouseenter", function(e) {

                    $this.trigger('pointerenter.uk.dropdown', [$this]);

                    if ($this.remainIdle) {
                        clearTimeout($this.remainIdle);
                    }

                    if (hoverIdle) {
                        clearTimeout(hoverIdle);
                    }

                    if (active && active == $this) {
                        return;
                    }

                    // pseudo manuAim
                    if (active && active != $this) {

                        hoverIdle = setTimeout(function() {
                            hoverIdle = setTimeout($this.show.bind($this), $this.options.delay);
                        }, $this.options.hoverDelayIdle);

                    } else {

                        hoverIdle = setTimeout($this.show.bind($this), $this.options.delay);
                    }

                }).on("mouseleave", function() {

                    if (hoverIdle) {
                        clearTimeout(hoverIdle);
                    }

                    $this.remainIdle = setTimeout(function() {
                        if (active && active == $this) $this.hide();
                    }, $this.options.remaintime);

                    $this.trigger('pointerleave.uk.dropdown', [$this]);

                }).on("click", function(e){

                    var $target = UI.$(e.target);

                    if ($this.remainIdle) {
                        clearTimeout($this.remainIdle);
                    }

                    if (active && active == $this) {
                        if (!$this.dropdown.find(e.target).length || $target.is(".uk-dropdown-close") || $target.parents(".uk-dropdown-close").length) {
                            $this.hide();
                        }
                        return;
                    }

                    if ($target.is("a[href='#']") || $target.parent().is("a[href='#']")){
                        e.preventDefault();
                    }

                    $this.show();
                });
            }
        },

        show: function(){

            UI.$html.off("click.outer.dropdown");

            if (active && active != this) {
                active.hide(true);
            }

            if (hoverIdle) {
                clearTimeout(hoverIdle);
            }

            this.trigger('beforeshow.uk.dropdown', [this]);

            this.checkDimensions();
            this.element.addClass('uk-open');

            // Update ARIA
            this.element.attr('aria-expanded', 'true');

            this.trigger('show.uk.dropdown', [this]);

            UI.Utils.checkDisplay(this.dropdown, true);
            active = this;

            this.registerOuterClick();
        },

        hide: function(force) {

            this.trigger('beforehide.uk.dropdown', [this, force]);

            this.element.removeClass('uk-open');

            if (this.remainIdle) {
                clearTimeout(this.remainIdle);
            }

            this.remainIdle = false;

            // Update ARIA
            this.element.attr('aria-expanded', 'false');

            this.trigger('hide.uk.dropdown', [this, force]);

            if (active == this) active = false;
        },

        registerOuterClick: function(){

            var $this = this;

            UI.$html.off("click.outer.dropdown");

            setTimeout(function() {

                UI.$html.on("click.outer.dropdown", function(e) {

                    if (hoverIdle) {
                        clearTimeout(hoverIdle);
                    }

                    var $target = UI.$(e.target);

                    if (active == $this && !$this.element.find(e.target).length) {
                        $this.hide(true);
                        UI.$html.off("click.outer.dropdown");
                    }
                });
            }, 10);
        },

        checkDimensions: function() {

            if (!this.dropdown.length) return;

            // reset
            this.dropdown.removeClass('uk-dropdown-top uk-dropdown-bottom uk-dropdown-left uk-dropdown-right uk-dropdown-stack').css({
                'top-left':'',
                'left':'',
                'margin-left' :'',
                'margin-right':''
            });

            if (this.justified && this.justified.length) {
                this.dropdown.css("min-width", "");
            }

            var $this          = this,
                pos            = UI.$.extend({}, this.offsetParent.offset(), {width: this.offsetParent[0].offsetWidth, height: this.offsetParent[0].offsetHeight}),
                posoffset      = this.options.offset,
                dropdown       = this.dropdown,
                offset         = dropdown.show().offset() || {left: 0, top: 0},
                width          = dropdown.outerWidth(),
                height         = dropdown.outerHeight(),
                boundarywidth  = this.boundary.width(),
                boundaryoffset = this.boundary[0] !== window && this.boundary.offset() ? this.boundary.offset(): {top:0, left:0},
                dpos           = this.options.pos;

            var variants =  {
                    "bottom-left"   : {top: 0 + pos.height + posoffset, left: 0},
                    "bottom-right"  : {top: 0 + pos.height + posoffset, left: 0 + pos.width - width},
                    "bottom-center" : {top: 0 + pos.height + posoffset, left: 0 + pos.width / 2 - width / 2},
                    "top-left"      : {top: 0 - height - posoffset, left: 0},
                    "top-right"     : {top: 0 - height - posoffset, left: 0 + pos.width - width},
                    "top-center"    : {top: 0 - height - posoffset, left: 0 + pos.width / 2 - width / 2},
                    "left-top"      : {top: 0, left: 0 - width - posoffset},
                    "left-bottom"   : {top: 0 + pos.height - height, left: 0 - width - posoffset},
                    "left-center"   : {top: 0 + pos.height / 2 - height / 2, left: 0 - width - posoffset},
                    "right-top"     : {top: 0, left: 0 + pos.width + posoffset},
                    "right-bottom"  : {top: 0 + pos.height - height, left: 0 + pos.width + posoffset},
                    "right-center"  : {top: 0 + pos.height / 2 - height / 2, left: 0 + pos.width + posoffset}
                },
                css = {},
                pp;

            pp = dpos.split('-');
            css = variants[dpos] ? variants[dpos] : variants['bottom-left'];

            // justify dropdown
            if (this.justified && this.justified.length) {
                justify(dropdown.css({left:0}), this.justified, boundarywidth);
            } else {

                if (this.options.preventflip !== true) {

                    var fdpos;

                    switch(this.checkBoundary(pos.left + css.left, pos.top + css.top, width, height, boundarywidth)) {
                        case "x":
                            if(this.options.preventflip !=='x') fdpos = flips['x'][dpos] || 'right-top';
                            break;
                        case "y":
                            if(this.options.preventflip !=='y') fdpos = flips['y'][dpos] || 'top-left';
                            break;
                        case "xy":
                            if(!this.options.preventflip) fdpos = flips['xy'][dpos] || 'right-bottom';
                            break;
                    }

                    if (fdpos) {

                        pp  = fdpos.split('-');
                        css = variants[fdpos] ? variants[fdpos] : variants['bottom-left'];

                        // check flipped
                        if (this.checkBoundary(pos.left + css.left, pos.top + css.top, width, height, boundarywidth)) {
                            pp  = dpos.split('-');
                            css = variants[dpos] ? variants[dpos] : variants['bottom-left'];
                        }
                    }
                }
            }

            if (width > boundarywidth) {
                dropdown.addClass("uk-dropdown-stack");
                this.trigger('stack.uk.dropdown', [this]);
            }

            dropdown.css(css).css("display", "").addClass('uk-dropdown-'+pp[0]);
        },

        checkBoundary: function(left, top, width, height, boundarywidth) {

            var axis = "";

            if (left < 0 || ((left - UI.$win.scrollLeft())+width) > boundarywidth) {
               axis += "x";
            }

            if ((top - UI.$win.scrollTop()) < 0 || ((top - UI.$win.scrollTop())+height) > window.innerHeight) {
               axis += "y";
            }

            return axis;
        }
    });


    UI.component('dropdownOverlay', {

        defaults: {
           'justify' : false,
           'cls'     : '',
           'duration': 200
        },

        boot: function() {

            // init code
            UI.ready(function(context) {

                UI.$("[data-uk-dropdown-overlay]", context).each(function() {
                    var ele = UI.$(this);

                    if (!ele.data("dropdownOverlay")) {
                        UI.dropdownOverlay(ele, UI.Utils.options(ele.attr("data-uk-dropdown-overlay")));
                    }
                });
            });
        },

        init: function() {

            var $this = this;

            this.justified = this.options.justify ? UI.$(this.options.justify) : false;
            this.overlay   = this.element.find('uk-dropdown-overlay');

            if (!this.overlay.length) {
                this.overlay = UI.$('<div class="uk-dropdown-overlay"></div>').appendTo(this.element);
            }

            this.overlay.addClass(this.options.cls);

            this.on({

                'beforeshow.uk.dropdown': function(e, dropdown) {
                    $this.dropdown = dropdown;

                    if ($this.justified && $this.justified.length) {
                        justify($this.overlay.css({'display':'block', 'margin-left':'','margin-right':''}), $this.justified, $this.justified.outerWidth());
                    }
                },

                'show.uk.dropdown': function(e, dropdown) {

                    var h = $this.dropdown.dropdown.outerHeight(true);

                    $this.dropdown.element.removeClass('uk-open');

                    $this.overlay.stop().css('display', 'block').animate({height: h}, $this.options.duration, function() {

                       $this.dropdown.dropdown.css('visibility', '');
                       $this.dropdown.element.addClass('uk-open');

                       UI.Utils.checkDisplay($this.dropdown.dropdown, true);
                    });

                    $this.pointerleave = false;
                },

                'hide.uk.dropdown': function() {
                    $this.overlay.stop().animate({height: 0}, $this.options.duration);
                },

                'pointerenter.uk.dropdown': function(e, dropdown) {
                    clearTimeout($this.remainIdle);
                },

                'pointerleave.uk.dropdown': function(e, dropdown) {
                    $this.pointerleave = true;
                }
            });


            this.overlay.on({

                'mouseenter': function() {
                    if ($this.remainIdle) {
                        clearTimeout($this.dropdown.remainIdle);
                        clearTimeout($this.remainIdle);
                    }
                },

                'mouseleave': function(){

                    if ($this.pointerleave && active) {

                        $this.remainIdle = setTimeout(function() {
                           if(active) active.hide();
                        }, active.options.remaintime);
                    }
                }
            })
        }

    });


    function justify(ele, justifyTo, boundarywidth, offset) {

        ele           = UI.$(ele);
        justifyTo     = UI.$(justifyTo);
        boundarywidth = boundarywidth || window.innerWidth;
        offset        = offset || ele.offset();

        if (justifyTo.length) {

            var jwidth = justifyTo.outerWidth();

            ele.css("min-width", jwidth);

            if (UI.langdirection == 'right') {

                var right1   = boundarywidth - (justifyTo.offset().left + jwidth),
                    right2   = boundarywidth - (ele.offset().left + ele.outerWidth());

                ele.css("margin-right", right1 - right2);

            } else {
                ele.css("margin-left", justifyTo.offset().left - offset.left);
            }
        }
    }

})(UIkit);

(function(UI) {

    "use strict";

    var grids = [];

    UI.component('gridMatchHeight', {

        defaults: {
            "target"        : false,
            "row"           : true,
            "ignorestacked" : false
        },

        boot: function() {

            // init code
            UI.ready(function(context) {

                UI.$("[data-uk-grid-match]", context).each(function() {
                    var grid = UI.$(this), obj;

                    if (!grid.data("gridMatchHeight")) {
                        obj = UI.gridMatchHeight(grid, UI.Utils.options(grid.attr("data-uk-grid-match")));
                    }
                });
            });
        },

        init: function() {

            var $this = this;

            this.columns  = this.element.children();
            this.elements = this.options.target ? this.find(this.options.target) : this.columns;

            if (!this.columns.length) return;

            UI.$win.on('load resize orientationchange', (function() {

                var fn = function() {
                    $this.match();
                };

                UI.$(function() { fn(); });

                return UI.Utils.debounce(fn, 50);
            })());

            UI.$html.on("changed.uk.dom", function(e) {
                $this.columns  = $this.element.children();
                $this.elements = $this.options.target ? $this.find($this.options.target) : $this.columns;
                $this.match();
            });

            this.on("display.uk.check", function(e) {
                if(this.element.is(":visible")) this.match();
            }.bind(this));

            grids.push(this);
        },

        match: function() {

            var firstvisible = this.columns.filter(":visible:first");

            if (!firstvisible.length) return;

            var stacked = Math.ceil(100 * parseFloat(firstvisible.css('width')) / parseFloat(firstvisible.parent().css('width'))) >= 100;

            if (stacked && !this.options.ignorestacked) {
                this.revert();
            } else {
                UI.Utils.matchHeights(this.elements, this.options);
            }

            return this;
        },

        revert: function() {
            this.elements.css('min-height', '');
            return this;
        }
    });

    UI.component('gridMargin', {

        defaults: {
            cls      : 'uk-grid-margin',
            rowfirst : 'uk-row-first'
        },

        boot: function() {

            // init code
            UI.ready(function(context) {

                UI.$("[data-uk-grid-margin]", context).each(function() {
                    var grid = UI.$(this), obj;

                    if (!grid.data("gridMargin")) {
                        obj = UI.gridMargin(grid, UI.Utils.options(grid.attr("data-uk-grid-margin")));
                    }
                });
            });
        },

        init: function() {

            var stackMargin = UI.stackMargin(this.element, this.options);
        }
    });

})(UIkit);

(function(UI) {

    "use strict";

    var active = false, activeCount = 0, $html = UI.$html, body;

    UI.component('modal', {

        defaults: {
            keyboard: true,
            bgclose: true,
            minScrollHeight: 150,
            center: false,
            modal: true
        },

        scrollable: false,
        transition: false,
        hasTransitioned: true,

        init: function() {

            if (!body) body = UI.$('body');

            if (!this.element.length) return;

            var $this = this;

            this.paddingdir = "padding-" + (UI.langdirection == 'left' ? "right":"left");
            this.dialog     = this.find(".uk-modal-dialog");

            this.active     = false;

            // Update ARIA
            this.element.attr('aria-hidden', this.element.hasClass("uk-open"));

            this.on("click", ".uk-modal-close", function(e) {
                e.preventDefault();
                $this.hide();
            }).on("click", function(e) {

                var target = UI.$(e.target);

                if (target[0] == $this.element[0] && $this.options.bgclose) {
                    $this.hide();
                }
            });
        },

        toggle: function() {
            return this[this.isActive() ? "hide" : "show"]();
        },

        show: function() {

            if (!this.element.length) return;

            var $this = this;

            if (this.isActive()) return;

            if (this.options.modal && active) {
                active.hide(true);
            }

            this.element.removeClass("uk-open").show();
            this.resize();

            if (this.options.modal) {
                active = this;
            }

            this.active = true;

            activeCount++;

            if (UI.support.transition) {
                this.hasTransitioned = false;
                this.element.one(UI.support.transition.end, function(){
                    $this.hasTransitioned = true;
                }).addClass("uk-open");
            } else {
                this.element.addClass("uk-open");
            }

            $html.addClass("uk-modal-page").height(); // force browser engine redraw

            // Update ARIA
            this.element.attr('aria-hidden', 'false');

            this.element.trigger("show.uk.modal");

            UI.Utils.checkDisplay(this.dialog, true);

            return this;
        },

        hide: function(force) {

            if (!force && UI.support.transition && this.hasTransitioned) {

                var $this = this;

                this.one(UI.support.transition.end, function() {
                    $this._hide();
                }).removeClass("uk-open");

            } else {

                this._hide();
            }

            return this;
        },

        resize: function() {

            var bodywidth  = body.width();

            this.scrollbarwidth = window.innerWidth - bodywidth;

            body.css(this.paddingdir, this.scrollbarwidth);

            this.element.css('overflow-y', this.scrollbarwidth ? 'scroll' : 'auto');

            if (!this.updateScrollable() && this.options.center) {

                var dh  = this.dialog.outerHeight(),
                pad = parseInt(this.dialog.css('margin-top'), 10) + parseInt(this.dialog.css('margin-bottom'), 10);

                if ((dh + pad) < window.innerHeight) {
                    this.dialog.css({'top': (window.innerHeight/2 - dh/2) - pad });
                } else {
                    this.dialog.css({'top': ''});
                }
            }
        },

        updateScrollable: function() {

            // has scrollable?
            var scrollable = this.dialog.find('.uk-overflow-container:visible:first');

            if (scrollable.length) {

                scrollable.css('height', 0);

                var offset = Math.abs(parseInt(this.dialog.css('margin-top'), 10)),
                dh     = this.dialog.outerHeight(),
                wh     = window.innerHeight,
                h      = wh - 2*(offset < 20 ? 20:offset) - dh;

                scrollable.css({
                    'max-height': (h < this.options.minScrollHeight ? '':h),
                    'height':''
                });

                return true;
            }

            return false;
        },

        _hide: function() {

            this.active = false;
            if (activeCount > 0) activeCount--;
            else activeCount = 0;

            this.element.hide().removeClass('uk-open');

            // Update ARIA
            this.element.attr('aria-hidden', 'true');

            if (!activeCount) {
                $html.removeClass('uk-modal-page');
                body.css(this.paddingdir, "");
            }

            if(active===this) active = false;

            this.trigger('hide.uk.modal');
        },

        isActive: function() {
            return this.active;
        }

    });

    UI.component('modalTrigger', {

        boot: function() {

            // init code
            UI.$html.on("click.modal.uikit", "[data-uk-modal]", function(e) {

                var ele = UI.$(this);

                if (ele.is("a")) {
                    e.preventDefault();
                }

                if (!ele.data("modalTrigger")) {
                    var modal = UI.modalTrigger(ele, UI.Utils.options(ele.attr("data-uk-modal")));
                    modal.show();
                }

            });

            // close modal on esc button
            UI.$html.on('keydown.modal.uikit', function (e) {

                if (active && e.keyCode === 27 && active.options.keyboard) { // ESC
                    e.preventDefault();
                    active.hide();
                }
            });

            UI.$win.on("resize orientationchange", UI.Utils.debounce(function(){
                if (active) active.resize();
            }, 150));
        },

        init: function() {

            var $this = this;

            this.options = UI.$.extend({
                "target": $this.element.is("a") ? $this.element.attr("href") : false
            }, this.options);

            this.modal = UI.modal(this.options.target, this.options);

            this.on("click", function(e) {
                e.preventDefault();
                $this.show();
            });

            //methods
            this.proxy(this.modal, "show hide isActive");
        }
    });

    UI.modal.dialog = function(content, options) {

        var modal = UI.modal(UI.$(UI.modal.dialog.template).appendTo("body"), options);

        modal.on("hide.uk.modal", function(){
            if (modal.persist) {
                modal.persist.appendTo(modal.persist.data("modalPersistParent"));
                modal.persist = false;
            }
            modal.element.remove();
        });

        setContent(content, modal);

        return modal;
    };

    UI.modal.dialog.template = '<div class="uk-modal"><div class="uk-modal-dialog" style="min-height:0;"></div></div>';

    UI.modal.alert = function(content, options) {

        options = UI.$.extend(true, {bgclose:false, keyboard:false, modal:false, labels:UI.modal.labels}, options);

        var modal = UI.modal.dialog(([
            '<div class="uk-margin uk-modal-content">'+String(content)+'</div>',
            '<div class="uk-modal-footer uk-text-right"><button class="uk-button uk-button-primary uk-modal-close">'+options.labels.Ok+'</button></div>'
        ]).join(""), options);

        modal.on('show.uk.modal', function(){
            setTimeout(function(){
                modal.element.find('button:first').focus();
            }, 50);
        });

        return modal.show();
    };

    UI.modal.confirm = function(content, onconfirm, oncancel) {

        var options = arguments.length > 1 && arguments[arguments.length-1] ? arguments[arguments.length-1] : {};

        onconfirm = UI.$.isFunction(onconfirm) ? onconfirm : function(){};
        oncancel  = UI.$.isFunction(oncancel) ? oncancel : function(){};
        options   = UI.$.extend(true, {bgclose:false, keyboard:false, modal:false, labels:UI.modal.labels}, UI.$.isFunction(options) ? {}:options);

        var modal = UI.modal.dialog(([
            '<div class="uk-margin uk-modal-content">'+String(content)+'</div>',
            '<div class="uk-modal-footer uk-text-right"><button class="uk-button js-modal-confirm-cancel">'+options.labels.Cancel+'</button> <button class="uk-button uk-button-primary js-modal-confirm">'+options.labels.Ok+'</button></div>'
        ]).join(""), options);

        modal.element.find(".js-modal-confirm, .js-modal-confirm-cancel").on("click", function(){
            UI.$(this).is('.js-modal-confirm') ? onconfirm() : oncancel();
            modal.hide();
        });

        modal.on('show.uk.modal', function(){
            setTimeout(function(){
                modal.element.find('.js-modal-confirm').focus();
            }, 50);
        });

        return modal.show();
    };

    UI.modal.prompt = function(text, value, onsubmit, options) {

        onsubmit = UI.$.isFunction(onsubmit) ? onsubmit : function(value){};
        options  = UI.$.extend(true, {bgclose:false, keyboard:false, modal:false, labels:UI.modal.labels}, options);

        var modal = UI.modal.dialog(([
            text ? '<div class="uk-modal-content uk-form">'+String(text)+'</div>':'',
            '<div class="uk-margin-small-top uk-modal-content uk-form"><p><input type="text" class="uk-width-1-1"></p></div>',
            '<div class="uk-modal-footer uk-text-right"><button class="uk-button uk-modal-close">'+options.labels.Cancel+'</button> <button class="uk-button uk-button-primary js-modal-ok">'+options.labels.Ok+'</button></div>'
        ]).join(""), options),

        input = modal.element.find("input[type='text']").val(value || '').on('keyup', function(e){
            if (e.keyCode == 13) {
                modal.element.find(".js-modal-ok").trigger('click');
            }
        });

        modal.element.find(".js-modal-ok").on("click", function(){
            if (onsubmit(input.val())!==false){
                modal.hide();
            }
        });

        modal.on('show.uk.modal', function(){
            setTimeout(function(){
                input.focus();
            }, 50);
        });

        return modal.show();
    };

    UI.modal.blockUI = function(content, options) {

        var modal = UI.modal.dialog(([
            '<div class="uk-margin uk-modal-content">'+String(content || '<div class="uk-text-center">...</div>')+'</div>'
        ]).join(""), UI.$.extend({bgclose:false, keyboard:false, modal:false}, options));

        modal.content = modal.element.find('.uk-modal-content:first');

        return modal.show();
    };


    UI.modal.labels = {
        'Ok': 'Ok',
        'Cancel': 'Cancel'
    };


    // helper functions
    function setContent(content, modal){

        if(!modal) return;

        if (typeof content === 'object') {

            // convert DOM object to a jQuery object
            content = content instanceof jQuery ? content : UI.$(content);

            if(content.parent().length) {
                modal.persist = content;
                modal.persist.data("modalPersistParent", content.parent());
            }
        }else if (typeof content === 'string' || typeof content === 'number') {
                // just insert the data as innerHTML
                content = UI.$('<div></div>').html(content);
        }else {
                // unsupported data type!
                content = UI.$('<div></div>').html('UIkit.modal Error: Unsupported data type: ' + typeof content);
        }

        content.appendTo(modal.element.find('.uk-modal-dialog'));

        return modal;
    }

})(UIkit);

(function(UI) {

    "use strict";

    UI.component('nav', {

        defaults: {
            "toggle": ">li.uk-parent > a[href='#']",
            "lists": ">li.uk-parent > ul",
            "multiple": false
        },

        boot: function() {

            // init code
            UI.ready(function(context) {

                UI.$("[data-uk-nav]", context).each(function() {
                    var nav = UI.$(this);

                    if (!nav.data("nav")) {
                        var obj = UI.nav(nav, UI.Utils.options(nav.attr("data-uk-nav")));
                    }
                });
            });
        },

        init: function() {

            var $this = this;

            this.on("click.uikit.nav", this.options.toggle, function(e) {
                e.preventDefault();
                var ele = UI.$(this);
                $this.open(ele.parent()[0] == $this.element[0] ? ele : ele.parent("li"));
            });

            this.find(this.options.lists).each(function() {
                var $ele   = UI.$(this),
                    parent = $ele.parent(),
                    active = parent.hasClass("uk-active");

                $ele.wrap('<div style="overflow:hidden;height:0;position:relative;"></div>');
                parent.data("list-container", $ele.parent()[active ? 'removeClass':'addClass']('uk-hidden'));

                // Init ARIA
                parent.attr('aria-expanded', parent.hasClass("uk-open"));

                if (active) $this.open(parent, true);
            });

        },

        open: function(li, noanimation) {

            var $this = this, element = this.element, $li = UI.$(li), $container = $li.data('list-container');

            if (!this.options.multiple) {

                element.children('.uk-open').not(li).each(function() {

                    var ele = UI.$(this);

                    if (ele.data('list-container')) {
                        ele.data('list-container').stop().animate({height: 0}, function() {
                            UI.$(this).parent().removeClass('uk-open').end().addClass('uk-hidden');
                        });
                    }
                });
            }

            $li.toggleClass('uk-open');

            // Update ARIA
            $li.attr('aria-expanded', $li.hasClass('uk-open'));

            if ($container) {

                if ($li.hasClass('uk-open')) {
                    $container.removeClass('uk-hidden');
                }

                if (noanimation) {

                    $container.stop().height($li.hasClass('uk-open') ? 'auto' : 0);

                    if (!$li.hasClass('uk-open')) {
                        $container.addClass('uk-hidden');
                    }

                    this.trigger('display.uk.check');

                } else {

                    $container.stop().animate({
                        height: ($li.hasClass('uk-open') ? getHeight($container.find('ul:first')) : 0)
                    }, function() {

                        if (!$li.hasClass('uk-open')) {
                            $container.addClass('uk-hidden');
                        } else {
                            $container.css('height', '');
                        }

                        $this.trigger('display.uk.check');
                    });
                }
            }
        }
    });


    // helper

    function getHeight(ele) {
        var $ele = UI.$(ele), height = "auto";

        if ($ele.is(":visible")) {
            height = $ele.outerHeight();
        } else {
            var tmp = {
                position: $ele.css("position"),
                visibility: $ele.css("visibility"),
                display: $ele.css("display")
            };

            height = $ele.css({position: 'absolute', visibility: 'hidden', display: 'block'}).outerHeight();

            $ele.css(tmp); // reset element
        }

        return height;
    }

})(UIkit);

(function(UI) {

    "use strict";

    var scrollpos = {x: window.scrollX, y: window.scrollY},
        $win      = UI.$win,
        $doc      = UI.$doc,
        $html     = UI.$html,
        Offcanvas = {

        show: function(element) {

            element = UI.$(element);

            if (!element.length) return;

            var $body     = UI.$('body'),
                bar       = element.find(".uk-offcanvas-bar:first"),
                rtl       = (UI.langdirection == "right"),
                flip      = bar.hasClass("uk-offcanvas-bar-flip") ? -1:1,
                dir       = flip * (rtl ? -1 : 1),

                scrollbarwidth =  window.innerWidth - $body.width();

            scrollpos = {x: window.pageXOffset, y: window.pageYOffset};

            element.addClass("uk-active");

            $body.css({"width": window.innerWidth - scrollbarwidth, "height": window.innerHeight}).addClass("uk-offcanvas-page");
            $body.css((rtl ? "margin-right" : "margin-left"), (rtl ? -1 : 1) * (bar.outerWidth() * dir)).width(); // .width() - force redraw

            $html.css('margin-top', scrollpos.y * -1);

            bar.addClass("uk-offcanvas-bar-show");

            this._initElement(element);

            bar.trigger('show.uk.offcanvas', [element, bar]);

            // Update ARIA
            element.attr('aria-hidden', 'false');
        },

        hide: function(force) {

            var $body = UI.$('body'),
                panel = UI.$(".uk-offcanvas.uk-active"),
                rtl   = (UI.langdirection == "right"),
                bar   = panel.find(".uk-offcanvas-bar:first"),
                finalize = function() {
                    $body.removeClass("uk-offcanvas-page").css({"width": "", "height": "", "margin-left": "", "margin-right": ""});
                    panel.removeClass("uk-active");

                    bar.removeClass("uk-offcanvas-bar-show");
                    $html.css('margin-top', '');
                    window.scrollTo(scrollpos.x, scrollpos.y);
                    bar.trigger('hide.uk.offcanvas', [panel, bar]);

                    // Update ARIA
                    panel.attr('aria-hidden', 'true');
                };

            if (!panel.length) return;

            if (UI.support.transition && !force) {

                $body.one(UI.support.transition.end, function() {
                    finalize();
                }).css((rtl ? "margin-right" : "margin-left"), "");

                setTimeout(function(){
                    bar.removeClass("uk-offcanvas-bar-show");
                }, 0);

            } else {
                finalize();
            }
        },

        _initElement: function(element) {

            if (element.data("OffcanvasInit")) return;

            element.on("click.uk.offcanvas swipeRight.uk.offcanvas swipeLeft.uk.offcanvas", function(e) {

                var target = UI.$(e.target);

                if (!e.type.match(/swipe/)) {

                    if (!target.hasClass("uk-offcanvas-close")) {
                        if (target.hasClass("uk-offcanvas-bar")) return;
                        if (target.parents(".uk-offcanvas-bar:first").length) return;
                    }
                }

                e.stopImmediatePropagation();
                Offcanvas.hide();
            });

            element.on("click", "a[href*='#']", function(e){

                var link = UI.$(this),
                    href = link.attr("href");

                if (href == "#") {
                    return;
                }

                UI.$doc.one('hide.uk.offcanvas', function() {

                    var target;

                    try {
                        target = UI.$(link[0].hash);
                    } catch (e){
                        target = '';
                    }

                    if (!target.length) {
                        target = UI.$('[name="'+link[0].hash.replace('#','')+'"]');
                    }

                    if (target.length && UI.Utils.scrollToElement) {
                        UI.Utils.scrollToElement(target, UI.Utils.options(link.attr('data-uk-smooth-scroll') || '{}'));
                    } else {
                        window.location.href = href;
                    }
                });

                Offcanvas.hide();
            });

            element.data("OffcanvasInit", true);
        }
    };

    UI.component('offcanvasTrigger', {

        boot: function() {

            // init code
            $html.on("click.offcanvas.uikit", "[data-uk-offcanvas]", function(e) {

                e.preventDefault();

                var ele = UI.$(this);

                if (!ele.data("offcanvasTrigger")) {
                    var obj = UI.offcanvasTrigger(ele, UI.Utils.options(ele.attr("data-uk-offcanvas")));
                    ele.trigger("click");
                }
            });

            $html.on('keydown.uk.offcanvas', function(e) {

                if (e.keyCode === 27) { // ESC
                    Offcanvas.hide();
                }
            });
        },

        init: function() {

            var $this = this;

            this.options = UI.$.extend({
                "target": $this.element.is("a") ? $this.element.attr("href") : false
            }, this.options);

            this.on("click", function(e) {
                e.preventDefault();
                Offcanvas.show($this.options.target);
            });
        }
    });

    UI.offcanvas = Offcanvas;

})(UIkit);

(function(UI) {

    "use strict";

    var Animations;

    UI.component('switcher', {

        defaults: {
            connect   : false,
            toggle    : ">*",
            active    : 0,
            animation : false,
            duration  : 200,
            swiping   : true
        },

        animating: false,

        boot: function() {

            // init code
            UI.ready(function(context) {

                UI.$("[data-uk-switcher]", context).each(function() {
                    var switcher = UI.$(this);

                    if (!switcher.data("switcher")) {
                        var obj = UI.switcher(switcher, UI.Utils.options(switcher.attr("data-uk-switcher")));
                    }
                });
            });
        },

        init: function() {

            var $this = this;

            this.on("click.uikit.switcher", this.options.toggle, function(e) {
                e.preventDefault();
                $this.show(this);
            });

            if (this.options.connect) {

                this.connect = UI.$(this.options.connect);

                this.connect.find(".uk-active").removeClass(".uk-active");

                // delegate switch commands within container content
                if (this.connect.length) {

                    // Init ARIA for connect
                    this.connect.children().attr('aria-hidden', 'true');

                    this.connect.on("click", '[data-uk-switcher-item]', function(e) {

                        e.preventDefault();

                        var item = UI.$(this).attr('data-uk-switcher-item');

                        if ($this.index == item) return;

                        switch(item) {
                            case 'next':
                            case 'previous':
                                $this.show($this.index + (item=='next' ? 1:-1));
                                break;
                            default:
                                $this.show(parseInt(item, 10));
                        }
                    });

                    if (this.options.swiping) {

                        this.connect.on('swipeRight swipeLeft', function(e) {
                            e.preventDefault();
                            if(!window.getSelection().toString()) {
                                $this.show($this.index + (e.type == 'swipeLeft' ? 1 : -1));
                            }
                        });
                    }
                }

                var toggles = this.find(this.options.toggle),
                    active  = toggles.filter(".uk-active");

                if (active.length) {
                    this.show(active, false);
                } else {

                    if (this.options.active===false) return;

                    active = toggles.eq(this.options.active);
                    this.show(active.length ? active : toggles.eq(0), false);
                }

                // Init ARIA for toggles
                toggles.not(active).attr('aria-expanded', 'false');
                active.attr('aria-expanded', 'true');

                this.on('changed.uk.dom', function() {
                    $this.connect = UI.$($this.options.connect);
                });
            }

        },

        show: function(tab, animate) {

            if (this.animating) {
                return;
            }

            if (isNaN(tab)) {
                tab = UI.$(tab);
            } else {

                var toggles = this.find(this.options.toggle);

                tab = tab < 0 ? toggles.length-1 : tab;
                tab = toggles.eq(toggles[tab] ? tab : 0);
            }

            var $this     = this,
                toggles   = this.find(this.options.toggle),
                active    = UI.$(tab),
                animation = Animations[this.options.animation] || function(current, next) {

                    if (!$this.options.animation) {
                        return Animations.none.apply($this);
                    }

                    var anim = $this.options.animation.split(',');

                    if (anim.length == 1) {
                        anim[1] = anim[0];
                    }

                    anim[0] = anim[0].trim();
                    anim[1] = anim[1].trim();

                    return coreAnimation.apply($this, [anim, current, next]);
                };

            if (animate===false || !UI.support.animation) {
                animation = Animations.none;
            }

            if (active.hasClass("uk-disabled")) return;

            // Update ARIA for Toggles
            toggles.attr('aria-expanded', 'false');
            active.attr('aria-expanded', 'true');

            toggles.filter(".uk-active").removeClass("uk-active");
            active.addClass("uk-active");

            if (this.options.connect && this.connect.length) {

                this.index = this.find(this.options.toggle).index(active);

                if (this.index == -1 ) {
                    this.index = 0;
                }

                this.connect.each(function() {

                    var container = UI.$(this),
                        children  = UI.$(container.children()),
                        current   = UI.$(children.filter('.uk-active')),
                        next      = UI.$(children.eq($this.index));

                        $this.animating = true;

                        animation.apply($this, [current, next]).then(function(){

                            current.removeClass("uk-active");
                            next.addClass("uk-active");

                            // Update ARIA for connect
                            current.attr('aria-hidden', 'true');
                            next.attr('aria-hidden', 'false');

                            UI.Utils.checkDisplay(next, true);

                            $this.animating = false;

                        });
                });
            }

            this.trigger("show.uk.switcher", [active]);
        }
    });

    Animations = {

        'none': function() {
            var d = UI.$.Deferred();
            d.resolve();
            return d.promise();
        },

        'fade': function(current, next) {
            return coreAnimation.apply(this, ['uk-animation-fade', current, next]);
        },

        'slide-bottom': function(current, next) {
            return coreAnimation.apply(this, ['uk-animation-slide-bottom', current, next]);
        },

        'slide-top': function(current, next) {
            return coreAnimation.apply(this, ['uk-animation-slide-top', current, next]);
        },

        'slide-vertical': function(current, next, dir) {

            var anim = ['uk-animation-slide-top', 'uk-animation-slide-bottom'];

            if (current && current.index() > next.index()) {
                anim.reverse();
            }

            return coreAnimation.apply(this, [anim, current, next]);
        },

        'slide-left': function(current, next) {
            return coreAnimation.apply(this, ['uk-animation-slide-left', current, next]);
        },

        'slide-right': function(current, next) {
            return coreAnimation.apply(this, ['uk-animation-slide-right', current, next]);
        },

        'slide-horizontal': function(current, next, dir) {

            var anim = ['uk-animation-slide-right', 'uk-animation-slide-left'];

            if (current && current.index() > next.index()) {
                anim.reverse();
            }

            return coreAnimation.apply(this, [anim, current, next]);
        },

        'scale': function(current, next) {
            return coreAnimation.apply(this, ['uk-animation-scale-up', current, next]);
        }
    };

    UI.switcher.animations = Animations;


    // helpers

    function coreAnimation(cls, current, next) {

        var d = UI.$.Deferred(), clsIn = cls, clsOut = cls, release;

        if (next[0]===current[0]) {
            d.resolve();
            return d.promise();
        }

        if (typeof(cls) == 'object') {
            clsIn  = cls[0];
            clsOut = cls[1] || cls[0];
        }

        UI.$body.css('overflow-x', 'hidden'); // fix scroll jumping in iOS

        release = function() {

            if (current) current.hide().removeClass('uk-active '+clsOut+' uk-animation-reverse');

            next.addClass(clsIn).one(UI.support.animation.end, function() {

                next.removeClass(''+clsIn+'').css({opacity:'', display:''});

                d.resolve();

                UI.$body.css('overflow-x', '');

                if (current) current.css({opacity:'', display:''});

            }.bind(this)).show();
        };

        next.css('animation-duration', this.options.duration+'ms');

        if (current && current.length) {

            current.css('animation-duration', this.options.duration+'ms');

            current.css('display', 'none').addClass(clsOut+' uk-animation-reverse').one(UI.support.animation.end, function() {
                release();
            }.bind(this)).css('display', '');

        } else {
            next.addClass('uk-active');
            release();
        }

        return d.promise();
    }

})(UIkit);

(function(UI) {

    "use strict";

    UI.component('tab', {

        defaults: {
            'target'    : '>li:not(.uk-tab-responsive, .uk-disabled)',
            'connect'   : false,
            'active'    : 0,
            'animation' : false,
            'duration'  : 200,
            'swiping'   : true
        },

        boot: function() {

            // init code
            UI.ready(function(context) {

                UI.$("[data-uk-tab]", context).each(function() {

                    var tab = UI.$(this);

                    if (!tab.data("tab")) {
                        var obj = UI.tab(tab, UI.Utils.options(tab.attr("data-uk-tab")));
                    }
                });
            });
        },

        init: function() {

            var $this = this;

            this.current = false;

            this.on("click.uikit.tab", this.options.target, function(e) {

                e.preventDefault();

                if ($this.switcher && $this.switcher.animating) {
                    return;
                }

                var current = $this.find($this.options.target).not(this);

                current.removeClass("uk-active").blur();

                $this.trigger("change.uk.tab", [UI.$(this).addClass("uk-active"), $this.current]);

                $this.current = UI.$(this);

                // Update ARIA
                if (!$this.options.connect) {
                    current.attr('aria-expanded', 'false');
                    UI.$(this).attr('aria-expanded', 'true');
                }
            });

            if (this.options.connect) {
                this.connect = UI.$(this.options.connect);
            }

            // init responsive tab
            this.responsivetab = UI.$('<li class="uk-tab-responsive uk-active"><a></a></li>').append('<div class="uk-dropdown uk-dropdown-small"><ul class="uk-nav uk-nav-dropdown"></ul><div>');

            this.responsivetab.dropdown = this.responsivetab.find('.uk-dropdown');
            this.responsivetab.lst      = this.responsivetab.dropdown.find('ul');
            this.responsivetab.caption  = this.responsivetab.find('a:first');

            if (this.element.hasClass("uk-tab-bottom")) this.responsivetab.dropdown.addClass("uk-dropdown-up");

            // handle click
            this.responsivetab.lst.on('click.uikit.tab', 'a', function(e) {

                e.preventDefault();
                e.stopPropagation();

                var link = UI.$(this);

                $this.element.children('li:not(.uk-tab-responsive)').eq(link.data('index')).trigger('click');
            });

            this.on('show.uk.switcher change.uk.tab', function(e, tab) {
                $this.responsivetab.caption.html(tab.text());
            });

            this.element.append(this.responsivetab);

            // init UIkit components
            if (this.options.connect) {
                this.switcher = UI.switcher(this.element, {
                    'toggle'    : '>li:not(.uk-tab-responsive)',
                    'connect'   : this.options.connect,
                    'active'    : this.options.active,
                    'animation' : this.options.animation,
                    'duration'  : this.options.duration,
                    'swiping'   : this.options.swiping
                });
            }

            UI.dropdown(this.responsivetab, {"mode": "click"});

            // init
            $this.trigger("change.uk.tab", [this.element.find(this.options.target).not('.uk-tab-responsive').filter('.uk-active')]);

            this.check();

            UI.$win.on('resize orientationchange', UI.Utils.debounce(function(){
                if ($this.element.is(":visible"))  $this.check();
            }, 100));

            this.on('display.uk.check', function(){
                if ($this.element.is(":visible"))  $this.check();
            });
        },

        check: function() {

            var children = this.element.children('li:not(.uk-tab-responsive)').removeClass('uk-hidden');

            if (!children.length) {
                this.responsivetab.addClass('uk-hidden');
                return;
            }

            var top          = (children.eq(0).offset().top + Math.ceil(children.eq(0).height()/2)),
                doresponsive = false,
                item, link, clone;

            this.responsivetab.lst.empty();

            children.each(function(){

                if (UI.$(this).offset().top > top) {
                    doresponsive = true;
                }
            });

            if (doresponsive) {

                for (var i = 0; i < children.length; i++) {

                    item  = UI.$(children.eq(i));
                    link  = item.find('a');

                    if (item.css('float') != 'none' && !item.attr('uk-dropdown')) {

                        if (!item.hasClass('uk-disabled')) {

                            clone = item[0].outerHTML.replace('<a ', '<a data-index="'+i+'" ');

                            this.responsivetab.lst.append(clone);
                        }

                        item.addClass('uk-hidden');
                    }
                }
            }

            this.responsivetab[this.responsivetab.lst.children('li').length ? 'removeClass':'addClass']('uk-hidden');
        }
    });

})(UIkit);

(function(UI){

    "use strict";

    UI.component('cover', {

        defaults: {
            automute : true
        },

        boot: function() {

            // auto init
            UI.ready(function(context) {

                UI.$("[data-uk-cover]", context).each(function(){

                    var ele = UI.$(this);

                    if(!ele.data("cover")) {
                        var plugin = UI.cover(ele, UI.Utils.options(ele.attr("data-uk-cover")));
                    }
                });
            });
        },

        init: function() {

            this.parent = this.element.parent();

            UI.$win.on('load resize orientationchange', UI.Utils.debounce(function(){
                this.check();
            }.bind(this), 100));

            this.on("display.uk.check", function(e) {
                if(this.element.is(":visible")) this.check();
            }.bind(this));

            this.check();

            if (this.element.is('iframe') && this.options.automute) {

                var src = this.element.attr('src');

                this.element.attr('src', '').on('load', function(){

                    this.contentWindow.postMessage('{ "event": "command", "func": "mute", "method":"setVolume", "value":0}', '*');

                }).attr('src', [src, (src.indexOf('?') > -1 ? '&':'?'), 'enablejsapi=1&api=1'].join(''));
            }
        },

        check: function() {

            this.element.css({
                'width'  : '',
                'height' : ''
            });

            this.dimension = {w: this.element.width(), h: this.element.height()};

            if (this.element.attr('width') && !isNaN(this.element.attr('width'))) {
                this.dimension.w = this.element.attr('width');
            }

            if (this.element.attr('height') && !isNaN(this.element.attr('height'))) {
                this.dimension.h = this.element.attr('height');
            }

            this.ratio     = this.dimension.w / this.dimension.h;

            var w = this.parent.width(), h = this.parent.height(), width, height;

            // if element height < parent height (gap underneath)
            if ((w / this.ratio) < h) {

                width  = Math.ceil(h * this.ratio);
                height = h;

            // element width < parent width (gap to right)
            } else {

                width  = w;
                height = Math.ceil(w / this.ratio);
            }

            this.element.css({
                'width'  : width,
                'height' : height
            });
        }
    });

})(UIkit);

(function(addon) {

    var component;

    if (window.UIkit) {
        component = addon(UIkit);
    }

    if (typeof define == "function" && define.amd) {
        define("uikit-autocomplete", ["uikit"], function(){
            return component || addon(UIkit);
        });
    }

})(function(UI){

    "use strict";

    var active;

    UI.component('autocomplete', {

        defaults: {
            minLength: 3,
            param: 'search',
            method: 'post',
            delay: 300,
            loadingClass: 'uk-loading',
            flipDropdown: false,
            skipClass: 'uk-skip',
            hoverClass: 'uk-active',
            source: null,
            renderer: null,

            // template

            template: '<ul class="uk-nav uk-nav-autocomplete uk-autocomplete-results">{{~items}}<li data-value="{{$item.value}}"><a>{{$item.value}}</a></li>{{/items}}</ul>'
        },

        visible  : false,
        value    : null,
        selected : null,

        boot: function() {

            // init code
            UI.$html.on("focus.autocomplete.uikit", "[data-uk-autocomplete]", function(e) {

                var ele = UI.$(this);

                if (!ele.data("autocomplete")) {
                    UI.autocomplete(ele, UI.Utils.options(ele.attr("data-uk-autocomplete")));
                }
            });

            // register outer click for autocompletes
            UI.$html.on("click.autocomplete.uikit", function(e) {
                if (active && e.target!=active.input[0]) active.hide();
            });
        },

        init: function() {

            var $this   = this,
                select  = false,
                trigger = UI.Utils.debounce(function(e) {
                    if(select) {
                        return (select = false);
                    }
                    $this.handle();
                }, this.options.delay);


            this.dropdown = this.find('.uk-dropdown');
            this.template = this.find('script[type="text/autocomplete"]').html();
            this.template = UI.Utils.template(this.template || this.options.template);
            this.input    = this.find("input:first").attr("autocomplete", "off");

            if (!this.dropdown.length) {
               this.dropdown = UI.$('<div class="uk-dropdown"></div>').appendTo(this.element);
            }

            if (this.options.flipDropdown) {
                this.dropdown.addClass('uk-dropdown-flip');
            }

            this.dropdown.attr('aria-expanded', 'false');

            this.input.on({
                "keydown": function(e) {

                    if (e && e.which && !e.shiftKey) {

                        switch (e.which) {
                            case 13: // enter
                                select = true;

                                if ($this.selected) {
                                    e.preventDefault();
                                    $this.select();
                                }
                                break;
                            case 38: // up
                                e.preventDefault();
                                $this.pick('prev', true);
                                break;
                            case 40: // down
                                e.preventDefault();
                                $this.pick('next', true);
                                break;
                            case 27:
                            case 9: // esc, tab
                                $this.hide();
                                break;
                            default:
                                break;
                        }
                    }

                },
                "keyup": trigger
            });

            this.dropdown.on("click", ".uk-autocomplete-results > *", function(){
                $this.select();
            });

            this.dropdown.on("mouseover", ".uk-autocomplete-results > *", function(){
                $this.pick(UI.$(this));
            });

            this.triggercomplete = trigger;
        },

        handle: function() {

            var $this = this, old = this.value;

            this.value = this.input.val();

            if (this.value.length < this.options.minLength) return this.hide();

            if (this.value != old) {
                $this.request();
            }

            return this;
        },

        pick: function(item, scrollinview) {

            var $this    = this,
                items    = UI.$(this.dropdown.find('.uk-autocomplete-results').children(':not(.'+this.options.skipClass+')')),
                selected = false;

            if (typeof item !== "string" && !item.hasClass(this.options.skipClass)) {
                selected = item;
            } else if (item == 'next' || item == 'prev') {

                if (this.selected) {
                    var index = items.index(this.selected);

                    if (item == 'next') {
                        selected = items.eq(index + 1 < items.length ? index + 1 : 0);
                    } else {
                        selected = items.eq(index - 1 < 0 ? items.length - 1 : index - 1);
                    }

                } else {
                    selected = items[(item == 'next') ? 'first' : 'last']();
                }

                selected = UI.$(selected);
            }

            if (selected && selected.length) {
                this.selected = selected;
                items.removeClass(this.options.hoverClass);
                this.selected.addClass(this.options.hoverClass);

                // jump to selected if not in view
                if (scrollinview) {

                    var top       = selected.position().top,
                        scrollTop = $this.dropdown.scrollTop(),
                        dpheight  = $this.dropdown.height();

                    if (top > dpheight ||  top < 0) {
                        $this.dropdown.scrollTop(scrollTop + top);
                    }
                }
            }
        },

        select: function() {

            if(!this.selected) return;

            var data = this.selected.data();

            this.trigger("selectitem.uk.autocomplete", [data, this]);

            if (data.value) {
                this.input.val(data.value).trigger('change');
            }

            this.hide();
        },

        show: function() {
            if (this.visible) return;
            this.visible = true;
            this.element.addClass("uk-open");

            if (active && active!==this) {
                active.hide();
            }

            active = this;

            // Update aria
            this.dropdown.attr('aria-expanded', 'true');

            return this;
        },

        hide: function() {
            if (!this.visible) return;
            this.visible = false;
            this.element.removeClass("uk-open");

            if (active === this) {
                active = false;
            }

            // Update aria
            this.dropdown.attr('aria-expanded', 'false');

            return this;
        },

        request: function() {

            var $this   = this,
                release = function(data) {

                    if(data) {
                        $this.render(data);
                    }

                    $this.element.removeClass($this.options.loadingClass);
                };

            this.element.addClass(this.options.loadingClass);

            if (this.options.source) {

                var source = this.options.source;

                switch(typeof(this.options.source)) {
                    case 'function':

                        this.options.source.apply(this, [release]);

                        break;

                    case 'object':

                        if(source.length) {

                            var items = [];

                            source.forEach(function(item){
                                if(item.value && item.value.toLowerCase().indexOf($this.value.toLowerCase())!=-1) {
                                    items.push(item);
                                }
                            });

                            release(items);
                        }

                        break;

                    case 'string':

                        var params ={};

                        params[this.options.param] = this.value;

                        UI.$.ajax({
                            url: this.options.source,
                            data: params,
                            type: this.options.method,
                            dataType: 'json'
                        }).done(function(json) {
                            release(json || []);
                        });

                        break;

                    default:
                        release(null);
                }

            } else {
                this.element.removeClass($this.options.loadingClass);
            }
        },

        render: function(data) {

            this.dropdown.empty();

            this.selected = false;

            if (this.options.renderer) {

                this.options.renderer.apply(this, [data]);

            } else if(data && data.length) {

                this.dropdown.append(this.template({"items":data}));
                this.show();

                this.trigger('show.uk.autocomplete');
            }

            return this;
        }
    });

    return UI.autocomplete;
});

(function(addon) {

    var component;

    if (window.UIkit) {
        component = addon(UIkit);
    }

    if (typeof define == "function" && define.amd) {
        define("uikit-form-password", ["uikit"], function(){
            return component || addon(UIkit);
        });
    }

})(function(UI){

    "use strict";

    UI.component('formPassword', {

        defaults: {
            "lblShow": "Show",
            "lblHide": "Hide"
        },

        boot: function() {
            // init code
            UI.$html.on("click.formpassword.uikit", "[data-uk-form-password]", function(e) {

                var ele = UI.$(this);

                if (!ele.data("formPassword")) {

                    e.preventDefault();

                    UI.formPassword(ele, UI.Utils.options(ele.attr("data-uk-form-password")));
                    ele.trigger("click");
                }
            });
        },

        init: function() {

            var $this = this;

            this.on("click", function(e) {

                e.preventDefault();

                if($this.input.length) {
                    var type = $this.input.attr("type");
                    $this.input.attr("type", type=="text" ? "password":"text");
                    $this.element.html($this.options[type=="text" ? "lblShow":"lblHide"]);
                }
            });

            this.input = this.element.next("input").length ? this.element.next("input") : this.element.prev("input");
            this.element.html(this.options[this.input.is("[type='password']") ? "lblShow":"lblHide"]);


            this.element.data("formPassword", this);
        }
    });

    return UI.formPassword;
});

(function(addon) {

    var component;

    if (window.UIkit) {
        component = addon(UIkit);
    }

    if (typeof define == "function" && define.amd) {
        define("uikit-notify", ["uikit"], function(){
            return component || addon(UIkit);
        });
    }

})(function(UI){

    "use strict";

    var containers = {},
        messages   = {},

        notify     =  function(options){

            if (UI.$.type(options) == 'string') {
                options = { message: options };
            }

            if (arguments[1]) {
                options = UI.$.extend(options, UI.$.type(arguments[1]) == 'string' ? {status:arguments[1]} : arguments[1]);
            }

            return (new Message(options)).show();
        },
        closeAll  = function(group, instantly){

            var id;

            if (group) {
                for(id in messages) { if(group===messages[id].group) messages[id].close(instantly); }
            } else {
                for(id in messages) { messages[id].close(instantly); }
            }
        };

    var Message = function(options){

        this.options = UI.$.extend({}, Message.defaults, options);

        this.uuid    = UI.Utils.uid("notifymsg");
        this.element = UI.$([

            '<div class="uk-notify-message">',
                '<a class="uk-close"></a>',
                '<div></div>',
            '</div>'

        ].join('')).data("notifyMessage", this);

        this.content(this.options.message);

        // status
        if (this.options.status) {
            this.element.addClass('uk-notify-message-'+this.options.status);
            this.currentstatus = this.options.status;
        }

        this.group = this.options.group;

        messages[this.uuid] = this;

        if(!containers[this.options.pos]) {
            containers[this.options.pos] = UI.$('<div class="uk-notify uk-notify-'+this.options.pos+'"></div>').appendTo('body').on("click", ".uk-notify-message", function(){

                var message = UI.$(this).data("notifyMessage");

                message.element.trigger('manualclose.uk.notify', [message]);
                message.close();
            });
        }
    };


    UI.$.extend(Message.prototype, {

        uuid: false,
        element: false,
        timout: false,
        currentstatus: "",
        group: false,

        show: function() {

            if (this.element.is(":visible")) return;

            var $this = this;

            containers[this.options.pos].show().prepend(this.element);

            var marginbottom = parseInt(this.element.css("margin-bottom"), 10);

            this.element.css({"opacity":0, "margin-top": -1*this.element.outerHeight(), "margin-bottom":0}).animate({"opacity":1, "margin-top": 0, "margin-bottom":marginbottom}, function(){

                if ($this.options.timeout) {

                    var closefn = function(){ $this.close(); };

                    $this.timeout = setTimeout(closefn, $this.options.timeout);

                    $this.element.hover(
                        function() { clearTimeout($this.timeout); },
                        function() { $this.timeout = setTimeout(closefn, $this.options.timeout);  }
                    );
                }

            });

            return this;
        },

        close: function(instantly) {

            var $this    = this,
                finalize = function(){
                    $this.element.remove();

                    if (!containers[$this.options.pos].children().length) {
                        containers[$this.options.pos].hide();
                    }

                    $this.options.onClose.apply($this, []);
                    $this.element.trigger('close.uk.notify', [$this]);

                    delete messages[$this.uuid];
                };

            if (this.timeout) clearTimeout(this.timeout);

            if (instantly) {
                finalize();
            } else {
                this.element.animate({"opacity":0, "margin-top": -1* this.element.outerHeight(), "margin-bottom":0}, function(){
                    finalize();
                });
            }
        },

        content: function(html){

            var container = this.element.find(">div");

            if(!html) {
                return container.html();
            }

            container.html(html);

            return this;
        },

        status: function(status) {

            if (!status) {
                return this.currentstatus;
            }

            this.element.removeClass('uk-notify-message-'+this.currentstatus).addClass('uk-notify-message-'+status);

            this.currentstatus = status;

            return this;
        }
    });

    Message.defaults = {
        message: "",
        status: "",
        timeout: 5000,
        group: null,
        pos: 'top-center',
        onClose: function() {}
    };

    UI.notify          = notify;
    UI.notify.message  = Message;
    UI.notify.closeAll = closeAll;

    return notify;
});

(function(addon) {

    var component;

    if (window.UIkit) {
        component = addon(UIkit);
    }

    if (typeof define == "function" && define.amd) {
        define("uikit-search", ["uikit"], function(){
            return component || addon(UIkit);
        });
    }

})(function(UI){

    "use strict";

    UI.component('search', {
        defaults: {
            msgResultsHeader   : 'Search Results',
            msgMoreResults     : 'More Results',
            msgNoResults       : 'No results found',
            template           : '<ul class="uk-nav uk-nav-search uk-autocomplete-results">\
                                      {{#msgResultsHeader}}<li class="uk-nav-header uk-skip">{{msgResultsHeader}}</li>{{/msgResultsHeader}}\
                                      {{#items && items.length}}\
                                          {{~items}}\
                                          <li data-url="{{!$item.url}}">\
                                              <a href="{{!$item.url}}">\
                                                  {{{$item.title}}}\
                                                  {{#$item.text}}<div>{{{$item.text}}}</div>{{/$item.text}}\
                                              </a>\
                                          </li>\
                                          {{/items}}\
                                          {{#msgMoreResults}}\
                                              <li class="uk-nav-divider uk-skip"></li>\
                                              <li class="uk-search-moreresults" data-moreresults="true"><a href="#" onclick="jQuery(this).closest(\'form\').submit();">{{msgMoreResults}}</a></li>\
                                          {{/msgMoreResults}}\
                                      {{/end}}\
                                      {{^items.length}}\
                                        {{#msgNoResults}}<li class="uk-skip"><a>{{msgNoResults}}</a></li>{{/msgNoResults}}\
                                      {{/end}}\
                                  </ul>',

            renderer: function(data) {

                var opts = this.options;

                this.dropdown.append(this.template({"items":data.results || [], "msgResultsHeader":opts.msgResultsHeader, "msgMoreResults": opts.msgMoreResults, "msgNoResults": opts.msgNoResults}));
                this.show();
            }
        },

        boot: function() {

            // init code
            UI.$html.on("focus.search.uikit", "[data-uk-search]", function(e) {
                var ele =UI.$(this);

                if (!ele.data("search")) {
                    UI.search(ele, UI.Utils.options(ele.attr("data-uk-search")));
                }
            });
        },

        init: function() {
            var $this = this;

            this.autocomplete = UI.autocomplete(this.element, this.options);

            this.autocomplete.dropdown.addClass('uk-dropdown-search');

            this.autocomplete.input.on("keyup", function(){
                $this.element[$this.autocomplete.input.val() ? "addClass":"removeClass"]("uk-active");
            }).closest("form").on("reset", function(){
                $this.value="";
                $this.element.removeClass("uk-active");
            });

            this.on('selectitem.uk.autocomplete', function(e, data) {
                if (data.url) {
                  location.href = data.url;
                } else if(data.moreresults) {
                  $this.autocomplete.input.closest('form').submit();
                }
            });

            this.element.data("search", this);
        }
    });
});

(function(addon) {

    var component;

    if (window.UIkit) {
        component = addon(UIkit);
    }

    if (typeof define == "function" && define.amd) {
        define("uikit-upload", ["uikit"], function(){
            return component || addon(UIkit);
        });
    }

})(function(UI){

    "use strict";

    UI.component('uploadSelect', {

        init: function() {

            var $this = this;

            this.on("change", function() {
                xhrupload($this.element[0].files, $this.options);
                var twin = $this.element.clone(true).data('uploadSelect', $this);
                $this.element.replaceWith(twin);
                $this.element = twin;
            });
        }
    });

    UI.component('uploadDrop', {

        defaults: {
            'dragoverClass': 'uk-dragover'
        },

        init: function() {

            var $this = this, hasdragCls = false;

            this.on("drop", function(e){

                if (e.dataTransfer && e.dataTransfer.files) {

                    e.stopPropagation();
                    e.preventDefault();

                    $this.element.removeClass($this.options.dragoverClass);
                    $this.element.trigger('dropped.uk.upload', [e.dataTransfer.files]);

                    xhrupload(e.dataTransfer.files, $this.options);
                }

            }).on("dragenter", function(e){
                e.stopPropagation();
                e.preventDefault();
            }).on("dragover", function(e){
                e.stopPropagation();
                e.preventDefault();

                if (!hasdragCls) {
                    $this.element.addClass($this.options.dragoverClass);
                    hasdragCls = true;
                }
            }).on("dragleave", function(e){
                e.stopPropagation();
                e.preventDefault();
                $this.element.removeClass($this.options.dragoverClass);
                hasdragCls = false;
            });
        }
    });


    UI.support.ajaxupload = (function() {

        function supportFileAPI() {
            var fi = document.createElement('INPUT'); fi.type = 'file'; return 'files' in fi;
        }

        function supportAjaxUploadProgressEvents() {
            var xhr = new XMLHttpRequest(); return !! (xhr && ('upload' in xhr) && ('onprogress' in xhr.upload));
        }

        function supportFormData() {
            return !! window.FormData;
        }

        return supportFileAPI() && supportAjaxUploadProgressEvents() && supportFormData();
    })();

    if (UI.support.ajaxupload){
        UI.$.event.props.push("dataTransfer");
    }

    function xhrupload(files, settings) {

        if (!UI.support.ajaxupload){
            return this;
        }

        settings = UI.$.extend({}, xhrupload.defaults, settings);

        if (!files.length){
            return;
        }

        if (settings.allow !== '*.*') {

            for(var i=0,file;file=files[i];i++) {

                if(!matchName(settings.allow, file.name)) {

                    if(typeof(settings.notallowed) == 'string') {
                       alert(settings.notallowed);
                    } else {
                       settings.notallowed(file, settings);
                    }
                    return;
                }
            }
        }

        var complete = settings.complete;

        if (settings.single){

            var count    = files.length,
                uploaded = 0,
                allow    = true;

                settings.beforeAll(files);

                settings.complete = function(response, xhr){

                    uploaded = uploaded + 1;

                    complete(response, xhr);

                    if (settings.filelimit && uploaded >= settings.filelimit){
                        allow = false;
                    }

                    if (allow && uploaded<count){
                        upload([files[uploaded]], settings);
                    } else {
                        settings.allcomplete(response, xhr);
                    }
                };

                upload([files[0]], settings);

        } else {

            settings.complete = function(response, xhr){
                complete(response, xhr);
                settings.allcomplete(response, xhr);
            };

            upload(files, settings);
        }

        function upload(files, settings){

            // upload all at once
            var formData = new FormData(), xhr = new XMLHttpRequest();

            if (settings.before(settings, files)===false) return;

            for (var i = 0, f; f = files[i]; i++) { formData.append(settings.param, f); }
            for (var p in settings.params) { formData.append(p, settings.params[p]); }

            // Add any event handlers here...
            xhr.upload.addEventListener("progress", function(e){
                var percent = (e.loaded / e.total)*100;
                settings.progress(percent, e);
            }, false);

            xhr.addEventListener("loadstart", function(e){ settings.loadstart(e); }, false);
            xhr.addEventListener("load",      function(e){ settings.load(e);      }, false);
            xhr.addEventListener("loadend",   function(e){ settings.loadend(e);   }, false);
            xhr.addEventListener("error",     function(e){ settings.error(e);     }, false);
            xhr.addEventListener("abort",     function(e){ settings.abort(e);     }, false);

            xhr.open(settings.method, settings.action, true);

            if (settings.type=="json") {
                xhr.setRequestHeader("Accept", "application/json");
            }

            xhr.onreadystatechange = function() {

                settings.readystatechange(xhr);

                if (xhr.readyState==4){

                    var response = xhr.responseText;

                    if (settings.type=="json") {
                        try {
                            response = UI.$.parseJSON(response);
                        } catch(e) {
                            response = false;
                        }
                    }

                    settings.complete(response, xhr);
                }
            };
            settings.beforeSend(xhr);
            xhr.send(formData);
        }
    }

    xhrupload.defaults = {
        'action': '',
        'single': true,
        'method': 'POST',
        'param' : 'files[]',
        'params': {},
        'allow' : '*.*',
        'type'  : 'text',
        'filelimit': false,

        // events
        'before'          : function(o){},
        'beforeSend'      : function(xhr){},
        'beforeAll'       : function(){},
        'loadstart'       : function(){},
        'load'            : function(){},
        'loadend'         : function(){},
        'error'           : function(){},
        'abort'           : function(){},
        'progress'        : function(){},
        'complete'        : function(){},
        'allcomplete'     : function(){},
        'readystatechange': function(){},
        'notallowed'      : function(file, settings){ alert('Only the following file types are allowed: '+settings.allow); }
    };

    function matchName(pattern, path) {

        var parsedPattern = '^' + pattern.replace(/\//g, '\\/').
            replace(/\*\*/g, '(\\/[^\\/]+)*').
            replace(/\*/g, '[^\\/]+').
            replace(/((?!\\))\?/g, '$1.') + '$';

        parsedPattern = '^' + parsedPattern + '$';

        return (path.match(new RegExp(parsedPattern, 'i')) !== null);
    }

    UI.Utils.xhrupload = xhrupload;

    return xhrupload;
});

window.pykit = {debug: true};

pykit.isArray = function(obj) {
	return Array.isArray ? Array.isArray(obj) : (Object.prototype.toString.call(obj) == '[object Array]');
};

pykit.isString = function(obj) {
	return Object.prototype.toString.call(obj) == '[object String]';
};

pykit.isObject = function(obj) {
	return Object.prototype.toString.call(obj) == '[object Object]';
};

pykit.isDefined = function(obj) {
	return obj !== undefined;
};

pykit.isUndefined = function(obj){
	return obj === undefined;
};

pykit.isNumber = function(obj) {
	return Object.prototype.toString.call(obj) == '[object Number]';
};

pykit.isBoolean = function(obj) {
	return Object.prototype.toString.call(obj) == '[object Boolean]';
};

pykit.isFunction = function(obj) {
	return Object.prototype.toString.call(obj) == '[object Function]';
};

pykit.assert = function(cond, msg, details){
	if (!cond) {
		if (details) pykit.log("debug", details);
		pykit.fail(msg);
	}
};

pykit.fail = function(message){
	pykit.log("error", message);
	if (pykit.debug !== false) {
		debugger;
		throw new Error(message);
	}
};

pykit.replaceString = function(str, obj) {
	for (var name in obj) {
		if (obj.hasOwnProperty(name)) {
			var regex = new RegExp("{" + name + "}", "gi");
			str = str.replace(regex, obj[name]);
		}
	}
	return str;
};

pykit.returnString = function(str) {
	return function() {return str;}
};

pykit.extend = function(target, src) {
	for (var i in src) {
		if (src.hasOwnProperty(i) && pykit.isDefined(src[i])) {
			target[i] = src[i];
		}
	}
	return target;
};

pykit.defaults = function(target, defaults) {
	for (var i in defaults) {
		if (defaults.hasOwnProperty(i) && !pykit.isDefined(target[i])) {
			target[i] = defaults[i];
		}
	}
	return target;
};

pykit.pluck = function(array, property) {
    var result = [];
    for (var i = 0; i < array.length; i ++) {
        result.push(array[i][property])
    }
    return result;
};

pykit.keys = function(object) {
	var results = [];
	for (var i in object) {
		if (object.hasOwnProperty(i)) results.push(i);
	}
	return results;
};


pykit.defUI = function(config) {
	var bases = Array.prototype.slice.call(arguments, 1);
	var cls = pykit.class(config, bases);
	pykit.UI[config.__name__] = cls;
	return cls;
};

pykit.class = function(config, bases) {
	pykit.assert(config.__name__, "__name__ not defined.", config);
	var compiled = pykit.extend({}, config);
	var init = config.__init__ ? [config.__init__] : [];
	var after = config.__after__ ? [config.__after__] : [];
	var $defaults = config.$defaults || {};
	var $setters = config.$setters || {};
	var $types = config.$types || {};

	var baseNames = [];
	for (var j=0; j < bases.length; j++) {
		pykit.assert(pykit.isDefined(bases[j]),
			pykit.replaceString("Invalid extension source from {name}", {name: config.__name__}));

		if (bases[j].__name__) {
			baseNames.push(bases[j].__name__);
		}
		else if (pykit.isFunction(bases[j])) {
			baseNames.push(bases[j].prototype.__name__);
			baseNames = baseNames.concat(bases[j].prototype.__base__);
		}
	}

	for (var base, i=0; i < bases.length; i++) {
		base = bases[i];
		if (pykit.isFunction(base)) {
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
			pykit.defaults($defaults, base.$defaults);
		}
		if (base.$types) {
			pykit.defaults($types, base.$types);
		}
        if (base.$setters) {
            pykit.defaults($setters, base.$setters);
        }
		pykit.defaults(compiled, base);
	}

	// Override special properties that are carried through the inheritance structure.
	compiled.__init__ = function() {
		for (var k=0; k < init.length; k++) {
			init[k].apply(this, arguments);
		}
	};
    compiled.__after__ = function() {
        for (var h=0; h < after.length; h++)
            after[h].apply(this, arguments);
    };
    compiled.__name__ = config.__name__;
    compiled.__base__ = baseNames;
	compiled.$defaults = $defaults;
	compiled.$types = $types;
	compiled.$setters = $setters;
	var constructor = function(config){
		pykit.defaults(config, this.$defaults);
		pykit.defaults(this, config);
		this.template = config.template || this.template;
		if (this.__init__) this.__init__(config);
		if (this.__after__) this.__after__(config);
		if (this.dispatch) this.dispatch("onInitialized");
	};
	constructor.prototype = compiled;

	return constructor;
};

pykit.echo = function(input) {
	return function() {
		return input;
	}
};

pykit.bind = function(func, object){
	return function() {
		return func.apply(object,arguments);
	};
};

pykit.delay = function(func, obj, params, delay){
	return window.setTimeout(function(){
		func.apply(obj, params);
	}, delay || 1);
};

pykit.uid = function(){
	if (!this._counter) this._counter = 0;
	this._counter++;
	return this._counter;
};

pykit.node = function(node) {
    return typeof node == "string" ? document.getElementById(node) : node;
};

pykit._events = {};
pykit.event = function(node, event, handler, master) {
	pykit.assert(node, pykit.replaceString("Invalid node as target for {event} event", {event: event}));
	pykit.assert(handler, pykit.replaceString("Invalid handler as target for {event} event", {event: event}));
	node = pykit.node(node);

	var id = pykit.uid();

	if (master)
		handler = pykit.bind(handler,master);
		
	pykit._events[id] = [node,event,handler];	//store event info, for detaching

	// Not officially supporting, or going out of the way to support IE10-
	node.addEventListener(event, handler);

	return id;
};

pykit.removeEvent = function(id){
	if (!id) return;
	pykit.assert(pykit._events[id], pykit.replaceString("Event with id {id} does not exist", {id: id}));

	var e = pykit._events[id];
	e[0].removeEventListener(e[1], e[2]);
		
	delete pykit._events[id];
};


pykit.log = function(type, message, explanation){
	if (message === undefined){
		message = type; type = "log";
	}
	if (window.console){
		if (window.console[type]) window.console[type](message || "");
		else window.console.log(type + ": " + message);
		if (explanation) window.console.log(explanation);
	}	
};


pykit.Dispatcher = {
    __name__: "Dispatcher",
	__init__: function(config) {
        this._eventsByName = {};
        this._eventsById = {};

		var listeners = config.on;
		if (listeners) {
			for(var i in listeners){
				if (listeners.hasOwnProperty(i)) {
					this.addListener(i, listeners[i]);
				}
			}
		}
	},
	dispatch: function(type, params){
		var handlers = this._eventsByName[type];
		if (handlers) {
            for(var i = 0; i < handlers.length; i++){
                handlers[i].apply(this, params);
            }
        }
	},
	addListener: function(name, func, id){
		pykit.assert(func, "Invalid event handler for " + name);

        id = id || pykit.uid();

		var handlers = this._eventsByName[name] || pykit.list();
		handlers.push(func);
		this._eventsByName[name] = handlers;
		this._eventsById[id]={ _func:func, _name:name };
		
		return id;
	},
	removeEvent: function(id){
		if(!this._eventsById[id]) return;
		
		var name = this._eventsById[id]._name;
		var func = this._eventsById[id]._func;
		
		var handlers = this._eventsByName[name];
        handlers.remove(func);

		delete this._eventsById[id];
	},
	hasEvent:function(type){
		var handlers = this._eventsByName[type];
		return handlers && handlers.length;
	}
};


pykit.ListMethods = {
	removeAt:function(index){
		if (index >= 0 && index < this.length) {
			return this.splice(index, 1)[0];
		}
		return false;
	},
	remove:function(value, thisArg){
		var index = (thisArg || this).indexOf(value);
		if (index >= 0) {
			this.splice(index, 1);
			return index;
		}
		return false;
	},
	contains: function(value) {
		return this.indexOf(value) != -1;
	},
	replace: function(oldValue, newValue) {
		this[this.indexOf(oldValue)] = newValue;
	},
	insertAt:function(index, item){
		index = index || 0;
		this.splice(index, 0, item);
	},
	removeWhere: function(key, value) {
		var i = 0;
		var results = [];
		while (i < this.length) {
			if (value == this[i][key]) {
				results.push(this.splice(i, 1));
			}
			else {
				i += 1;
			}
		}
		return results;
	},
	removeOne: function(key, value) {
		var i = 0;
		while (i < this.length) {
			if (value == this[i][key]) {
				return this.splice(i, 1);
			}
			else {i += 1;}
		}
		pykit.fail(pykit.replaceString("{key}: {value} cannot be removed in {array}",
			{key: key, value: value, array: this}));
	},
	indexWhere: function(key, value) {
		var results = [];
		for (var i=0; i < this.length; i++) {
			if (this[i][key] == value)
				results.push(i);
		}
		return results;
	},
	findWhere: function(key, value) {
		var results = [];
		for (var i=0; i < this.length; i++) {
			if (this[i][key] == value)
				results.push(this[i]);
		}
		return results;
	},
	findOne: function(key, value, error) {
		for (var i=0; i < this.length; i++) {
			// Apparently 1 == "1" in JS
			if (this[i][key] === value)
				return this[i];
		}
		if (error)
			pykit.fail(pykit.replaceString("{key}: {value} not found in {array}",
				{key: key, value: value, array: this}));
	},
	copy: function() {
		return this.slice();
	},
	first: function() {
		return this[0];
	},
	last: function() {
		return this[this.length-1];
	},
	until: function(operator, thisArg) {
		var copy = this.slice();
		var value, i=0;
		while (copy.length) {
			value = copy.shift();
			if (!operator.call(thisArg, value, copy)) {
				copy.push(value);
				i++;
			}
			else {
				i = 0;
			}
			if (copy.length == 0){
				break;
			}
			else if (i > copy.length) {
				pykit.fail("Infinite loop detected.");
				break;  // Infinite loop detected.
			}
		}
	},
	any: function(operator, thisArg) {
		for (var i=0; i < this.length; i++) {
			if (operator.call(thisArg || this, this[i], i)) {
				return true;
			}
		}
		return false;
	},
	all: function(operator, thisArg) {
		for (var i=0; i < this.length; i++) {
			if (!operator.call(thisArg || this, this[i], i)) {
				return false;
			}
		}
		return true;
	},
	each: function(operator, thisArg) {
		var result = [];
		for (var i=0; i < this.length; i++) {
			result[i] = operator.call(thisArg || this, this[i], i);
		}
		return result;
	},
	remap: function(operator, thisArg) {
		for (var i=0; i < this.length; i++) {
			this[i] = operator.call(thisArg || this, this[i]);
		}
	},
	filter:function(operator, thisArg) {
		var results = [];
		for (var i=0; i < this.length; i++) {
			if (operator.call(thisArg || this, this[i])){
				results.push(this[i]);
			}
		}
		return results;
	},
	insertSorted: function(item, cmp, thisArg) {
		for (var sort,i=this.length-1; i >= 0; i--) {
			sort = cmp.call(thisArg || this, item, this[i]);
			if (sort >= 0){
				this.insertAt(i, item);
				return i;
			}
		}
		this.push(item);
		return i;
	}
};


pykit.list = function(array){
	return pykit.extend((array || []), pykit.ListMethods);
};


pykit.selectors = {
	property: function(name) {
		var nested = name.split(".");
		return function(obj) {
			var result = obj;
			for (var i=0; i < nested.length; i++)
				result = result[nested[i]]
			return result;
		}
	}
};


pykit.css = {
	flex: {
		true: "uk-flex",
		false: "",
		inline: "uk-flex-inline"
	},
	selectable: {
		false: "unselectable"
	},
	order: {
		first: "uk-flex-order-first",
		last: "uk-flex-order-last",
		"first-sm": "uk-flex-order-first-small",
		"last-sm": "uk-flex-order-last-small",
		"first-md": "uk-flex-order-first-medium",
		"last-md": "uk-flex-order-last-medium",
		"first-lg": "uk-flex-order-first-large",
		"last-lg": "uk-flex-order-last-large",
		"first-xlg": "uk-flex-order-first-xlarge",
		"last-xlg": "uk-flex-order-last-xlarge"
	},
	wrap: {
		break: "uk-text-break",
		nowrap: "uk-text-nowrap",
		truncate: "uk-text-truncate"
	},
	padding: {
		"": "",
		none: "uk-padding-remove"
	},
	size: {
		"": "",
		none: "uk-flex-item-none",
		auto: "uk-flex-item-auto",
		flex: "uk-flex-item-1"
	},
	layout: {
		"": "",
		column: "uk-flex-column",
		row: "uk-flex-row",
		"row-reverse": "uk-flex-row-reverse",
		"column-reverse": "uk-flex-column-reverse"
	},
	align: {
		center: "uk-flex-center",
		right: "uk-flex-right",
		top: "uk-flex-top",
		middle: "uk-flex-middle",
		bottom: "uk-flex-bottom",
		"navbar-center": "uk-navbar-center"
	},
	spacing: {
		between: "uk-flex-space-between",
		around: "uk-flex-space-around"
	},
	display: {
		block: "uk-display-block",
		inline: "uk-display-inline",
		"inline-block": "uk-display-inline-block"
	},
	halign: {
		center: "uk-align-center",
		left: "uk-align-left",
		right: "uk-align-right",
		"left-md": "uk-align-medium-left",
		"right-md": "uk-align-medium-right"
	},
	valign: {
		middle: "uk-vertical-align-middle",
		top: "uk-vertical-align",
		bottom: "uk-vertical-align-bottom"
	},
	position: {
		"top": "uk-position-top",
		"top-left": "uk-position-top-left",
		"top-right": "uk-position-top-right",
		"bottom": "uk-position-bottom",
		"bottom-right": "uk-position-bottom-right",
		"bottom-left": "uk-position-bottom-left",
		"cover": "uk-position-cover",
		"relative": "uk-position-relative",
		"zindex": "uk-position-zindex"
	},
	fill: {
		height: "uk-height-1-1",
		width: "uk-width-100"
	},
	float: {
		left: "uk-float-left",
		right: "uk-float-right",
		clearfix: "uk-clearfix"
	},
	scroll: {
		x: "uk-overflow-container",
		y: "uk-scrollable-text"
	},
	hidden: {
		true: "uk-hidden",
		false: "",
		touch: "uk-hidden-touch",
		notouch: "uk-hidden-notouch",
		invisible: "uk-invisible",
		hover: "uk-hidden-hover",
		small: "uk-hidden-small",
		medium: "uk-hidden-medium",
		large: "uk-hidden-large"
	},
	margin: {
		"0": "uk-margin-remove",
		"none": "uk-margin-remove",
		"top-rm": "uk-margin-top-remove",
		"bottom-rm": "uk-margin-bottom-remove",
		"": "",
		"all-sm": ["uk-margin-small-left", "uk-margin-small-right", "uk-margin-small-top", "uk-margin-small-bottom"],
		"all": ["uk-margin-left", "uk-margin-right", "uk-margin-top", "uk-margin-bottom"],
		"lg": "uk-margin-large",
		"sm": "uk-margin-small",
		"top": "uk-margin-top",
		"top-lg": "uk-margin-large-top",
		"top-sm": "uk-margin-small-top",
		"bottom": "uk-margin-bottom",
		"bottom-lg": "uk-margin-large-bottom",
		"bottom-sm": "uk-margin-small-bottom",
		"left": "uk-margin-left",
		"left-lg": "uk-margin-large-left",
		"left-sm": "uk-margin-small-left",
		"right": "uk-margin-right",
		"right-lg": "uk-margin-large-right",
		"right-sm": "uk-margin-small-right"
	},
	inputWidth: {
		"": "",
		mini: "uk-form-width-mini",
		small: "uk-form-width-small",
		medium: "uk-form-width-medium",
		large: "uk-form-width-large",
		full: "uk-width-100"
	},
	screen: {
		"small": "uk-visible-small",
		"medium": "uk-visible-medium",
		"large": "uk-visible-large",
		"except-small": "uk-hidden-small",
		"except-medium": "uk-hidden-medium",
		"except-large": "uk-hidden-large"
	},
	device: {
		touch: "uk-hidden-notouch",
		notouch: "uk-hidden-touch"
	}
};


pykit.html = {
	createElement:function(name,attrs,html){
		attrs = attrs || {};
		var node = document.createElement(name);
		for (var attribute in attrs) {
			if (attrs.hasOwnProperty(attribute))
				node.setAttribute(attribute, attrs[attribute]);
		}
		if (attrs.style)
			node.style.cssText = attrs.style;
		if (attrs.class)
			node.className = attrs["class"];
		if (html)
			node.innerHTML=html;
		return node;
	},
	preventEvent: function(e) {
		if (e && e.preventDefault) e.preventDefault();
		e.defaultPrevented = true;
        e.cancelBubble=true;
	},
	addCSS: function(node, name) {
		if (name && name.length > 0)
			node.classList.add(name);
	},
	hasCSS: function(node, name) {
		return node.classList.contains(name);
	},
	removeCSS: function(node, name) {
		if (name && name.length > 0)
			node.classList.remove(name);
	}
};


pykit.ready = function(code){
	if (pykit._ready) code.call();
	else pykit._onload.push(code);
};
pykit._ready = false;
pykit._onload = [];


var ready = function(){
    pykit._ready = true;
	document.body.setAttribute("data-uk-observe", "");
    for (var i=0; i < pykit._onload.length; i++) {
        pykit._onload[i]();
    }
};
if (document.readyState == "complete") ready();
else pykit.event(window, "load", ready);



pykit.PropertySetter = {
    __name__: "PropertySetter",
    __check__: function(bases) {
        pykit.assert(bases.indexOf("PropertySetter") == bases.length - 1,
			pykit.replaceString("PropertySetter should be the last extension in {name}", {name: this.__name__}));
    },
	__init__: function(config){
		this.config = config;
        this._config = config;
    },
    __after__: function(config) {
        if (this.$setters) {
			var names = pykit.keys(config);
            for (var name,i=0; i < names.length; i++) {
				name = names[i];
				this.set(name, config[name]);
            }
        }
    },
	set: function(name, value){
        if (this.$setters.hasOwnProperty(name)) {
            pykit.assert(pykit.isFunction(this.$setters[name]),
                pykit.replaceString("Property setter for {name} is not a function.", {name: name}));
            this[name] = this.$setters[name].call(this, value);
			this._config[name] = value;
		}
	}
};



pykit.ComplexDataSetter = {
    __name__: "ComplexDataSetter",
    __check__: function(bases) {
        var iComplexDataSetter = bases.indexOf("ComplexDataSetter");
        pykit.assert(iComplexDataSetter != -1, "ComplexDataSetter is an abstract class, it cannot stand alone");
        pykit.assert(bases.indexOf("LinkedList") != -1, "ComplexDataSetter must extend LinkedList");
    },
    parse: function(value) {
		pykit.assert(pykit.isArray(value), "ComplexDataSetter parse() expected array, got: " + value, this);
		this.clearAll();
		for (var i=0; i<value.length; i++) {
			this.add(value[i]);
		}
    }
};



pykit.UI = function (config, parent) {
    var node = makeView(config);
	pykit.assert(node, pykit.replaceString("Unknown node view {view}.", {view: config.view}), config);
	if (parent)
		parent.appendChild(node.element);
    pykit.UI.views[config.id] = node;
    return node;

	function makeView(config) {
		if (config.view){
			var view = config.view;
			pykit.assert(pykit.UI[view], "unknown view:"+view);
			return new pykit.UI[view](config);
		}
		else if (config.cells)
			return new pykit.UI.flexgrid(config);
		else if (config.template)
			return new pykit.UI.element(config);
	}
};



pykit.UI.uid = function(name){
	this._names = this._names || {};
	this._names[name] = this._names[name] || 0;
	this._names[name]++;
	return "$" + name + this._names[name];
};



pykit.UI.views = {};
window.$$= pykit.$$ = function(id){
	if (!id)
		return null;
	else if (pykit.UI.views[id])
		return pykit.UI.views[id];
};

pykit.forIn = function(func, obj, thisArg) {
	var result = {};
	for (var i in obj) {
		if (obj.hasOwnProperty(i)) {
			result[i] = func.call(thisArg, obj[i], i);
		}
	}
	return result;
};



pykit.setCSS = function(cssOptions) {
	return pykit.forIn(function(options, property) {
		return function(value) {
			var oldValue = this._config[property];
			if (options[oldValue])
				pykit.html.removeCSS(this._html, options[oldValue]);

			var values = String(value).split(" ");

			for (var v, i=0; i < values.length; i++) {
				v = values[i];
				pykit.assert(options.hasOwnProperty(v),
					pykit.replaceString("Invalid value for '{property}': '{value}'!",
						{property: property, value: v}));

				var classes = options[v];
				if (pykit.isArray(classes))
					for (var c=0; c < classes.length; c++)
						pykit.html.addCSS(this._html, classes[c]);
				else
					pykit.html.addCSS(this._html, classes);
			}

			return value;
		}
	}, cssOptions);
};


pykit.CommonCSS = {
	__name__: "CommonCSS",
	__check__: function(bases) {
		pykit.assert(bases.indexOf("CommonCSS") != -1, "CommonCSS is an abstract class.");
		pykit.assert(bases.indexOf("PropertySetter") != -1, "CommonCSS must extend PropertySetter.");
	},
	$setters: pykit.setCSS(pykit.css)
};



pykit.CommonEvents = {
	__name__: "CommonEvents",
	__after__: function(config) {
		if (config.on) {
			if (config.on.onResize) {
				pykit.event(window, "resize", function(e) {
					this.dispatch("onResize", [e]);
				}, this);
			}
			if (config.on.onFocus) {
				pykit.event(this._html, "focus", function(e) {
					this.dispatch("onFocus", [e]);
				}, this);
			}
			if (config.on.onBlur) {
				pykit.event(this._html, "blur", function(e) {
					this.dispatch("onBlur", [e]);
				}, this);
			}
		}
	}
};



pykit.UI.element = pykit.defUI({
	__name__: "element",
	$defaults: {
		tooltipPos: 'bottom',
		dropdownEvent: "onClick",
		dropdownPos: 'bottom-center',
		margin: "left-sm right-sm top-sm bottom-sm",
		uploadURL: false,
		uploadSingle: false,
		uploadAllow: '*.(jpg|jpeg|gif|png)'
	},
	$setters: {
		disabled: function(value) {
			if (value)
				this.disable();
			else
				this.enable();
			return value;
		},
		css: function(value){
			if (pykit.isArray(value)) {
				for (var i=0; i<value.length; i++)
					pykit.html.addCSS(this._html, value[i]);
			}
			else pykit.html.addCSS(this._html, value);
			return value;
		},
		tooltip: function(value) {
			if (value) {
				this._html.setAttribute("data-uk-tooltip", "");
				this._html.setAttribute("title", value);
				this._html.setAttribute("data-uk-tooltip", pykit.replaceString("{pos: '{pos}'}",
					{pos: this._config.tooltipPos}));
			}
			else
				pykit.html.removeCSS(this._html, "data-uk-tooltip");

			return value;
		},
		dropdown: function(value) {
			var config = this._config;

			var dropdown = {
				view: "dropdown",
				pos: config.dropdownPos,
				dropdown: value
			};
			value.listStyle = "dropdown";
			value.margin = "";
			var ui = pykit.UI(dropdown, document.body);

			this._config.on = config.on || {};
			this.addListener(config.dropdownEvent, function(config, node, e) {
				ui.open(node, config, e);
			});
			this.dropdownPopup = ui;
			return value;
		},
		inline: function(value) {
			if (value)
				pykit.html.addCSS(this._html, "uk-display-inline");
		},
		uploader: function(value) {
			if (value) {
				pykit.html.addCSS(this._html, "uk-form-file");
				this._html.appendChild(this._uploadFileHTML());
			}
		}
	},
	__init__: function(config){
		if (!config.id) config.id = pykit.UI.uid(this.__name__);
		var node = pykit.node(config.id);
		pykit.assert(!node, pykit.replaceString("Node with id '{id}' already exists", {id: config.id}), config);

		this.element = this._html = pykit.html.createElement(config.htmlTag || "DIV", {id: config.id});
		if (config.tagClass)
			this.element.setAttribute("class", config.tagClass);
		if (config.width)
			this._html.style.width = config.width;
		if (config.height)
			this._html.style.height = config.height;
		if (config.minHeight)
			this._html.style.minHeight = config.minHeight;
		if (config.minWidth)
			this._html.style.minWidth = config.minWidth;
		if (config.maxWidth)
			this._html.style.maxWidth = config.maxWidth;
		if (config.maxHeight)
			this._html.style.maxHeight = config.maxHeight;
		if (config.marginBottom)
			this._html.style.marginBottom = config.marginBottom;
		if (config.marginTop)
			this._html.style.marginBottom = config.marginTop;
		if (config.marginLeft)
			this._html.style.marginLeft = config.marginLeft;
		if (config.marginRight)
			this._html.style.marginRight = config.marginRight;
	},
    __after__: function() {
        this.render();
    },
    render: function() {
        this._html.innerHTML = this.template(this._config, this);
    },
    template: function() {
        return ""
    },
	getNode:function(){
		return this._html;
	},
	isVisible: function(){
		return !pykit.html.hasCSS(this._html, "uk-hidden");
	},
	show:function(){
		this._config.hidden = false;
		pykit.html.removeCSS(this._html, "uk-hidden");
	},
	hide:function(){
		this._config.hidden = true;
		pykit.html.addCSS(this._html, "uk-hidden");
	},
	isEnabled:function(){
		return !this._html.getAttribute('disabled');
	},
	disable:function(){
		this._config.disabled = true;
		this._html.setAttribute('disabled', "");
	},
	enable:function() {
		this._html.removeAttribute('disabled');
	},
	_uploadFileHTML: function() {
		var config = this._config;
		var self = this;
		
		var settings = {
			single: config.uploadSingle,
			allow : config.uploadAllow,
			before: function(settings, files) {
				self.dispatch("onFilesAdded", [settings, files]);

				if (pykit.isString(config.uploadURL)) {
					settings.action = config.uploadURL;
				}
				else if (pykit.isFunction(config.uploadURL)) {
					settings.action = config.uploadURL.call(this, settings, files);
				}
				else {
					return false;
				}
				return true;
			}
		};
		var input = pykit.html.createElement("INPUT", {type: "file"});
		UIkit.uploadSelect(input, settings);

		return input;
	}
}, pykit.Dispatcher, pykit.CommonEvents, pykit.CommonCSS, pykit.PropertySetter);



pykit.UI.flexgrid = pykit.defUI({
	__name__: "flexgrid",
	$defaults: {
		layout: "row",
		flex: true,
		size: "flex",
		singleView: false
	},
	$setters: {
		cells: function(value) {
			pykit.assert(pykit.isArray(value), "The cells property must be an array for shell ui object.", this);

			this._cells = {};
			for (var config,i=0; i<value.length; i++) {
				config = value[i];
				config.margin = config.margin || "";

				var ui = pykit.UI(config);
				if (!this._config.singleView)
					this._html.appendChild(ui._html);
				this._cells[config.id] = ui;
			}

			if(this._config.singleView && this._config.defaultView)
				this.setChild(this._config.defaultView);

			return value;
		}
	},
	render: function() {
		// Do nothing, overwrites render function.
	},
	insertChild: function(index, config) {
		var ui = config.element ? config : pykit.UI(config);
		this._cells[config.id] = ui;
		return ui;
	},
	addChild: function(config) {
		var ui = config.element ? config : pykit.UI(config);
		this._cells[config.id] = ui;
		return ui;
	},
	removeChild: function(id) {
		if (id.element) {
			this._html.removeChild(id._html);
			delete this._cells[id.id];
		}
		else {
			this._html.removeChild(this._cells[id]._html);
			delete this._cells[id];
		}
	},
	getChild: function(id) {
		return this._cells[id];
	},
	activeChild: function() {
		return this._activeChild;
	},
	setChild: function(id) {
		this._setVisible('id', id);
		var newChild = this.getChild(id);
		this.dispatch("onChildChange",[this._activeChild, newChild]);
		this._activeChild = newChild;
	},
	showBatch:function(name, rerender){
		/**
		 * Tricky: Rendering input fields will cause problems with on-screen keyboards.
		 * However, to preserve the order of elements, will need to rerender.
		 */
		this._setVisible('batch', name, rerender);
		this.batch = name;
	},
	_setVisible: function(key, value, rerender) {
		pykit.forIn(function(item) {
			if (value.indexOf(item.config[key]) != -1 || item == value) {
				if (item._html.parentNode != this._html || rerender) {
					this._html.appendChild(item._html);
				}
			}
			else if (item._html.parentNode) {
				this._html.removeChild(item._html);
			}
		}, this._cells, this);
	}
}, pykit.UI.element);



pykit.ClickEvents = {
	$setters: {
		target: function(value) {
			this._html.setAttribute("target", value);
			return value;
		},
		href: function(value) {
			this._html.setAttribute("href", value);
			return value;
		}
	},
	__after__: function(config){
		if (config.click) {
            config.on = config.on || {};
            config.on.onItemClick = config.click;
        }
        pykit.event(this._html, "click", this._onClick, this);
		pykit.event(this._html, "contextmenu", this._onContext, this);
	},
	_onClick: function(e){
        this.dispatch("onClick", [this, this._html, e]);
	},
	_onContext: function(e) {
        this.dispatch("onContext", [this, this._html, e]);
	}
};



pykit.UI.modal = pykit.defUI({
	__name__: "modal",
    $defaults: {
        tagClass: "uk-modal",
        light: false,
		closeButton: true,
		flex: false,
		center: true,
		margin : "",
		size: "",
		layout: ""
    },
	__after__: function() {
		this.body = this._body = pykit.html.createElement("DIV", {class: "uk-modal-dialog"});
		this._html.appendChild(this._body);
	},
	$setters: {
        light: function(value) {
            if (value)
                pykit.html.addCSS(this._html, "uk-modal-dialog-lightbox");
			return value;
        },
		bodyWidth: function(value) {
			value = pykit.isNumber(value) ? value + "px": value;
			this._body.style.width = value;
			return value;
		},
        closeButton: function(value) {
            this._close = pykit.html.createElement("A",
				{class: "uk-modal-close uk-close"});
			if (this._body.firstChild) {
				this._body.insertBefore(this._close, this._body.firstChild);
			}
			else {
				this._body.appendChild(this._close);
			}
			return value;
        },
        body: function(value) {
			value.margin = value.margin || "";
			value.halign = "center";
            var innerBody = pykit.UI(value);
            this._body.appendChild(innerBody._html);
			this.bodyContent = innerBody;
			return value;
        },
        header: function(value) {
            this._header = pykit.html.createElement("DIV", {class: "uk-modal-header"});
            this._header.innerHTML = value;
            this._body.appendChild(this._header);
			return value;
        },
        footer: function(value) {
            this._footer = pykit.html.createElement("DIV", {class: "uk-modal-footer"});
            this._footer.innerHTML = value;
            this._body.appendChild(this._footer);
			return value;
        },
		caption: function(value) {
			if (!this._caption)
				this._caption = pykit.html.createElement("DIV", {class: "uk-modal-caption"});
			this._caption.innerHTML = value;
			this._body.appendChild(this._caption);
			return value;
		}
	},
	open: function() {
		this.dispatch("onOpen", [this._config, this._html]);
		UIkit.modal('#' + this._config.id, {center: this._config.center}).show();
		this.dispatch("onOpened", [this._config, this._html]);
	},
	close: function() {
		UIkit.modal('#' + this._config.id).hide();
	}
}, pykit.UI.flexgrid);



pykit.UI.button = pykit.defUI({
	__name__:"button",
	$defaults: {
		label: "",
        htmlTag: "BUTTON",
        tagClass: "uk-button",
		iconSize: "small"
	},
	$setters: pykit.setCSS({
		type: {
			primary: "uk-button-primary",
			success: "uk-button-success",
			danger: "uk-button-danger",
			link: "uk-button-link",
			"": ""
		},
		size: {
			mini: "uk-button-mini",
			small: "uk-button-small",
			large: "uk-button-large",
			"": ""
		},
		textAlign: {
			middle: "uk-text-middle",
			top: "uk-text-top",
			bottom: "uk-text-bottom"
		}
	}),
    template: function(config) {
		if (config.type  == "icon")
			return pykit.replaceString("<i class='{icon} uk-icon-{iconSize}'></i><span>{label}</span>",
				{icon: config.icon, label: config.label, iconSize: config.iconSize});
        else
			return pykit.replaceString("<span>{label}</span>", {label: config.label});
    }
}, pykit.ClickEvents, pykit.UI.element);



pykit.UI.icon = pykit.defUI({
	__name__:"icon",
	$defaults:{
		htmlTag: "A",
		tagClass: "uk-icon-hover",
		iconSize: "small",
		selectable: false,
		content: ""
	},
	__init__: function(config) {
		if (config.type == "button")
			config.tagClass = "uk-icon-button";
	},
	template:function(config){
		return pykit.replaceString("<i class='{icon} uk-icon-{iconSize}'>{content}</i>",
			{icon: config.icon, iconSize: config.iconSize, content: config.content});
	}
}, pykit.ClickEvents, pykit.UI.element);



pykit.UI.label = pykit.defUI({
	__name__:"label",
	$defaults: {
		label: "",
		htmlTag: "SPAN"
	},
	template:function(config){
		return config.label;
	}
}, pykit.UI.element);



pykit.UI.link = pykit.defUI({
	__name__:"link",
	$defaults: {
		label: "",
		htmlTag: "A",
		margin: ""
	},
	template:function(config){
		return config.label;
	}
}, pykit.ClickEvents, pykit.UI.element);



pykit.UI.image = pykit.defUI({
	__name__:"image",
	$defaults: {
		htmlTag: "IMG",
		margin: "",
		src: ""
	},
	$setters: {
		src: function(value) {
			this._html.setAttribute("src", value);
			return value;
		}
	},
	__after__: function() {
		pykit.event(this._html, "load", function(e) {
			this.dispatch("onLoad", [e])
		}, this);
	}
}, pykit.ClickEvents, pykit.UI.element);



pykit.UI.input = pykit.defUI({
	__name__: "input",
	$defaults: {
		htmlTag: "INPUT",
		inputWidth: "medium"
	},
	$setters: pykit.extend(pykit.setCSS(
		{
			class: {
				success: "uk-form-success",
				danger: "uk-form-danger",
				"": ""
			}
		}),
		{
			type: function(value) {
				this._html.setAttribute("type", value);
				pykit.html.addCSS(this._html, "uk-vertical-align-middle");
				return value;
			},
			checked: function(value) {
				if (value)
					this._html.setAttribute("checked", "");
			},
			placeholder: function (value) {
				this._html.setAttribute("placeholder", value);
				return value;
			}
		}
	),
	__after__: function() {
		pykit.event(this._html, "change", this._onChange, this);
	},
	_onChange: function() {
		this.dispatch("onChange");
	},
	getValue: function() {
		if (this._config.type == "checkbox") {
			return this._html.checked;
		}
		else return this._html.value;
	},
	setValue: function(value) {
		if (this._config.type == "checkbox") {
			this._html.setAttribute("checked", value);
		}
		else this._html.value = value;
	}
}, pykit.UI.element);



pykit.UI.password = pykit.defUI({
	__name__: "password",
	$defaults: {
		tagClass: "uk-form-password",
		inputWidth: "medium"
	},
	__after__: function() {
		pykit.html.addCSS(this._html, "uk-form");
		pykit.event(this._html, "change", this._onChange, this);
	},
	_onChange: function() {
		this.dispatch("onChange", [this.getValue()]);
	},
	template: function() {
		return "<input type='password' style='width:100%'><a class='uk-form-password-toggle' data-uk-form-password>Show</a>";
	},
	getValue: function() {
		return this._html.firstChild.value;
	},
	setValue: function(value) {
		this._html.firstChild.value = value;
	}
}, pykit.UI.element);



pykit.defUI({
	__name__: "autocomplete",
	$defaults: {
		tagClass: "uk-autocomplete",
		placeholder: "",
		minLength: 0,
		sources: [],
		autocomplete: function(release) {
			var searchValue = this.getValue();
			release(pykit.ListMethods.filter.call(this._getSource(),
				function(item) {
					return item.value.contains(searchValue);
				}));
		}
	},
	$setters: {
		sources: function(value) {
			if (pykit.isFunction(value))
				this._getSource = value;
			else
				this._getSource = pykit.echo(value);
			return value;
		},
		autocomplete: function(value) {
			var self = this;
			this._html.style.wordBreak = "break-word";
			self._autocomplete = UIkit.autocomplete(self._html,
				{source: pykit.bind(value, self), minLength: self._config.minLength});
			self._autocomplete.dropdown.attr("style", "width:100%");
			self._autocomplete.on("selectitem.uk.autocomplete", function(e, obj) {
				self.dispatch("onChange", [obj.value]);
				self.dispatch("onAutocomplete", [obj]);
			});
		}
	},
	template: function(config) {
		return pykit.replaceString(
			'<input type="text" placeholder="{placeholder}" style="width:100%">',
			{placeholder: config.placeholder});
	}
}, pykit.UI.password);



pykit.UI.search = pykit.defUI({
	__name__:"search",
	$defaults: {
		tagClass: "uk-search",
		placeholder: "search..."
	},
	__after__: function() {
		pykit.event(this._html, "change", this._onChange, this);
		pykit.event(this._html, "keyup", function (e) {
			this.dispatch("onKeyUp", [e, this._html, this]);
		}, this);
	},
	_onChange: function () {
		this.dispatch("onChange");
	},
	template: function(obj) {
		return pykit.replaceString('<input class="uk-search-field" type="search" placeholder="{placeholder}">',
			{placeholder: obj.placeholder})
	},
	getValue: function() {
		return this._html.firstChild.value;
	},
	setValue: function(value) {
		this._html.firstChild.value = value;
	}
}, pykit.UI.element);



pykit.UI.dropdown = pykit.defUI({
	__name__: "dropdown",
	$defaults: {
		mode: "click",
		pos: "bottom-center",
		margin: "none",
		padding: "none",
		dropdownCSS: "uk-dropdown-small uk-dropdown-close",
		dropdownStyle: "close",
		blank: false
	},
	$setters: {
		dropdown: function (value) {
			var dropdown = pykit.html.createElement("DIV",
				{class: this._dropdownCSS()});
			var ui = pykit.UI(value);
			dropdown.appendChild(ui._html);
			this._html.appendChild(dropdown);
			this._inner = ui;
			return value;
		}
	},
	__after__: function(config) {
		this._dropdown = UIkit.dropdown(this._html, {pos: config.pos});
	},
	_dropdownCSS: function() {
		var config = this._config;
		var result = config.dropdownCSS;
		result += config.blank ? " uk-dropdown-blank" : " uk-dropdown";
		return result;
	},
	_position: function(node, e) {
		var origin = node.getBoundingClientRect();
		var dropdown = this._html.firstChild.getBoundingClientRect();
		var width = dropdown.width,
			height = dropdown.height;
		var variants =  {
			"bottom-left"   : {top: origin.height + 5, left: 0},
			"bottom-right"  : {top: origin.height + 5, left: origin.width - width},
			"bottom-center" : {top: origin.height + 5, left: origin.width / 2 - width / 2},
			"top-left"      : {top: -5 - height, left: 0},
			"top-right"     : {top: -5 - height, left: origin.width - width},
			"top-center"    : {top: -5 - height, left: origin.width / 2 - width / 2},
			"left-top"      : {top: 0, left: -5 - width},
			"left-bottom"   : {top: origin.height - height, left: -5 - width},
			"left-center"   : {top: origin.height / 2 - height / 2, left: -5 - width},
			"right-top"     : {top: 0, left: origin.width + 5},
			"right-bottom"  : {top: origin.height - height, left: origin.width + 5},
			"right-center"  : {top: origin.height / 2 - height / 2, left: origin.width + 5}
		};
		this._html.style.top = (origin.top + variants[this._config.pos].top) + "px";
		this._html.style.left = (origin.left + variants[this._config.pos].left) + "px";
		this._html.style.position = "absolute";
	},
	open: function(node, master, e) {
		this.dispatch("onOpen", [master, node, this]);
		this._inner.dispatch("onOpen", [master, node, this]);

		this._inner.master = master;
		this._inner.parent = this;
		this._dropdown.show();
		this._position(node, e);

		this.dispatch("onOpened", [master, node, this]);
		this._inner.dispatch("onOpened", [master, node, this]);
	},
	close: function(node, master) {
		this.dispatch("onClose", [master, node, this]);
		this._inner.dispatch("onClose", [master, node, this]);
		pykit.html.removeCSS(this._html, 'uk-open');
		this.dispatch("onClosed", [master, node, this]);
		this._inner.dispatch("onClosed", [master, node, this]);
	}
}, pykit.UI.flexgrid);



pykit.LinkedList = {
    __name__: "LinkedList",
    __check__: function(bases) {
        pykit.assert(bases.indexOf('LinkedList') != -1, "LinkedList is an abstract class and must be extended.");
        pykit.assert(bases.indexOf('Dispatcher') != -1, "LinkedList must extend Dispatcher.");
    },
    __init__: function() {
        this.headNode = null;
		this.tailNode = null;
		this._nodeList = [];
    },
	id:function(data) {
		return data.id || (data.id=pykit.UI.uid("data"));
	},
	getItem: function(id){
		return this.findOne('id', id);
	},
	count: function() {
		return this._nodeList.length;
	},
	updateItem: function(item, update){
        pykit.assert(update, pykit.replaceString("Invalid update object for Id {id}", {id:item.id}));

		this.remove(item);
		pykit.extend(item, update, true);
		this.add(item);
	},
	refresh:function(){
		this.dispatch("onRefresh");
	},
	pluck: function(name) {
		return this.each(function(item) {
			return item[name]
		});
	},
    each: function(func, thisArg) {
		var node = this.headNode;
		var results = [];
		while (node) {
			results.push(func.call(thisArg || this, node));
			node = node.$tailNode;
		}
		return results;
    },
	add: function(obj) {
		return this.insertAfter(obj);
	},
	insertBefore:function(obj, node){
        pykit.assert(pykit.isObject(obj), pykit.replaceString("Expected object, got {obj}", {obj: obj}));
        pykit.assert(this._nodeList.indexOf(obj) == -1, "Circular reference detected with node insert!");

		obj.id = this.id(obj);
		this.dispatch("onAdd", [obj]);

		if (this.headNode == null && this.tailNode == null) {
			this.headNode = obj;
			this.tailNode = obj;
			obj.$headNode = obj.$tailNode = null;
		}
		else {
			node = node || this.headNode;
			if (node.$headNode) {
				node.$headNode.$tailNode = obj;
			}
			obj.$headNode = node.$headNode;
			obj.$tailNode = node;
			node.$headNode = obj;

			if (node == this.headNode)
				this.headNode = obj;
		}
		this._nodeList.push(obj);

		this.dispatch("onAdded",[obj]);

		return obj.id;
	},
	insertAfter:function(obj, node){
		pykit.assert(pykit.isObject(obj), pykit.replaceString("Expected object, got {obj}", {obj: obj}));
		pykit.assert(this._nodeList.indexOf(obj) == -1, "Circular reference detected with node insert!");

		obj.id = this.id(obj);
		this.dispatch("onAdd", [obj]);

		if (this.headNode == null && this.tailNode == null) {
			this.headNode = obj;
			this.tailNode = obj;
			obj.$headNode = obj.$tailNode = null;
		}
		else {
			node = node || this.tailNode;
			if (node.$tailNode) {
				node.$tailNode.$headNode = obj;
			}
			obj.$tailNode = node.$tailNode;
			obj.$headNode = node;
			node.$tailNode = obj;

			if (node == this.tailNode)
				this.tailNode = obj;
		}
		this._nodeList.push(obj);

		this.dispatch("onAdded",[obj]);

		return obj.id;
	},
	remove: function(obj) {
		pykit.assert(pykit.isObject(obj), pykit.replaceString("Expected object, got {obj}", {obj: obj}));

        this.dispatch("onDelete",[obj]);

		if (obj.$headNode) obj.$headNode.$tailNode = obj.$tailNode;
		if (obj.$tailNode) obj.$tailNode.$headNode = obj.$headNode;
		if (obj == this.headNode)
			this.headNode = obj.$tailNode;
		if (obj == this.tailNode)
			this.tailNode = obj.$headNode;
		obj.$tailNode = obj.$headNode = null;

		if (this._nodeList.indexOf(obj) != -1)
			pykit.ListMethods.remove.call(this._nodeList, obj);

		this.dispatch("onDeleted",[obj]);
		return obj;
	},
	clearAll:function() {
		this.headNode = null;
		this.tailNode = null;
		this._nodeList = [];
		this.dispatch("onClearAll",[]);
	},
	previous: function(node) {
		return node.$headNode;
	},
	next: function(node) {
		return node.$tailNode;
	},
	findOne: function(key, value, beginNode) {
		var node = beginNode || this.headNode;
		while (node) {
			// Apparently 1 == "1" in JS
			if (node[key] === value)
				return node;
			node = node.$tailNode;
		}
	},
	findFirst: function (cond, beginNode, thisArg) {
		var node = beginNode || this.headNode;
		while(node) {
			if (cond.call(thisArg || this, node)) {
				return node;
			}
			node = node.$tailNode;
		}
	},
	findLast: function (cond, beginNode, thisArg) {
		var node = beginNode || this.headNode;
		var lastNode = null;
		while(node) {
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




pykit.UI.stack = pykit.defUI({
    __name__: "stack",
	$setters: {
		filter: function(value) {
			pykit.assert(pykit.isFunction(value), "Expected function for 'filter', got: " + value);
			this._filter = value;
			return value;
		},
		droppable: function(value) {
			if (pykit.isFunction(value))
				this._droppable = value;
			return value;
		}
	},
    __after__: function(config){
        this.addListener("onAdded", this._onAdded);
        this.addListener("onDeleted", this._onDeleted);
        this.addListener("onRefresh", this._onRefresh);
        this.addListener("onClearAll", this._onClearAll);
		if (config.data) {
			this.parse(config.data);
		}
    },
    __init__: function() {
        this._itemNodes = {};
    },
    getItemNode: function(id) {
		return this._itemNodes[id];
    },
	render: function() {
		// Do nothing, overwrites render function.
	},
	_droppable: function() {
		return true;
	},
	_filter: function() {
		return true;
	},
	_containerHTML: function() {
        return this._html;
    },
    _itemHTML: function() {
        return pykit.html.createElement("DIV");
    },
    _innerHTML: function() {
        return {id: pykit.UI.uid("item")};
    },
    _createItem: function(obj) {
        var item = this._itemHTML(obj);
        item.setAttribute('data-id', obj.id);
        this._innerHTML(item, obj);
		this._itemNodes[obj.id] = item;
		return item;
    },
	_onAdded: function(obj) {
		if (obj.$tailNode)
			this._containerHTML().insertBefore(this._createItem(obj), this.getItemNode(obj.$tailNode.id));
		else
			this._containerHTML().appendChild(this._createItem(obj));

		if (obj.$parent) {
			var parent = this.getItem(obj.$parent);
			var parentNode = this.getItemNode(parent.id);
			parentNode.parentNode.replaceChild(this._createItem(parent), parentNode);
		}
	},
	_onDeleted: function(obj) {
		if (obj.$parent) {
			var parent = this.getItem(obj.$parent);
			parent.$children.remove(obj);
			var parentNode = this.getItemNode(parent.id);
			parentNode.parentNode.replaceChild(this._createItem(parent), parentNode);
		}
		this._containerHTML().removeChild(this.getItemNode(obj.id));
		delete this._itemNodes[obj.id];
	},
	_onRefresh: function() {
		this._onClearAll();
		this._itemNodes = {};
		this.each(function(node) {
			this._itemNodes[node.id] = this._createItem(node);
			if (this._filter(node))
				this._containerHTML().appendChild(this._itemNodes[node.id]);
		}, this);
	},
	_onClearAll: function() {
		for (var j in this._itemNodes) {
			if (this._itemNodes.hasOwnProperty(j) && this._itemNodes[j].parentNode)
				this._containerHTML().removeChild(this._itemNodes[j]);
		}
	},
	showBatch:function(name) {
		this.batch = name;
		this.each(function(item) {
			if (name.indexOf(item.batch) != -1)
				pykit.html.removeCSS(this._itemNodes[item.id], "uk-hidden");
			else
				pykit.html.addCSS(this._itemNodes[item.id], "uk-hidden");
		}, this);
	}
}, pykit.LinkedList, pykit.ComplexDataSetter, pykit.UI.element);



pykit.UI.list = pykit.defUI({
	__name__:"list",
	$defaults: {
		htmlTag: "UL",
		listStyle: "list",
		itemStyle: "",
		dropdownEvent: "onItemClick"
	},
	$setters: pykit.extend(
		pykit.setCSS({
			listStyle: {
				"nav": "uk-nav",
				"side": ["uk-nav", "uk-nav-side"],
				"offcanvas": ["uk-nav", "uk-nav-offcanvas"],
				"dropdown": ["uk-nav", "uk-nav-dropdown", "uk-nav-side"],
				"stripped": ["uk-nav", "uk-list", "uk-list-stripped"],
				"line": ["uk-list", "uk-list-line"],
				"subnav": "uk-subnav",
				"navbar": "uk-navbar-nav",
				"subnav-line": ["uk-subnav", "uk-subnav-line"],
				"subnav-pill": ["uk-subnav", "uk-subnav-pill"],
				"list": "uk-list",
				"tab": "uk-tab",
				"tab-flip": "uk-tab-flip",
				"tab-bottom": "uk-tab-bottom",
				"tab-center": "uk-tab-center",
				"tab-left": "uk-tab-left",
				"tab-right": "uk-tab-right",
				"": ""
			}
		}),
		{
			accordion: function(value) {
				if (value)
					this._html.setAttribute("data-uk-nav", "");
				return value;
			},
			tab: function(value) {
				if (value) {
					this._html.setAttribute("data-uk-tab", "");
					this.addListener("onItemClick", this._onTabClick)
				}
				return value;
			}
		}
	),
	_onTabClick: function(item) {
		if (!this.isSelected(item))
			this.dispatch("onItemSelectionChanged", [item]);
	},
	setActiveLabel: function(label) {
		this.setActive("label", label)
	},
	setActive: function(key, value) {
		this.unselectAll();
		var item = this.findOne(key, value);
		pykit.assert(item, pykit.replaceString("Could not find {key} {value} in {id}.", {key: key, value: value, id: this.id}));
		this.select(item);
	},
	isSelected: function(target) {
		if (pykit.isString(target))
			target = this.getItem(target);
		return pykit.html.hasCSS(this.getItemNode(target.id), "uk-active");
	},
	select: function(target) {
		if (pykit.isString(target))
			target = this.getItem(target);
		pykit.html.addCSS(this.getItemNode(target.id), "uk-active");
	},
	unselectAll: function() {
		this.each(function(item) {
			pykit.html.removeCSS(this.getItemNode(item.id), "uk-active");
		}, this);
	},
    _itemHTML: function(config) {
        var itemStyle = config.$css || this._config.itemStyle;

        var li = pykit.html.createElement("LI",
            {class: itemStyle
            + (config.header ? "uk-nav-header" : "")
            + (config.divider ? "uk-nav-divider" : "")});

        if (!config.header && !config.divider) {
            this._attachNodeEvents(li, config);
        }
        return li;
    },
	_innerHTML: function(parentNode, config) {
		if (config.view) {
			var ui = pykit.UI(config);
			parentNode.appendChild(ui._html);
		}
		else if (config.header) {
			parentNode.innerHTML = config.label;
		}
		else if (config.divider) {
		}
		else {
			var link = new pykit.UI.link(config);
			parentNode.appendChild(link._html);
			this._addCloseHTML(link._html, config);
		}
		return ui;
	},
	_addCloseHTML: function(node, item) {
		if (item.$close) {
			var close = pykit.html.createElement("SPAN", {class: "uk-close"});

			pykit.event(close, "click", function(e) {
				pykit.html.preventEvent(e);
				this.dispatch("onItemClose", [item]);

				if (this.isSelected(item) && this.count() ) {
					var nextItem = this.previous(item) || this.next(item);
					if (nextItem) {
						this.select(nextItem);
						this.dispatch("onItemSelectionChanged", [nextItem]);
					}
				}

				this.remove(item);

				this.dispatch("onItemClosed", [item]);
			}, this);

			node.appendChild(close);
		}
	},
	_attachNodeEvents: function(node, config) {
		pykit.event(node, "click", function(e) {
			pykit.html.preventEvent(e);
			this.dispatch("onItemClick", [config, node, e]);
		}, this);

		if (this.context && config.context !== false) {
			pykit.event(node, "contextmenu", function (e) {
				pykit.html.preventEvent(e);
				this.dispatch("onItemContext", [config, node, e]);
			}, this);
		}

		if (this.droppable && config.droppable !== false) {
			pykit.event(node, "drop", function(e) {
				pykit.html.preventEvent(e);
				if (this._droppable(config, this._draggedItem))
					this.dispatch("onItemDrop", [config, this._draggedItem, node, e]);
				this._draggedItem = null;
			}, this);

			pykit.event(node, "dragover", function(e) {
				pykit.html.preventEvent(e);
				this.dispatch("onItemDragOver", [config, node, e]);
			}, this);

			pykit.event(node, "dragenter", function(e) {
				pykit.html.preventEvent(e);
				this.dispatch("onItemDragEnter", [config, node, e]);
			}, this);

			pykit.event(node, "dragleave", function(e) {
				pykit.html.preventEvent(e);
				this.dispatch("onItemDragLeave", [config, node, e]);
			}, this);
		}

		if (this.draggable && config.draggable !== false) {
			node.setAttribute("draggable", "true");

			pykit.event(node, "dragstart", function(e) {
				this._draggedItem = config;
				this.dispatch("onItemDragStart", [config, node, e]);
			}, this);

			pykit.event(node, "dragend", function(e) {
				this._draggedItem = null;
				this.dispatch("onItemDragEnd", [config, document, e]);
			}, this);
		}
	}
}, pykit.UI.stack);



pykit.defUI({
	__name__: "tree",
	$defaults:{
		listStyle: "side",
		indentWidth: 15,
		dataTransfer: 'id',
		draggable: true,
		droppable: function(item) {
			return item.$branch;
		}
	},
	__after__: function() {
		this.addListener("onItemClick", this.toggle);
		this.addListener("onItemDragStart", this._dragStart);
		this.addListener("onItemDragOver", this._dragOver);
		this.addListener("onItemDragLeave", this._dragLeave);
		this.addListener("onItemDragEnd", this._dragEnd);
		this.addListener("onItemDrop", this._dragLeave);
	},
	_innerHTML: function(parentNode, config) {
		parentNode.innerHTML = this.template(config);
	},
	_dragStart: function(item, node, e) {
		e.dataTransfer.setData('text/plain', node[this._config.dataTransfer]);
		pykit.html.addCSS(this.getItemNode(item.id), "uk-hidden");
		if (item.$branch)
			this._hideChildren(item);
	},
	_dragEnd: function(item) {
		pykit.html.removeCSS(this.getItemNode(item.id), "uk-hidden");
		pykit.html.removeCSS(this.getItemNode(item.id), "uk-block-primary");
		if (item.$branch && !item.$closed)
			this._showChildren(item);
	},
	_dragOver: function(item) {
		if (this._droppable(item, this._draggedItem))
			pykit.html.addCSS(this.getItemNode(item.id), "uk-block-primary");
	},
	_dragLeave: function(item) {
		pykit.html.removeCSS(this.getItemNode(item.id), "uk-block-primary");
	},
	_showChildren: function(item) {
		item.$children.until(function(child, queue) {
			pykit.html.removeCSS(this.getItemNode(child.id), "uk-hidden");

			if (item.$branch && !child.$closed) {
				for (var i=0; i<child.$children.length; i++) {
					queue.push(child.$children[i]);
				}
			}
			return true;
		}, this);
	},
	_hideChildren: function(item) {
		item.$children.until(function(child, queue) {
			pykit.html.addCSS(this.getItemNode(child.id), "uk-hidden");

			if (item.$branch) {
				for (var i=0; i<child.$children.length; i++) {
					queue.push(child.$children[i]);
				}
			}
			return true;
		}, this);
	},
	add: function(obj) {
		obj.$children = pykit.list();
		if (!obj.$parent) {
			obj.$depth = 0;
			this.insertAfter(obj);
		}
		else {
			var parent = this.findOne('id', obj.$parent);
			obj.$depth = parent.$depth + 1;
			parent.$branch = true;
			parent.$children.push(obj);
			var refChild = this.findLast(function(other) {
				return other.id == obj.$parent || obj.$depth < other.$depth  ||
					(obj.$parent == other.$parent && (obj.label > other.label || other.$branch > obj.$branch));
			}, parent, this);
			this.insertAfter(obj, refChild);
		}
	},
	remove: function(obj) {
		if (obj.$branch) {
			for (var i=0; i<obj.$children.length; i++)
				this.remove(obj.$children[i]);
		}
		pykit.LinkedList.remove.call(this, obj);
	},
	template: function(config) {
		return pykit.replaceString('<a><i class="uk-icon-{icon}" style="margin-left: {margin}px"></i><span class="uk-margin-small-left">{label}</span></a>',
			{
				icon: config.$branch ?
					(config.$children.length ?
						"folder" :
						"folder-o"):
					"file-o", label: config.label,
				margin: config.$depth*this.indentWidth
			})
	},
	open: function(item) {
		if (!item.$branch || !item.$closed) return;

		this.dispatch("onOpen", [item.id]);

		item.$closed = false;
		var node = this.getItemNode(item.id);
		node.parentNode.replaceChild(this._createItem(item), node);

		this._showChildren(item);

		this.dispatch("onOpened", [item.id]);

		if (item.$parent)
			this.open(item.$parent);
	},
	close: function(item) {
		if (!item.$branch || item.$closed) return;

		this.dispatch("onClose",[item.id]);

		item.$closed = true;
		var node = this.getItemNode(item.id);
		node.parentNode.replaceChild(this._createItem(item), node);

		this._hideChildren(item);

		this.dispatch("onClosed",[item.id]);
	},
	openAll: function(){
		this.each(function(obj){
			if (obj.$branch)
				this.open(obj.id);
		});
	},
	closeAll: function(){
		this.each(function(obj){
			if (obj.$branch)
				this.close(obj.id);
		});
	},
	isBranchOpen:function(item){
		if (item.$branch && !item.$closed)
			return this.isBranchOpen(item.$parent);
		return false;
	},
	toggle: function(item) {
		if (item.$branch) {
			if (item.$closed)
				this.open(item);
			else
				this.close(item);
		}
	}
}, pykit.UI.list);



pykit.UI.table = pykit.defUI({
	__name__: "table",
	$defaults: {
		tagClass: "uk-table",
		htmlTag: "TABLE",
		flex: false,
		margin : "",
		size: "",
		layout: "",
		listStyle: ""
	},
	__after__: function() {
		this._header = pykit.html.createElement("THEAD");
		this._footer = pykit.html.createElement("TFOOT");
		this._body = pykit.html.createElement("TBODY");

		// Make Chrome wrapping behavior same as firefox
		this._body.style.wordBreak = "break-word";

		this._html.appendChild(this._header);
		this._html.appendChild(this._footer);
		this._html.appendChild(this._body);
	},
	$setters: pykit.extend(pykit.setCSS({
			tableStyle: {
				hover: "uk-table-hover",
				striped: "uk-table-striped",
				condensed: "uk-table-condensed"
			}
		}),
		{
			columns: function (value) {
				pykit.assert(pykit.isArray(value), "Table 'columns' expected Array, got: " + value);
				value = pykit.list(value);
				value.each(function(item) {
					if (pykit.isString(item.schema)) {
						item.schema = pykit.selectors.property(item.schema);
					}
					else if (pykit.isUndefined(item.schema) && item.name) {
						item.schema = pykit.selectors.property(item.name);
					}
					else if (!pykit.isFunction(item.schema)) {
						pykit.fail("Invalid 'schema' provided to table. Schema must be a String or Function, got: "
							+ item.schema);
					}
				});
				return value;
			},
			header: function (value) {
				if (value) {
					if (pykit.isObject(value)) {
						var column = pykit.ListMethods.findOne.call(this._config.columns, "name", value.name, true);
						column.header = value.header;
					}
					var headers = pykit.pluck(this._config.columns, "header");
					this._header.innerHTML = "<tr><th>" + headers.join("</th><th>") + "</th></tr>";
				}
				return value;
			},
			footer: function (value) {
				if (value) {
					if (pykit.isObject(value)) {
						var column = pykit.ListMethods.findOne.call(this._config.columns, "name", value.name);
						column.footer = value.footer;
					}
					var footers = pykit.pluck(this._config.columns, "footer");
					this._footer.innerHTML = "<tr><td>" + footers.join("</td><td>") + "</td></tr>";
				}
				return value;
			},
			caption: function (value) {
				this._caption = pykit.html.createElement("CAPTION");
				this._caption.innerHTML = value;
				this._html.appendChild(this._caption);
				return value;
			}
		}
	),
	_innerHTML: function(node, obj) {
		var td, column;
		for (var i=0; i<this._config.columns.length; i++) {
			column = this._config.columns[i];
			td = pykit.html.createElement("TD");

			if (column.align)
				td.style.textAlign = column.align;

			td.innerHTML = column.schema(obj);
			node.appendChild(td);
		}
		this._attachNodeEvents(node, obj);
	},
	_itemHTML: function() {
		return pykit.html.createElement("TR");
	},
	_containerHTML: function() {
		return this._body;
	}
}, pykit.UI.list);



pykit.UI.form = pykit.defUI({
	__name__: "form",
	$defaults:{
		htmlTag: "FORM",
		tagClass: "uk-form",
		layout: "stacked"
	},
	$setters: pykit.extend(
		pykit.setCSS({
			layout: {
				stacked: "uk-form-stacked",
				horizontal: "uk-form-horizontal"
			}
		}),
		{
			fieldset: function(value) {
				var ui = pykit.UI({
					view: "fieldset",
					layout: this._config.layout,
					data: value
				});
				this._fieldset = ui;
				this._html.appendChild(ui._html);
				return value;
			}
		}),
	__after__: function() {
		pykit.event(this._html, "submit", this._onSubmit, this);
	},
	_onSubmit: function(e) {
		pykit.html.preventEvent(e);
		this.dispatch("onSubmit", [this.getValues(), this]);
		return true;
	},
	getValues: function() {
		return this._fieldset.getValues();
	},
	setValues: function(values) {
		return this._fieldset.setValues(values);
	}
}, pykit.UI.element);



pykit.UI.fieldset = pykit.defUI({
	__name__: "fieldset",
	$defaults: {
		htmlTag: "FIELDSET"
	},
	$setters: pykit.setCSS({
		layout: {
			stacked: "uk-form-stacked",
			horizontal: "uk-form-horizontal"
		}
	}),
	_itemHTML: function(config) {
		if (config.title) {
			return pykit.html.createElement("LEGEND", {class: config.$itemCSS ? config.$itemCSS : ""});
		}
		else {
			return pykit.html.createElement("DIV", {class: config.$itemCSS ? config.$itemCSS : "uk-form-row"});
		}
	},
	_innerHTML: function(parentNode, config) {
		if (config.title) {
			parentNode.innerHTML = config.label;
		}
		else if (config.view) {
			config.margin = config.margin || "";
			var ui = pykit.UI(config);

			if (config.formLabel) {
				var label = pykit.html.createElement("LABEL", {class: "uk-form-label", for: config.id});
				label.innerHTML = config.formLabel;

				if (config.inline)
					pykit.html.addCSS(label, "uk-display-inline");

				parentNode.appendChild(label);
			}

			if (config.inline) {
				parentNode.appendChild(ui._html);
				pykit.html.addCSS(ui._html, "uk-display-inline");
			}
			else {
				var controlContainer = pykit.html.createElement("DIV", {class: "uk-form-controls"});
				parentNode.appendChild(controlContainer);
				controlContainer.appendChild(ui._html);
			}
		}
	},
	getValues: function() {
		var results = {};
		this.each(function(item) {
			if (item.name) {
				results[item.name] = $$(item.id).getValue();
			}
		});
		return results;
	},
	setValues: function(config) {
		pykit.assert(config, "fieldset setValues has recieved an invalid value.");
		this.each(function(item) {
			if (config[item.name]) {
				$$(item.id).setValue(config[item.name]);
			}
		});
	}
}, pykit.UI.stack);



if (window.UIkit) {
	pykit.message = UIkit.notify;
	pykit.confirm = UIkit.modal.confirm;
	pykit.prompt = UIkit.modal.prompt;
	pykit.alert = UIkit.modal.alert;
}