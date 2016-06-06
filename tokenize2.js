/*!
 * Tokenize2 v1.0 (https://github.com/zellerda/Tokenize2)
 * Copyright 2016 David Zeller.
 * Licensed under the new BSD license
 */

(function(factory){
    if (typeof define === 'function' && define.amd){
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else if(typeof module === 'object' && module.exports){
        // Node/CommonJS
        module.exports = function(root, jQuery){
            if(jQuery === undefined){
                // require('jQuery') returns a factory that requires window to
                // build a jQuery instance, we normalize how we use modules
                // that require this pattern but the window provided is a noop
                // if it's defined (how jquery works)
                if (typeof window !== 'undefined'){
                    jQuery = require('jquery');
                } else {
                    jQuery = require('jquery')(root);
                }
            }
            factory(jQuery);
            return jQuery;
        };
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function($){

    /**
     * Tokenize2 constructor.
     *
     * @param {object} element
     * @param {object} options
     * @constructor
     */
    var Tokenize2 = function(element, options){

        this.element = $(element);
        this.options = $.extend({}, Tokenize2.DEFAULTS, options);
        this.count = 0;
        this.bind();
        this.trigger('tokenize.load');

    };

    Tokenize2.VERSION = '1.0';
    Tokenize2.DEBOUNCE = null;
    Tokenize2.DEFAULTS = {
        maxElements: 0,
        newElements: false
    };

    /**
     * Trigger an event
     *
     * @see $.trigger
     */
    Tokenize2.prototype.trigger = function(event, data, elem, onlyHandlers){

        this.element.trigger(event, data, elem, onlyHandlers);

    };

    /**
     * Bind all events
     */
    Tokenize2.prototype.bind = function(){

        this.element.on('tokenize.load', {}, $.proxy(function(){ this.init() }, this));
        this.element.on('tokenize.remap', {}, $.proxy(function(){ this.remap() }, this));
        this.element.on('tokenize.focus', {}, $.proxy(function(){ this.focus() }, this));
        this.element.on('tokenize.blur', {}, $.proxy(function(){ this.blur() }, this));
        this.element.on('tokenize.keypress', {}, $.proxy(function(e){ this.keypress(e) }, this));
        this.element.on('tokenize.keydown', {}, $.proxy(function(e){ this.keydown(e) }, this));
        this.element.on('tokenize.tokens.add', {}, $.proxy(function(e, v, t){ this.tokenAdd(v, t) }, this));
        this.element.on('tokenize.tokens.remove', {}, $.proxy(function(e, v){ this.tokenRemove(v) }, this));

    };

    /**
     * Init function
     */
    Tokenize2.prototype.init = function(){

        this.element.hide();

        this.search = $('<li class="token-search" />');
        this.input = $('<input autocomplete="off" />')
            .on('click', {}, $.proxy(function(){ this.trigger('tokenize.focus') }, this))
            .on('keydown', {}, $.proxy(function(){ this.trigger('tokenize.keydown') }, this))
            .on('keypress', {}, $.proxy(function(){ this.trigger('tokenize.keypress') }, this))
            .on('paste', {}, $.proxy(function(){  }, this))
            .on('blur', {}, $.proxy(function(){ this.trigger('tokenize.blur') }, this));

        this.tokensContainer = $('<ul class="tokens-container form-control" />')
            .addClass(this.element.attr('class'))
            .append(this.search.append(this.input))
            .on('click mousedown', {}, $.proxy(function(e){
                if($(e.target)[0] == this.tokensContainer[0]){
                    this.trigger('tokenize.focus');
                }
            }, this));

        this.container = $('<div class="tokenize" />');
        this.container.append(this.tokensContainer).insertAfter(this.element);

        this.scaleInput();

        this.trigger('tokenize.remap');
        this.trigger('tokenize.loaded');

    };

    /**
     * Add token
     *
     * If text is empty text = value
     *
     * @param {string} value
     * @param {string} text
     * @returns {Tokenize2}
     */
    Tokenize2.prototype.tokenAdd = function(value, text){

        value = this.escape(value);
        text = text || value;

        if((value === undefined || value === '')
            || (this.options.maxElements > 0 && this.count >= this.options.maxElements)
            || $('li.token[data-value="' + value + '"]', this.tokensContainer).length > 0) {
            return this;
        }

        if($('option[value="' + value + '"]', this.element).length) {
            $('option[value="' + value + '"]', this.element).attr('selected', true).prop('selected', true);
        } else if(this.options.newElements){
            this.element.append($('<option selected data-type="custom" />').val(value).html(text));
        } else {
            return this;
        }

        $('<li class="token" />')
            .attr('data-value', value)
            .append('<span>' + text + '</span>')
            .prepend($('<a class="dismiss" />').html('&#215;').on('click mousedown', {}, $.proxy(function(e){
                e.preventDefault();
                this.trigger('tokenize.tokens.remove', [value]);
            }, this)))
            .insertBefore(this.search);

        return this;

    };

    /**
     * Remove token
     *
     * @param {string} v
     * @returns {Tokenize2}
     */
    Tokenize2.prototype.tokenRemove = function(v){

        var $item = $('option[value="' + v + '"]', this.element);

        if($item.attr('data-type') === 'custom'){
            $item.remove();
        } else {
            $item.removeAttr('selected').prop('selected', false);
        }

        $('li.token[data-value="' + v + '"]', this.tokensContainer).remove();

        this.trigger('tokenize.tokens.removed');
        return this;

    };

    /**
     * Refresh tokens reflecting selected options
     *
     * @returns {Tokenize2}
     */
    Tokenize2.prototype.remap = function(){

        var $selected = $('option:selected', this.element);
        $selected.each($.proxy(function(v, t) {
            this.trigger('tokenize.tokens.add', [$(t).val(), $(t).html()]);
        }, this));

        this.trigger('tokenize.remaped');
        return this;

    };

    /**
     * Focus
     */
    Tokenize2.prototype.focus = function(){

        this.input.focus();
        this.container.addClass('focus');

    };

    /**
     * Keydown
     *
     * @param {event} e
     */
    Tokenize2.prototype.keydown = function(e){

        console.log(e);

    };

    /**
     * Keypress
     *
     * @param {event} e
     */
    Tokenize2.prototype.keypress = function(e){



    };

    /**
     * Blur
     */
    Tokenize2.prototype.blur = function(){

        this.container.removeClass('focus');

    };

    /**
     * Clear control
     */
    Tokenize2.prototype.clear = function(){



    };

    /**
     * Disable control
     */
    Tokenize2.prototype.disable = function(){



    };

    /**
     * Enable control
     */
    Tokenize2.prototype.enable = function(){



    };

    Tokenize2.prototype.scaleInput = function(){

        this.input.attr('size', Number(this.input.val().length) + 2);

    };

    /**
     * Escape string
     *
     * @param {string} string
     * @returns {string}
     */
    Tokenize2.prototype.escape = function(string){

        var $escaping = document.createElement('div');
        $escaping.innerHTML = string;
        string = ($escaping.textContent || $escaping.innerText || '');
        return String(string).replace(/["]/g, function(){
            return '\"';
        });

    };

    /**
     * Tokenize plugin main function
     *
     * @param {object} options
     * @returns {*}
     */
    function Plugin(options){

        return this.filter('select').each(function(){
            var $this = $(this);
            var $data = $this.data('tokenize2');
            var $options = typeof options == 'object' && options;
            if(!$data){
                $this.data('tokenize2', new Tokenize2(this, $options));
            }
        });

    }

    var old = $.fn.tokenize2;

    /**
     * jQuery plugin entry
     */
    $.fn.tokenize2 = Plugin;
    $.fn.tokenize2.Constructor = Tokenize2;
    $.fn.tokenize2.noConflict = function(){
        $.fn.tokenize2 = old;
        return this;
    }

}));