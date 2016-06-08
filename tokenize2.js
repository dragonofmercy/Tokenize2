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
        this.bind();
        this.trigger('tokenize:load');

    };

    /**
     * Keycodes constants
     *
     * @type {object}
     */
    var KEYS = {
        BACKSPACE: 8,
        TAB: 9,
        ENTER: 13,
        ESCAPE: 27,
        ARROW_UP: 38,
        ARROW_DOWN: 40
    };

    Tokenize2.VERSION = '1.0';
    Tokenize2.DEBOUNCE = null;
    Tokenize2.DEFAULTS = {
        tokensMaxItems: 0,
        tokensAllowCustom: true,
        dropdownMaxItems: 10,
        searchMinLength: 0,
        delimiter: ',',
        dataSource: 'select',
        debounce: 0
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

        this.element.on('tokenize:load', {}, $.proxy(function(){ this.init() }, this));
        this.element.on('tokenize:clear', {}, $.proxy(function(){ this.clear() }, this));
        this.element.on('tokenize:remap', {}, $.proxy(function(){ this.remap() }, this));
        this.element.on('tokenize:select', {}, $.proxy(function(e, c){ this.focus(c) }, this));
        this.element.on('tokenize:deselect', {}, $.proxy(function(){ this.blur() }, this));
        this.element.on('tokenize:search', {}, $.proxy(function(e, v){ this.find(v) }, this));
        this.element.on('tokenize:dropdown:up', {}, $.proxy(function(){ this.dropdownSelectionMove(-1) }, this));
        this.element.on('tokenize:dropdown:down', {}, $.proxy(function(){ this.dropdownSelectionMove(1) }, this));
        this.element.on('tokenize:dropdown:clear', {}, $.proxy(function(){ this.dropdownClear() }, this));
        this.element.on('tokenize:dropdown:show', {}, $.proxy(function(){ this.dropdownShow() }, this));
        this.element.on('tokenize:dropdown:hide', {}, $.proxy(function(){ this.dropdownHide() }, this));
        this.element.on('tokenize:dropdown:fill', {}, $.proxy(function(e, i){ this.dropdownFill(i) }, this));
        this.element.on('tokenize:dropdown:itemAdd', {}, $.proxy(function(e, i){ this.dropdownAddItem(i) }, this));
        this.element.on('tokenize:keypress', {}, $.proxy(function(e, routedEvent){ this.keypress(routedEvent) }, this));
        this.element.on('tokenize:keydown', {}, $.proxy(function(e, routedEvent){ this.keydown(routedEvent) }, this));
        this.element.on('tokenize:keyup', {}, $.proxy(function(e, routedEvent){ this.keyup(routedEvent) }, this));
        this.element.on('tokenize:tokens:add', {}, $.proxy(function(e, v, t){ this.tokenAdd(v, t) }, this));
        this.element.on('tokenize:tokens:remove', {}, $.proxy(function(e, v){ this.tokenRemove(v) }, this));

    };

    /**
     * Init function
     */
    Tokenize2.prototype.init = function(){

        this.id = this.guid();
        this.element.hide();

        this.dropdown = undefined;
        this.searchContainer = $('<li class="token-search" />');
        this.input = $('<input autocomplete="off" />')
            .on('keydown', {}, $.proxy(function(e){ this.trigger('tokenize:keydown', [e]) }, this))
            .on('keypress', {}, $.proxy(function(e){ this.trigger('tokenize:keypress', [e]) }, this))
            .on('keyup', {}, $.proxy(function(e){ this.trigger('tokenize:keyup', [e]) }, this))
            .on('paste', {}, $.proxy(function(){  }, this));

        this.tokensContainer = $('<ul class="tokens-container form-control focus"  tabindex="0" />')
            .addClass(this.element.attr('class'))
            .append(this.searchContainer.append(this.input));

        this.container = $('<div class="tokenize" />').attr('id', this.id);
        this.container.append(this.tokensContainer).insertAfter(this.element);

        this.container.focusin($.proxy(function(e){
            this.trigger('tokenize:select', [($(e.target)[0] == this.tokensContainer[0])])
        }, this))
        .focusout($.proxy(function(){
            this.trigger('tokenize:deselect')
        }, this));

        this.scaleInput();

        this.trigger('tokenize:remap');
        this.trigger('tokenize:loaded');
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
        this.resetInput();

        // Check if token is empty
        if(value === undefined || value === ''){
            this.trigger('tokenize:tokens:error.empty');
            return this;
        }

        // Check if max number of token is reached
        if(this.options.tokensMaxItems > 0 && $('li.token', this.tokensContainer).length >= this.options.tokensMaxItems){
            this.trigger('tokenize:tokens:error.max');
            return this;
        }

        // Check duplicate token
        if($('li.token[data-value="' + value + '"]', this.tokensContainer).length > 0){
            this.trigger('tokenize:tokens:error.duplicate', [value, text]);
            return this;
        }

        if($('option[value="' + value + '"]', this.element).length) {
            $('option[value="' + value + '"]', this.element).attr('selected', true).prop('selected', true);
        } else if(this.options.tokensAllowCustom){
            this.element.append($('<option selected data-type="custom" />').val(value).html(text));
        } else {
            this.trigger('tokenize:tokens:error.notokensAllowCustom');
            return this;
        }

        $('<li class="token" />')
            .attr('data-value', value)
            .append('<span>' + text + '</span>')
            .prepend($('<a class="dismiss" />').html('&#215;').on('mousedown touchstart', {}, $.proxy(function(e){
                e.preventDefault();
                this.trigger('tokenize:tokens:remove', [value]);
            }, this)))
            .insertBefore(this.searchContainer);

        this.trigger('tokenize:tokens:added', [value, text]);
        this.trigger('tokenize:dropdown:hide');
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

        this.trigger('tokenize:tokens:removed');
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
            this.trigger('tokenize:tokens:add', [$(t).val(), $(t).html()]);
        }, this));

        this.trigger('tokenize:remaped');
        return this;

    };

    /**
     * Focus
     *
     * @param {boolean} container
     */
    Tokenize2.prototype.focus = function(container){

        if(container){
            this.input.focus();
        }

        this.container.addClass('focus');

    };

    /**
     * Blur
     */
    Tokenize2.prototype.blur = function(e){

        if(this.isDropdownOpen()){
            this.trigger('tokenize:dropdown:hide');
        }
        this.container.removeClass('focus');

    };

    /**
     * Keydown
     *
     * @param {object} e
     */
    Tokenize2.prototype.keydown = function(e){

        if(e.type === 'keydown'){
            this.scaleInput();
            switch(e.keyCode){
                case KEYS.BACKSPACE:
                    if(this.input.val().length < 1){
                        e.preventDefault();
                        if($('li.token.pending-delete', this.tokensContainer).length > 0){
                            this.trigger('tokenize:tokens:remove', [$('li.token.pending-delete', this.tokensContainer).first().attr('data-value')]);
                        } else {
                            var $token = $('li.token:last', this.tokensContainer);
                            if($token.length > 0){
                                this.trigger('tokenize:tokens:markForDelete', [$token.attr('data-value')]);
                                $token.addClass('pending-delete');
                            }
                        }
                        this.trigger('tokenize:dropdown:hide');
                    }
                    break;

                case KEYS.TAB:
                case KEYS.ENTER:
                    this.resetPending();
                    if(this.isDropdownOpen() && $('li.active', this.dropdown).length > 0){
                        e.preventDefault();
                        var $item = $('li.active a', this.dropdown);
                        this.trigger('tokenize:tokens:add', [$item.attr('data-value'), $item.attr('data-text')]);
                    } else {
                        if(this.input.val().length > 0){
                            e.preventDefault();
                            this.trigger('tokenize:tokens:add', [this.input.val()]);
                        }
                    }
                    break;

                case KEYS.ESCAPE:
                    this.scaleInput();
                    this.resetPending();
                    break;

                case KEYS.ARROW_UP:
                    e.preventDefault();
                    this.trigger('tokenize:dropdown:up');
                    break;

                case KEYS.ARROW_DOWN:
                    e.preventDefault();
                    this.trigger('tokenize:dropdown:down');
                    break;

                default:
                    this.resetPending();
                    break;

            }
        } else {
            e.preventDefault();
        }

    };

    /**
     * Keyup
     *
     * @param {object} e
     */
    Tokenize2.prototype.keyup = function(e){

        if(e.type === 'keyup'){
            this.scaleInput();
            switch(e.keyCode){
                case KEYS.TAB:
                case KEYS.ENTER:
                case KEYS.ESCAPE:
                case KEYS.ARROW_UP:
                case KEYS.ARROW_DOWN:
                    break;
                case KEYS.BACKSPACE:
                default:
                    if(this.input.val().length > 0){
                        this.trigger('tokenize:search', [this.input.val()]);
                    } else {
                        this.trigger('tokenize:dropdown:hide');
                    }
                    break;
            }
        } else {
            e.preventDefault();
        }

    };

    /**
     * Keypress
     *
     * @param {object} e
     */
    Tokenize2.prototype.keypress = function(e){

        if(e.type === 'keypress'){
            var $delimiter = false;

            if(Array.isArray(this.options.delimiter)){
                if(this.options.delimiter.indexOf(String.fromCharCode(e.which)) >= 0){
                    $delimiter = true;
                }
            } else {
                if(String.fromCharCode(e.which) == this.options.delimiter){
                    $delimiter = true;
                }
            }

            if($delimiter){
                e.preventDefault();
                this.trigger('tokenize:tokens:add', [this.input.val(), null]);
            }
        } else {
            e.preventDefault();
        }

    };

    /**
     * Search value
     *
     * @param {string} v
     */
    Tokenize2.prototype.find = function(v){

        if((this.options.tokensMaxItems > 0 && $('li.token', this.tokensContainer).length >= this.options.tokensMaxItems) ||
            v.length < this.options.searchMinLength){
            return false;
        }

        if(this.options.dataSource === 'select'){
            this.dataSourceLocal(v);
        } else if(typeof this.options.dataSource === 'function'){
            this.options.dataSource(v);
        } else {
            this.dataSourceRemote(v);
        }

    };

    /**
     * Gets data from ajax
     *
     * @param {string} search
     */
    Tokenize2.prototype.dataSourceRemote = function(search){

        this.debounce($.proxy(function(){
            if(this.xhr !== undefined){
                this.xhr.abort();
            }
            this.xhr = $.ajax(this.options.dataSource, {
                data: { search: search },
                dataType: 'json',
                success: $.proxy(function(data){
                    var $items = [];
                    $.each(data, $.proxy(function(k, v){
                        $items.push(v);
                    }, this));
                    this.trigger('tokenize:dropdown:fill', [$items]);
                }, this)
            });
        }, this), this.options.debounce);

    };

    /**
     * Gets data from select
     *
     * @param {string} search
     */
    Tokenize2.prototype.dataSourceLocal = function(search){

        var $items = [];
        var $regexp = new RegExp(search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), 'i');
        $('option', this.element)
            .not(':selected, :disabled')
            .each(function(){
                if($regexp.test($(this).html())){
                    $items.push({ value: $(this).attr('value'), text: $(this).html() });
                }
            });

        this.trigger('tokenize:dropdown:fill', [$items]);

    };

    /**
     * Debounce method for ajax request
     *
     * @param {function} func
     * @param {number} threshold
     */
    Tokenize2.prototype.debounce = function(func, threshold){

        var $args = arguments;
        var $delayed = $.proxy(function(){
            func.apply(this, $args);
            this.debounceTimeout = undefined;
        }, this);

        if(this.debounceTimeout !== undefined){
            clearTimeout(this.debounceTimeout);
        }

        this.debounceTimeout = setTimeout($delayed, threshold || 0);

    };

    /**
     * Show dropdown
     */
    Tokenize2.prototype.dropdownShow = function(){

        if(!this.isDropdownOpen()){
            $('.tokenize-dropdown').remove();
            this.dropdown = $('<div class="tokenize-dropdown dropdown"><ul class="dropdown-menu" /></div>')
                .attr('data-related', this.id);
            $('body').append(this.dropdown.show());
            $(window).on('resize scroll', {}, $.proxy(function(){ this.dropdownMove() }, this)).trigger('resize');
            this.trigger('tokenize:dropdown:shown');
        }

    };

    /**
     * Hide dropdown
     */
    Tokenize2.prototype.dropdownHide = function(){

        if(this.isDropdownOpen()){
            $(window).off('resize');
            this.dropdown.remove();
            this.dropdown = undefined;
            this.trigger('tokenize:dropdown:hidden');
        }

    };

    /**
     * Clear dropdown
     */
    Tokenize2.prototype.dropdownClear = function(){

        this.dropdown.find('.dropdown-menu li').remove();
        this.trigger('tokenize:dropdown:cleared');

    };

    /**
     * Fill dropdown with options
     *
     * @param {object} items
     */
    Tokenize2.prototype.dropdownFill = function(items){

        if(items && items.length > 0){
            this.trigger('tokenize:dropdown:show');
            this.trigger('tokenize:dropdown:clear');

            $.each(items, $.proxy(function(k, v) {
                if($('li.dropdown-item', this.dropdown).length <= this.options.dropdownMaxItems){
                    this.trigger('tokenize:dropdown:itemAdd', [v]);
                }
            }, this));

            if($('li.active', this.dropdown).length < 1){
                $('li:first', this.dropdown).addClass('active');
            }

            if($('li.dropdown-item', this.dropdown).length < 1){
                this.trigger('tokenize:dropdown:hide');
            } else {
                this.trigger('tokenize:dropdown:filled');
            }
        } else {
            this.trigger('tokenize:dropdown:hide');
        }

        // Fix the dropdown position when page start scroll
        $(window).trigger('resize');

    };

    /**
     * Move selection through dropdown items
     * @param {int} d
     */
    Tokenize2.prototype.dropdownSelectionMove = function(d){

        if($('li.active', this.dropdown).length > 0){
            if(!$('li.active', this.dropdown).is('li:' + (d > 0 ? 'last-child'  : 'first-child'))){
                var $active = $('li.active', this.dropdown);
                $active.removeClass('active');
                if(d > 0){
                    $active.next().addClass('active');
                } else {
                    $active.prev().addClass('active');
                }
            } else {
                $('li.active', this.dropdown).removeClass('active');
                $('li:' + (d > 0 ? 'first-child' : 'last-child'), this.dropdown).addClass('active');
            }
        } else {
            $('li:first', this.dropdown).addClass('active');
        }

    };

    /**
     * Add dropdown item
     *
     * @param {object} item
     */
    Tokenize2.prototype.dropdownAddItem = function(item){

        if(this.isDropdownOpen()){
            var $li = $('<li class="dropdown-item" />').html(this.dropdownItemFormat(item))
                .on('mouseover', $.proxy(function(e){
                    $('li', this.dropdown).removeClass('active');
                    $(e.target).parent().addClass('active');
                }, this)).on('mouseout', $.proxy(function(){
                    $('li', this.dropdown).removeClass('active');
                }, this)).on('mousedown touchstart', $.proxy(function(e){
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    this.trigger('tokenize:tokens:add', [$(e.target).attr('data-value'), $(e.target).attr('data-text')]);
                }, this));
            if($('li.token[data-value="' + $li.find('a').attr('data-value') + '"]', this.tokensContainer).length < 1){
                this.dropdown.find('.dropdown-menu').append($li);
                this.trigger('tokenize:dropdown:itemAdded', [item]);
            }
        }

    };

    /**
     * Format dropdown item
     *
     * @param {object} item
     * @returns {object|jQuery}
     */
    Tokenize2.prototype.dropdownItemFormat = function(item){

        return $('<a />').html(item.text).attr({
            'data-value': item.value,
            'data-text': item.text
        });

    };

    /**
     * Move dropdown according tokens container
     */
    Tokenize2.prototype.dropdownMove = function(){

        var $position = this.tokensContainer.offset();
        var $height = this.tokensContainer.outerHeight();
        var $width = this.tokensContainer.outerWidth();

        this.dropdown.css({
            top: $position.top + $height,
            left: $position.left - $(window).scrollLeft(),
            width: $width
        });

    };

    /**
     * Returns the current status of the dropdown
     *
     * @returns {boolean}
     */
    Tokenize2.prototype.isDropdownOpen = function(){

        return (this.dropdown !== undefined);

    };

    /**
     * Clear control
     *
     * @returns {Tokenize2}
     */
    Tokenize2.prototype.clear = function(){

        $.each($('li.token', this.tokensContainer), $.proxy(function(e, item){
            this.trigger('tokenize:tokens:remove', [$(item).attr('data-value')]);
        }, this));

        this.trigger('tokenize:dropdown:hide');

        return this;

    };

    /**
     * Reset pending delete tokens
     */
    Tokenize2.prototype.resetPending = function(){

        var $token = $('li.pending-delete:last', this.tokensContainer);

        if($token.length > 0){
            this.trigger('tokenize:tokens:cancelDelete', [$token.attr('data-value')]);
            $token.removeClass('pending-delete');
        }

    };

    /**
     * Scale input
     */
    Tokenize2.prototype.scaleInput = function(){

        var $canvas = document.createElement('canvas');
        var $ctx = $canvas.getContext('2d');
        var $width, $tokensContainerWidth;

        $ctx.font = this.input.css('font-style') + ' ' +
            this.input.css('font-variant') + ' ' +
            this.input.css('font-weight') + ' ' +
            Math.ceil(parseFloat(this.input.css('font-size'))) + 'px ' +
            this.input.css('font-family');

        $width = Math.round($ctx.measureText(this.input.val() + 'M').width) + Math.ceil(parseFloat(this.searchContainer.css('margin-left'))) + Math.ceil(parseFloat(this.searchContainer.css('margin-right')));
        $tokensContainerWidth = this.tokensContainer.width() -
            (
                Math.ceil(parseFloat(this.tokensContainer.css('border-left-width'))) + Math.ceil(parseFloat(this.tokensContainer.css('border-right-width')) +
                Math.ceil(parseFloat(this.tokensContainer.css('padding-left'))) + Math.ceil(parseFloat(this.tokensContainer.css('padding-right'))))
            );

        if($width >= $tokensContainerWidth){
            $width = $tokensContainerWidth;
        }

        this.searchContainer.width($width);
        $canvas.remove();

    };

    /**
     * Reset input
     */
    Tokenize2.prototype.resetInput = function(){

        this.input.val('');
        this.scaleInput();

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
     * Generates guid
     *
     * @returns {string}
     */
    Tokenize2.prototype.guid = function(){

        function s4(){
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();

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