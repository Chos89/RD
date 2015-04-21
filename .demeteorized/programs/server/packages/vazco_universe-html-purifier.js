(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var _ = Package.underscore._;

/* Package-scope variables */
var UniHTML, HTMLParser;

(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/vazco:universe-html-purifier/HTMLParser.js                                                                //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
/*                                                                                                                    // 1
 * HTML Parser By John Resig (ejohn.org)                                                                              // 2
 * Original code by Erik Arvidsson, Licensed under the Apache License, Version 2.0 or Mozilla Public License          // 3
 * http://erik.eae.net/simplehtmlparser/simplehtmlparser.js                                                           // 4
                                                                                                                      // 5
 * added support of HTML5 by Krzysztof Różalski <cristo.rabani@gmail.com>                                             // 6
 */                                                                                                                   // 7
                                                                                                                      // 8
// Regular Expressions for parsing tags and attributes (modified attribute name matcher, to catch xml:lang)           // 9
var startTag = /^<([\w-]+\:?\w*)((?:\s+[a-zA-Z_:-]+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/,      // 10
	endTag = /^<\/([\w-]+)[^>]*>/,                                                                                       // 11
	attr = /([\w-]+)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/g;                             // 12
                                                                                                                      // 13
function makeMap(str){                                                                                                // 14
	var obj = {}, items = str.split(",");                                                                                // 15
	for ( var i = 0; i < items.length; i++ )                                                                             // 16
		obj[ items[i] ] = true;                                                                                             // 17
	return obj;                                                                                                          // 18
}                                                                                                                     // 19
                                                                                                                      // 20
var empty = makeMap("area,base,basefont,br,col,frame,hr,img,input,isindex,keygen,link,meta,menuitem,source,track,param,embed,wbr");
                                                                                                                      // 22
var block = makeMap("article,aside,address,applet,blockquote,button,canvas,center,dd,del,dir,div,dl,dt,fieldset,figcaption,figure,form,footer,frameset,hr,iframe,header,hgroup,ins,isindex,li,map,menu,noframes,noscript,object,ol,output,p,pre,progress,section,script,table,tbody,td,tfoot,th,thead,tr,ul,video");
                                                                                                                      // 24
var inline = makeMap("a,abbr,acronym,applet,audio,b,basefont,bdo,big,br,button,cite,code,command,del,details,dfn,em,font,i,iframe,img,input,ins,kbd,label,map,mark,meter,nav,object,q,s,samp,script,select,small,span,strike,strong,sub,summary,sup,textarea,tt,u,time,var");
                                                                                                                      // 26
// Elements that you can, intentionally, leave open                                                                   // 27
// (and which close themselves)                                                                                       // 28
var closeSelf = makeMap("colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr");                                          // 29
                                                                                                                      // 30
// Attributes that have their values filled in disabled="disabled"                                                    // 31
var fillAttrs = makeMap("checked,compact,declare,defer,disabled,ismap,multiple,nohref,noresize,noshade,nowrap,readonly,selected");
                                                                                                                      // 33
// Special Elements (can contain anything)                                                                            // 34
var special = makeMap("script,style");                                                                                // 35
                                                                                                                      // 36
HTMLParser = function( html, handler ) {                                                                              // 37
	var index, chars, match, stack = [], last = html;                                                                    // 38
	stack.last = function(){                                                                                             // 39
		return this[ this.length - 1 ];                                                                                     // 40
	};                                                                                                                   // 41
                                                                                                                      // 42
	function parseStartTag( tag, tagName, rest, unary ) {                                                                // 43
		if ( block[ tagName ] ) {                                                                                           // 44
			while ( stack.last() && inline[ stack.last() ] ) {                                                                 // 45
				parseEndTag( "", stack.last() );                                                                                  // 46
			}                                                                                                                  // 47
		}                                                                                                                   // 48
                                                                                                                      // 49
		if ( closeSelf[ tagName ] && stack.last() === tagName ) {                                                           // 50
			parseEndTag( "", tagName );                                                                                        // 51
		}                                                                                                                   // 52
                                                                                                                      // 53
		unary = empty[ tagName ] || !!unary;                                                                                // 54
                                                                                                                      // 55
		if ( !unary )                                                                                                       // 56
			stack.push( tagName );                                                                                             // 57
                                                                                                                      // 58
		if ( handler.start ) {                                                                                              // 59
			var attrs = [];                                                                                                    // 60
                                                                                                                      // 61
			rest.replace(attr, function(match, name) {                                                                         // 62
				var value = arguments[2] ? arguments[2] :                                                                         // 63
					arguments[3] ? arguments[3] :                                                                                    // 64
					arguments[4] ? arguments[4] :                                                                                    // 65
					fillAttrs[name] ? name : "";                                                                                     // 66
                                                                                                                      // 67
				attrs.push({                                                                                                      // 68
					name: name,                                                                                                      // 69
					value: value,                                                                                                    // 70
					escaped: value.replace(/(^|[^\\])"/g, '$1\\\"') //"                                                              // 71
				});                                                                                                               // 72
			});                                                                                                                // 73
                                                                                                                      // 74
			if ( handler.start )                                                                                               // 75
				handler.start( tagName, attrs, unary );                                                                           // 76
		}                                                                                                                   // 77
	}                                                                                                                    // 78
                                                                                                                      // 79
	function parseEndTag( tag, tagName ) {                                                                               // 80
		var pos;                                                                                                            // 81
                                                                                                                      // 82
		// If no tag name is provided, clean shop                                                                           // 83
		if (!tagName) {                                                                                                     // 84
			pos = 0;                                                                                                           // 85
		}                                                                                                                   // 86
                                                                                                                      // 87
		// Find the closest opened tag of the same type                                                                     // 88
		else                                                                                                                // 89
			for ( pos = stack.length - 1; pos >= 0; pos-- )                                                                    // 90
				if ( stack[ pos ] === tagName )                                                                                   // 91
					break;                                                                                                           // 92
                                                                                                                      // 93
		if ( pos >= 0 ) {                                                                                                   // 94
			// Close all the open elements, up the stack                                                                       // 95
			for ( var i = stack.length - 1; i >= pos; i-- )                                                                    // 96
				if ( handler.end )                                                                                                // 97
					handler.end( stack[ i ] );                                                                                       // 98
                                                                                                                      // 99
			// Remove the open elements from the stack                                                                         // 100
			stack.length = pos;                                                                                                // 101
		}                                                                                                                   // 102
	}                                                                                                                    // 103
                                                                                                                      // 104
	while ( html ) {                                                                                                     // 105
		chars = true;                                                                                                       // 106
		// Make sure we're not in a script or style element                                                                 // 107
		if ( !stack.last() || !special[ stack.last() ] ) {                                                                  // 108
                                                                                                                      // 109
			// Comment                                                                                                         // 110
			if ( html.indexOf("<!--") === 0 ) {                                                                                // 111
				index = html.indexOf("-->");                                                                                      // 112
                                                                                                                      // 113
				if ( index >= 0 ) {                                                                                               // 114
					if ( handler.comment )                                                                                           // 115
						handler.comment( html.substring( 4, index ) );                                                                  // 116
					html = html.substring( index + 3 );                                                                              // 117
					chars = false;                                                                                                   // 118
				}                                                                                                                 // 119
                                                                                                                      // 120
			// end tag                                                                                                         // 121
			} else if ( html.indexOf("</") === 0 ) {                                                                           // 122
				match = html.match( endTag );                                                                                     // 123
                                                                                                                      // 124
				if ( match ) {                                                                                                    // 125
					html = html.substring( match[0].length );                                                                        // 126
					match[0].replace( endTag, parseEndTag );                                                                         // 127
					chars = false;                                                                                                   // 128
				}                                                                                                                 // 129
                                                                                                                      // 130
			// start tag                                                                                                       // 131
			} else if ( html.indexOf("<") === 0 ) {                                                                            // 132
				match = html.match( startTag );                                                                                   // 133
                                                                                                                      // 134
				if ( match ) {                                                                                                    // 135
					html = html.substring( match[0].length );                                                                        // 136
					match[0].replace( startTag, parseStartTag );                                                                     // 137
					chars = false;                                                                                                   // 138
				}                                                                                                                 // 139
			}                                                                                                                  // 140
                                                                                                                      // 141
			if ( chars ) {                                                                                                     // 142
				index = html.indexOf("<");                                                                                        // 143
                                                                                                                      // 144
				var text = index < 0 ? html : html.substring( 0, index );                                                         // 145
				html = index < 0 ? "" : html.substring( index );                                                                  // 146
                                                                                                                      // 147
				if ( handler.chars )                                                                                              // 148
					handler.chars( text );                                                                                           // 149
			}                                                                                                                  // 150
                                                                                                                      // 151
		} else {                                                                                                            // 152
			html = html.replace(new RegExp("(.*)<\/" + stack.last() + "[^>]*>"), function(all, text){                          // 153
				text = text.replace(/<!--(.*?)-->/g, "$1")                                                                        // 154
					.replace(/<!\[CDATA\[(.*?)]]>/g, "$1");                                                                          // 155
                                                                                                                      // 156
				if ( handler.chars )                                                                                              // 157
					handler.chars( text );                                                                                           // 158
                                                                                                                      // 159
				return "";                                                                                                        // 160
			});                                                                                                                // 161
                                                                                                                      // 162
			parseEndTag( "", stack.last() );                                                                                   // 163
		}                                                                                                                   // 164
                                                                                                                      // 165
		if ( html === last )                                                                                                // 166
			throw "Parse Error: " + html;                                                                                      // 167
		last = html;                                                                                                        // 168
	}                                                                                                                    // 169
                                                                                                                      // 170
	// Clean up any remaining tags                                                                                       // 171
	parseEndTag();                                                                                                       // 172
};                                                                                                                    // 173
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/vazco:universe-html-purifier/HTMLPurifier.js                                                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
'use strict';                                                                                                         // 1
                                                                                                                      // 2
var htmlPurifier = function(settings){                                                                                // 3
    var allowHeaders = true;                                                                                          // 4
    var stack = [];                                                                                                   // 5
    var active_elements = [];                                                                                         // 6
    var customTags = {};                                                                                              // 7
    var root;                                                                                                         // 8
    var insertion_mode;                                                                                               // 9
    var noFormatting;                                                                                                 // 10
    var preferB_I = false;                                                                                            // 11
    var preferStrong_Em = false;                                                                                      // 12
    var withoutTags;                                                                                                  // 13
                                                                                                                      // 14
                                                                                                                      // 15
    var scope_markers = {'td': true, 'th': true, 'caption': true};                                                    // 16
    var tags_with_implied_end = {'li': true, 'p': true};                                                              // 17
    var allowed_attributes = {                                                                                        // 18
        all_elements: ['class', 'style', 'id'],                                                                       // 19
        a: ['href', 'target', 'title', 'name', 'rel', 'rev', 'type'],                                                 // 20
        blockquote: ['cite'],                                                                                         // 21
        img: ['src', 'alt', 'title', 'longdesc'],                                                                     // 22
        td: ['colspan'],                                                                                              // 23
        th: ['colspan'],                                                                                              // 24
        tr: ['rowspan'],                                                                                              // 25
        table: ['border']                                                                                             // 26
    };                                                                                                                // 27
    var allowed_attributes_as_hash;                                                                                   // 28
    var selfClosing = {                                                                                               // 29
        br: true,                                                                                                     // 30
        hr: true,                                                                                                     // 31
        img: true                                                                                                     // 32
    };                                                                                                                // 33
    var dontIndent = {                                                                                                // 34
        strong: true,                                                                                                 // 35
        b: true,                                                                                                      // 36
        i: true,                                                                                                      // 37
        em: true,                                                                                                     // 38
        pre: true                                                                                                     // 39
    };                                                                                                                // 40
    var indent = false;                                                                                               // 41
    var indent_string = "    ";                                                                                       // 42
    var indentation = function (depth, switchOff) {                                                                   // 43
        if (noFormatting) return "";                                                                                  // 44
        if (!indent) return "";                                                                                       // 45
        if (switchOff) indent = false;                                                                                // 46
        var result = "\n";                                                                                            // 47
        for (var i = 0; i < depth; i++) {                                                                             // 48
            result += indent_string;                                                                                  // 49
        }                                                                                                             // 50
        return result;                                                                                                // 51
    };                                                                                                                // 52
                                                                                                                      // 53
    var TextNode = function (text) {                                                                                  // 54
        this.text = text.replace(/\s+/g, ' ');                                                                        // 55
    };                                                                                                                // 56
                                                                                                                      // 57
    TextNode.prototype = {                                                                                            // 58
        isEmpty: function () {                                                                                        // 59
            return !this.text;                                                                                        // 60
        },                                                                                                            // 61
        textContent: function () {                                                                                    // 62
            return this.text;                                                                                         // 63
        },                                                                                                            // 64
        toString: function () {                                                                                       // 65
            return this.isEmpty() ? '' : indentation(this.depth(), true) + this.text.replace(/(&nbsp;)+/, ' ');       // 66
        },                                                                                                            // 67
        depth: function () {                                                                                          // 68
            return this.parent.depth() + 1;                                                                           // 69
        }                                                                                                             // 70
    };                                                                                                                // 71
                                                                                                                      // 72
    var Node = function (name) {                                                                                      // 73
        this.name = name;                                                                                             // 74
        this.children = [];                                                                                           // 75
        this.attributes = {};                                                                                         // 76
    };                                                                                                                // 77
                                                                                                                      // 78
    Node.prototype = {                                                                                                // 79
        appendChild: function (child) {                                                                               // 80
            this.children.push(child);                                                                                // 81
            child.parent = this;                                                                                      // 82
            return child;                                                                                             // 83
        },                                                                                                            // 84
        removeChild: function (child) {                                                                               // 85
            for (var i = 0, len = this.children.length; i < len; i++) {                                               // 86
                if (this.children[i] === child) {                                                                     // 87
                    return this.children.splice(i, i);                                                                // 88
                }                                                                                                     // 89
            }                                                                                                         // 90
            return null;                                                                                              // 91
        },                                                                                                            // 92
        lastChild: function () {                                                                                      // 93
            return this.children[this.children.length - 1];                                                           // 94
        },                                                                                                            // 95
        clone: function () {                                                                                          // 96
            var clone = new Node(this.name);                                                                          // 97
            for (var i in this.attributes) {                                                                          // 98
                clone.attributes[i] = this.attributes[i];                                                             // 99
            }                                                                                                         // 100
            return clone;                                                                                             // 101
        },                                                                                                            // 102
        startTag: function () {                                                                                       // 103
            return "<" + this.name + this.attributeString() + ">";                                                    // 104
        },                                                                                                            // 105
        endTag: function () {                                                                                         // 106
            return "</" + this.name + ">";                                                                            // 107
        },                                                                                                            // 108
        selfClosingTag: function () {                                                                                 // 109
            return "<" + this.name + this.attributeString() + "/>";                                                   // 110
        },                                                                                                            // 111
        attributeString: function () {                                                                                // 112
            var string = "";                                                                                          // 113
                                                                                                                      // 114
            var allowed_for_tag = allowed_attributes_as_hash[this.name] || {};                                        // 115
            var allowed_for_all = allowed_attributes_as_hash['all_elements'] || {};                                   // 116
                                                                                                                      // 117
            for (var i = 0, len = (this.attributes || []).length; i < len; i++) {                                     // 118
                var name = this.attributes[i].name;                                                                   // 119
                var value = this.attributes[i].value;                                                                 // 120
                if ((allowed_for_tag[name] || allowed_for_all[name]) && value) {                                      // 121
                    if (name === 'href') {                                                                            // 122
                        // don't allow links to anywhere other than http(s)                                           // 123
                        // because they could contain JavaScript (javascript:) or other bad things!                   // 124
                        var permittedRegex = /^https?:\/\//i;                                                         // 125
                        if (!permittedRegex.test(value)) {                                                            // 126
                            // if not allowed, set the attribute to be empty                                          // 127
                            value = '';                                                                               // 128
                        }                                                                                             // 129
                    }                                                                                                 // 130
                                                                                                                      // 131
                    string += " " + name + "=\"" + value + "\"";                                                      // 132
                }                                                                                                     // 133
            }                                                                                                         // 134
            return string;                                                                                            // 135
        },                                                                                                            // 136
        innerHTML: function () {                                                                                      // 137
            var string = "";                                                                                          // 138
            for (var i = 0, len = this.children.length; i < len; i++) {                                               // 139
                string += this.children[i];                                                                           // 140
            }                                                                                                         // 141
            return string;                                                                                            // 142
        },                                                                                                            // 143
        textContent: function () {                                                                                    // 144
            var text = "";                                                                                            // 145
            for (var i = 0, len = this.children.length; i < len; i++) {                                               // 146
                if (this.children[i] instanceof TextNode) {                                                           // 147
                    text += this.children[i].text;                                                                    // 148
                }                                                                                                     // 149
            }                                                                                                         // 150
            return text;                                                                                              // 151
        },                                                                                                            // 152
        toString: function () {                                                                                       // 153
            if (this.isEmpty()) return '';                                                                            // 154
                                                                                                                      // 155
            var string = "";                                                                                          // 156
            if (selfClosing[this.name]) {                                                                             // 157
                string = indentation(this.depth(), true) + this.selfClosingTag();                                     // 158
            } else {                                                                                                  // 159
                indent = dontIndent[this.name] ? indent : true;                                                       // 160
                string = indentation(this.depth(), dontIndent[this.name]) + this.startTag() + this.innerHTML();       // 161
                indent = dontIndent[this.name] ? indent : true;                                                       // 162
                string += indentation(this.depth()) + this.endTag();                                                  // 163
            }                                                                                                         // 164
            return string;                                                                                            // 165
        },                                                                                                            // 166
        depth: function () {                                                                                          // 167
            return this.parent ? this.parent.depth() + 1 : -1;                                                        // 168
        },                                                                                                            // 169
        isEmpty: function () {                                                                                        // 170
            // Zaption mod: self-closing elements never count as empty                                                // 171
            // otherwise <p><br/></p> gets removed entirely                                                           // 172
            if (selfClosing[this.name]) {                                                                             // 173
                return false;                                                                                         // 174
            }                                                                                                         // 175
                                                                                                                      // 176
            if (typeof(this._isEmpty) === "undefined") {                                                              // 177
                this._isEmpty = true;                                                                                 // 178
                for (var i = 0, len = this.children.length; i < len; i++) {                                           // 179
                    if (!this.children[i].isEmpty()) {                                                                // 180
                        this._isEmpty = false;                                                                        // 181
                        break;                                                                                        // 182
                    }                                                                                                 // 183
                }                                                                                                     // 184
            }                                                                                                         // 185
            return this._isEmpty;                                                                                     // 186
        }                                                                                                             // 187
    };                                                                                                                // 188
                                                                                                                      // 189
    function init(settings) {                                                                                         // 190
        var modes = {                                                                                                 // 191
            InBody: InBody,                                                                                           // 192
            InCell: InCell,                                                                                           // 193
            InRow: InRow,                                                                                             // 194
            InTableBody: InTableBody,                                                                                 // 195
            InColumnGroup: InColumnGroup,                                                                             // 196
            InCaption: InCaption,                                                                                     // 197
            InTable: InTable                                                                                          // 198
        };                                                                                                            // 199
        if(!settings.insertion_mode || !modes[settings.insertion_mode]){                                              // 200
            settings.insertion_mode = 'InBody';                                                                       // 201
        };                                                                                                            // 202
        insertion_mode = modes[settings.insertion_mode];                                                              // 203
                                                                                                                      // 204
        _.extend(allowed_attributes, settings.allowed_attributes);                                                    // 205
        _.extend(customTags, settings.customTags);                                                                    // 206
        _.extend(selfClosing, settings.selfClosingTags);                                                              // 207
                                                                                                                      // 208
        root = new Node('html');                                                                                      // 209
        stack = [root];                                                                                               // 210
        active_elements = [];                                                                                         // 211
        allowed_attributes_as_hash = {};                                                                              // 212
                                                                                                                      // 213
                                                                                                                      // 214
        var attr, i;                                                                                                  // 215
        for (var key in allowed_attributes) {                                                                         // 216
            allowed_attributes_as_hash[key] = {};                                                                     // 217
            for (i in allowed_attributes['all_elements']) {                                                           // 218
                attr = allowed_attributes['all_elements'][i];                                                         // 219
                allowed_attributes_as_hash[key][attr] = true;                                                         // 220
            }                                                                                                         // 221
            if (key === 'all_elements') {                                                                             // 222
                continue;                                                                                             // 223
            }                                                                                                         // 224
            for (i in allowed_attributes[key]) {                                                                      // 225
                attr = allowed_attributes[key][i];                                                                    // 226
                allowed_attributes_as_hash[key][attr] = true;                                                         // 227
            }                                                                                                         // 228
        }                                                                                                             // 229
                                                                                                                      // 230
        noFormatting = !!settings.noFormatting;                                                                       // 231
        preferStrong_Em = !!settings.preferStrong_Em;                                                                 // 232
        preferB_I = !preferStrong_Em && !!settings.preferB_I;                                                         // 233
        allowHeaders = !settings.noHeaders;                                                                           // 234
        withoutTags = {};                                                                                             // 235
                                                                                                                      // 236
        if(typeof settings.withoutTags === 'string' && settings.withoutTags){                                         // 237
            settings.withoutTags = [settings.withoutTags];                                                            // 238
        }                                                                                                             // 239
                                                                                                                      // 240
        if(settings.withoutTags && settings.withoutTags.length){                                                      // 241
            for (var i = settings.withoutTags.length -1 ; i >= 0; i--) {                                              // 242
                withoutTags[settings.withoutTags[i]] = true;                                                          // 243
            }                                                                                                         // 244
        }                                                                                                             // 245
    }                                                                                                                 // 246
                                                                                                                      // 247
    function current_node() {                                                                                         // 248
        return _.last(stack);                                                                                         // 249
    }                                                                                                                 // 250
                                                                                                                      // 251
    function reconstruct_the_active_formatting_elements() {                                                           // 252
        if (active_elements.length === 0 || _.contains(stack, _.last(active_elements))) {                             // 253
            return;                                                                                                   // 254
        }                                                                                                             // 255
        var entry;                                                                                                    // 256
        for (var i = active_elements.length; i > 0; i--) {                                                            // 257
            entry = active_elements[i - 1];                                                                           // 258
            if (_.contains(stack, entry)) {                                                                           // 259
                break;                                                                                                // 260
            }                                                                                                         // 261
        }                                                                                                             // 262
        do {                                                                                                          // 263
            var clone = entry.clone();                                                                                // 264
            current_node().appendChild(clone);                                                                        // 265
            stack.push(clone);                                                                                        // 266
            active_elements[i] = clone;                                                                               // 267
            i += 1;                                                                                                   // 268
        } while (i !== active_elements.length);                                                                       // 269
    }                                                                                                                 // 270
                                                                                                                      // 271
    function has_element_with(arr_of_elements, tagName) {                                                             // 272
        for (var i = arr_of_elements.length; i > 0; i--) {                                                            // 273
            if (arr_of_elements[i - 1].name === tagName) {                                                            // 274
                return true;                                                                                          // 275
            }                                                                                                         // 276
        }                                                                                                             // 277
        return false;                                                                                                 // 278
    }                                                                                                                 // 279
                                                                                                                      // 280
    function in_scope(tagName) {                                                                                      // 281
        return has_element_with(stack, tagName);                                                                      // 282
    }                                                                                                                 // 283
                                                                                                                      // 284
    function in_table_scope(tagName) {                                                                                // 285
        for (var i = stack.length; i > 0; i--) {                                                                      // 286
            var nodeTag = stack[i - 1].name;                                                                          // 287
            if (nodeTag === tagName) {                                                                                // 288
                return true;                                                                                          // 289
            } else if (nodeTag === 'table' || nodeTag === 'html') {                                                   // 290
                return false;                                                                                         // 291
            }                                                                                                         // 292
        }                                                                                                             // 293
        return false;                                                                                                 // 294
    }                                                                                                                 // 295
                                                                                                                      // 296
    function insert_html_element_for(tagName, attrs) {                                                                // 297
        var node = new Node(tagName);                                                                                 // 298
        node.attributes = attrs;                                                                                      // 299
        current_node().appendChild(node);                                                                             // 300
        stack.push(node);                                                                                             // 301
        return node;                                                                                                  // 302
    }                                                                                                                 // 303
                                                                                                                      // 304
    function generate_implied_end_tags(exception) {                                                                   // 305
        var tagName = current_node().name;                                                                            // 306
        while (tags_with_implied_end[tagName] && tagName !== exception) {                                             // 307
            end(tagName);                                                                                             // 308
            tagName = current_node().name;                                                                            // 309
        }                                                                                                             // 310
    }                                                                                                                 // 311
                                                                                                                      // 312
    function trim_to_1_space(str) {                                                                                   // 313
        return str.replace(/^\s+/, ' ').replace(/\s+$/, ' ');                                                         // 314
    }                                                                                                                 // 315
                                                                                                                      // 316
    function clear_stack_to_table_context() {                                                                         // 317
        clear_stack_to_context_by_tags(['table', 'html']);                                                            // 318
    }                                                                                                                 // 319
                                                                                                                      // 320
    function clear_stack_to_table_body_context() {                                                                    // 321
        clear_stack_to_context_by_tags(['tbody', 'tfoot', 'thead', 'html']);                                          // 322
    }                                                                                                                 // 323
                                                                                                                      // 324
    function clear_stack_to_table_row_context() {                                                                     // 325
        clear_stack_to_context_by_tags(['tr', 'html']);                                                               // 326
    }                                                                                                                 // 327
                                                                                                                      // 328
    function clear_stack_to_context_by_tags(tags) {                                                                   // 329
        while (!_.contains(tags, current_node().name)) {                                                              // 330
            stack.pop();                                                                                              // 331
        }                                                                                                             // 332
    }                                                                                                                 // 333
                                                                                                                      // 334
    function clear_active_elements_to_last_marker() {                                                                 // 335
        var entry;                                                                                                    // 336
        do {                                                                                                          // 337
            entry = active_elements.pop();                                                                            // 338
        } while (!scope_markers[entry.name]);                                                                         // 339
    }                                                                                                                 // 340
                                                                                                                      // 341
    function reset_insertion_mode() {                                                                                 // 342
        var last = false;                                                                                             // 343
        var node;                                                                                                     // 344
        for (var i = stack.length - 1; i >= 0; i--) {                                                                 // 345
            node = stack[i];                                                                                          // 346
            if (node === stack[0]) {                                                                                  // 347
                last = true;                                                                                          // 348
            }                                                                                                         // 349
            switch (node.name) {                                                                                      // 350
                case 'th':                                                                                            // 351
                case 'td':                                                                                            // 352
                    if (!last) {                                                                                      // 353
                        insertion_mode = InCell;                                                                      // 354
                        return;                                                                                       // 355
                    }                                                                                                 // 356
                case 'tr':                                                                                            // 357
                    insertion_mode = InRow;                                                                           // 358
                    return;                                                                                           // 359
                case 'tbody':                                                                                         // 360
                case 'thead':                                                                                         // 361
                case 'tfoot':                                                                                         // 362
                    insertion_mode = InTableBody;                                                                     // 363
                    return;                                                                                           // 364
                case 'caption':                                                                                       // 365
                    insertion_mode = InCaption;                                                                       // 366
                    return;                                                                                           // 367
                case 'colgroup':                                                                                      // 368
                    insertion_mode = InColumnGroup;                                                                   // 369
                    return;                                                                                           // 370
                case 'table':                                                                                         // 371
                    insertion_mode = InTable;                                                                         // 372
                    return;                                                                                           // 373
                default:                                                                                              // 374
                    if (last) {                                                                                       // 375
                        insertion_mode = InBody;                                                                      // 376
                        return;                                                                                       // 377
                    }                                                                                                 // 378
            }                                                                                                         // 379
        }                                                                                                             // 380
    }                                                                                                                 // 381
                                                                                                                      // 382
    function close_the_cell() {                                                                                       // 383
        if (in_table_scope('td')) {                                                                                   // 384
            end('td');                                                                                                // 385
        } else {                                                                                                      // 386
            end('th');                                                                                                // 387
        }                                                                                                             // 388
    }                                                                                                                 // 389
                                                                                                                      // 390
    function start(tagName, attrs, unary) {                                                                           // 391
        insertion_mode.insertion_mode_start(tagName, attrs, unary);                                                   // 392
    }                                                                                                                 // 393
                                                                                                                      // 394
    function end(tagName) {                                                                                           // 395
        insertion_mode.insertion_mode_end(tagName);                                                                   // 396
    }                                                                                                                 // 397
                                                                                                                      // 398
    function chars(text) {                                                                                            // 399
        if (typeof(text) === 'undefined') {                                                                           // 400
            return;                                                                                                   // 401
        }                                                                                                             // 402
        text = text.replace(/\n\s*\n\s*\n*/g, '\n\n').replace(/(^\n\n|\n\n$)/g, '');                                  // 403
        var paragraphs = text.split('\n\n');                                                                          // 404
        var trimmedText;                                                                                              // 405
        if (paragraphs.length > 1) {                                                                                  // 406
            for (var i in paragraphs) {                                                                               // 407
                start('p');                                                                                           // 408
                reconstruct_the_active_formatting_elements();                                                         // 409
                trimmedText = trim_to_1_space(paragraphs[i]);                                                         // 410
                current_node().appendChild(new TextNode(trimmedText));                                                // 411
                end('p');                                                                                             // 412
            }                                                                                                         // 413
        } else {                                                                                                      // 414
            if (text.match(/^\s*$/g) && current_node().children.length && current_node().lastChild().name === 'br') { // 415
                return;                                                                                               // 416
            }                                                                                                         // 417
            reconstruct_the_active_formatting_elements();                                                             // 418
            trimmedText = trim_to_1_space(paragraphs[0]);                                                             // 419
            current_node().appendChild(new TextNode(trimmedText));                                                    // 420
        }                                                                                                             // 421
    }                                                                                                                 // 422
                                                                                                                      // 423
    var InBody = {                                                                                                    // 424
        insertion_mode_start: function (tagName, attrs) {                                                             // 425
            var node;                                                                                                 // 426
            tagName = tagName.toLowerCase();                                                                          // 427
            if (withoutTags[tagName]) {                                                                               // 428
                return;                                                                                               // 429
            }                                                                                                         // 430
            if (preferStrong_Em) {                                                                                    // 431
                switch (tagName) {                                                                                    // 432
                    case 'b':                                                                                         // 433
                        start('strong');                                                                              // 434
                        return;                                                                                       // 435
                    case 'i':                                                                                         // 436
                        start('em');                                                                                  // 437
                        return;                                                                                       // 438
                }                                                                                                     // 439
            } else if (preferB_I) {                                                                                   // 440
                switch (tagName) {                                                                                    // 441
                    case 'strong':                                                                                    // 442
                        start('b');                                                                                   // 443
                        return;                                                                                       // 444
                    case 'em':                                                                                        // 445
                        start('i');                                                                                   // 446
                        return;                                                                                       // 447
                }                                                                                                     // 448
            }                                                                                                         // 449
            switch (tagName) {                                                                                        // 450
                case 'h1':                                                                                            // 451
                case 'h2':                                                                                            // 452
                case 'h3':                                                                                            // 453
                case 'h4':                                                                                            // 454
                case 'h5':                                                                                            // 455
                case 'h6':                                                                                            // 456
                case 'h7':                                                                                            // 457
                    if (!allowHeaders) {                                                                              // 458
                        start('p');                                                                                   // 459
                        if (preferB_I) {                                                                              // 460
                            start('b');                                                                               // 461
                        } else {                                                                                      // 462
                            start('strong');                                                                          // 463
                        }                                                                                             // 464
                        return;                                                                                       // 465
                    }                                                                                                 // 466
                case 'blockquote':                                                                                    // 467
                case 'ol':                                                                                            // 468
                case 'p':                                                                                             // 469
                case 'ul':                                                                                            // 470
                case 'pre': // Techically PRE shouldn't be in this groups, since newlines should be ignored after a pre tag
                    if (in_scope('p')) {                                                                              // 472
                        end('p');                                                                                     // 473
                    }                                                                                                 // 474
                    insert_html_element_for(tagName, attrs);                                                          // 475
                    return;                                                                                           // 476
                case 'li':                                                                                            // 477
                    if (in_scope('p')) {                                                                              // 478
                        end('p');                                                                                     // 479
                    }                                                                                                 // 480
                    node = current_node();                                                                            // 481
                    while (node.name === 'li') {                                                                      // 482
                        stack.pop();                                                                                  // 483
                    }                                                                                                 // 484
                    insert_html_element_for(tagName, attrs);                                                          // 485
                    return;                                                                                           // 486
                case 'a':                                                                                             // 487
                    for (var i = active_elements.length; i > 0; i--) {                                                // 488
                        if (active_elements[i - 1].name === 'a') {                                                    // 489
                            end('a');                                                                                 // 490
                            active_elements.splice(i - 1, 1);                                                         // 491
                        }                                                                                             // 492
                    }                                                                                                 // 493
                    reconstruct_the_active_formatting_elements();                                                     // 494
                    node = insert_html_element_for(tagName, attrs);                                                   // 495
                    active_elements.push(node);                                                                       // 496
                    return;                                                                                           // 497
                case 'strong':                                                                                        // 498
                case 'b':                                                                                             // 499
                case 'em':                                                                                            // 500
                case 'i':                                                                                             // 501
                case 'u':                                                                                             // 502
                case 'span':                                                                                          // 503
                    reconstruct_the_active_formatting_elements();                                                     // 504
                    node = insert_html_element_for(tagName, attrs);                                                   // 505
                    active_elements.push(node);                                                                       // 506
                    return;                                                                                           // 507
                case 'table':                                                                                         // 508
                    if (in_scope('p')) {                                                                              // 509
                        end('p');                                                                                     // 510
                    }                                                                                                 // 511
                    insert_html_element_for(tagName, attrs);                                                          // 512
                    insertion_mode = InTable;                                                                         // 513
                    return;                                                                                           // 514
                case 'br':                                                                                            // 515
                case 'img':                                                                                           // 516
                    reconstruct_the_active_formatting_elements();                                                     // 517
                    insert_html_element_for(tagName, attrs);                                                          // 518
                    stack.pop();                                                                                      // 519
                    return;                                                                                           // 520
            }                                                                                                         // 521
            if (customTags[tagName]) {                                                                                // 522
                if (selfClosing[tagName]) {                                                                           // 523
                    reconstruct_the_active_formatting_elements();                                                     // 524
                    insert_html_element_for(tagName, attrs);                                                          // 525
                    stack.pop();                                                                                      // 526
                    return;                                                                                           // 527
                } else {                                                                                              // 528
                    reconstruct_the_active_formatting_elements();                                                     // 529
                    node = insert_html_element_for(tagName, attrs);                                                   // 530
                    active_elements.push(node);                                                                       // 531
                    return;                                                                                           // 532
                }                                                                                                     // 533
            }                                                                                                         // 534
        },                                                                                                            // 535
                                                                                                                      // 536
        insertion_mode_end: function (tagName) {                                                                      // 537
            if (typeof tagName === 'undefined') {                                                                     // 538
                return;                                                                                               // 539
            }                                                                                                         // 540
            var node;                                                                                                 // 541
            tagName = tagName.toLowerCase();                                                                          // 542
            if (!withoutTags[tagName]) {                                                                              // 543
                if (preferStrong_Em) {                                                                                // 544
                    switch (tagName) {                                                                                // 545
                        case 'b':                                                                                     // 546
                            end('strong');                                                                            // 547
                            return;                                                                                   // 548
                        case 'i':                                                                                     // 549
                            end('em');                                                                                // 550
                            return;                                                                                   // 551
                    }                                                                                                 // 552
                } else if (preferB_I) {                                                                               // 553
                    switch (tagName) {                                                                                // 554
                        case 'strong':                                                                                // 555
                            end('b');                                                                                 // 556
                            return;                                                                                   // 557
                        case 'em':                                                                                    // 558
                            end('i');                                                                                 // 559
                            return;                                                                                   // 560
                    }                                                                                                 // 561
                }                                                                                                     // 562
                switch (tagName) {                                                                                    // 563
                    case 'h1':                                                                                        // 564
                    case 'h2':                                                                                        // 565
                    case 'h3':                                                                                        // 566
                    case 'h4':                                                                                        // 567
                    case 'h5':                                                                                        // 568
                    case 'h6':                                                                                        // 569
                    case 'h7':                                                                                        // 570
                        if (!allowHeaders) {                                                                          // 571
                            if (preferB_I) {                                                                          // 572
                                end('b');                                                                             // 573
                            } else {                                                                                  // 574
                                end('strong');                                                                        // 575
                            }                                                                                         // 576
                            end('p');                                                                                 // 577
                            return;                                                                                   // 578
                        }                                                                                             // 579
                        if (in_scope(tagName)) {                                                                      // 580
                            generate_implied_end_tags();                                                              // 581
                            do {                                                                                      // 582
                                node = stack.pop();                                                                   // 583
                            } while (node.name !== tagName);                                                          // 584
                        }                                                                                             // 585
                        return;                                                                                       // 586
                    case 'blockquote':                                                                                // 587
                    case 'ol':                                                                                        // 588
                    case 'ul':                                                                                        // 589
                    case 'pre': // Techically PRE shouldn't be in this groups, since newlines should be ignored after a pre tag
                        if (in_scope(tagName)) {                                                                      // 591
                            generate_implied_end_tags();                                                              // 592
                        }                                                                                             // 593
                        if (in_scope(tagName)) {                                                                      // 594
                            do {                                                                                      // 595
                                node = stack.pop();                                                                   // 596
                            } while (node.name !== tagName);                                                          // 597
                        }                                                                                             // 598
                        return;                                                                                       // 599
                    case 'p':                                                                                         // 600
                        if (in_scope(tagName)) {                                                                      // 601
                            generate_implied_end_tags(tagName);                                                       // 602
                        }                                                                                             // 603
                        var no_p_in_scope = true;                                                                     // 604
                        while (in_scope(tagName)) {                                                                   // 605
                            no_p_in_scope = false;                                                                    // 606
                            node = stack.pop();                                                                       // 607
                        }                                                                                             // 608
                        if (no_p_in_scope) {                                                                          // 609
                            start('p', [], false);                                                                    // 610
                            end('p');                                                                                 // 611
                        }                                                                                             // 612
                        return;                                                                                       // 613
                    case 'li':                                                                                        // 614
                        if (in_scope(tagName)) {                                                                      // 615
                            generate_implied_end_tags(tagName);                                                       // 616
                        }                                                                                             // 617
                        if (in_scope(tagName)) {                                                                      // 618
                            do {                                                                                      // 619
                                node = stack.pop();                                                                   // 620
                            } while (node.name !== tagName);                                                          // 621
                        }                                                                                             // 622
                        return;                                                                                       // 623
                    case 'a':                                                                                         // 624
                    case 'i':                                                                                         // 625
                    case 'em':                                                                                        // 626
                    case 'strong':                                                                                    // 627
                    case 'b':                                                                                         // 628
                    case 'u':                                                                                         // 629
                    case 'span':                                                                                      // 630
                        for (var i = active_elements.length; i > 0; i--) {                                            // 631
                            if (active_elements[i - 1].name === tagName) {                                            // 632
                                node = active_elements[i - 1];                                                        // 633
                                break;                                                                                // 634
                            }                                                                                         // 635
                        }                                                                                             // 636
                        if (typeof(node) === 'undefined' || !_.contains(stack, node)) {                               // 637
                            return;                                                                                   // 638
                        }                                                                                             // 639
                        // Step 2 from the algorithm in the HTML5 spec will never be necessary with the tags we allow // 640
                        var popped_node;                                                                              // 641
                        do {                                                                                          // 642
                            popped_node = stack.pop();                                                                // 643
                        } while (popped_node !== node);                                                               // 644
                        active_elements.splice(i - 1, 1);                                                             // 645
                        return;                                                                                       // 646
                                                                                                                      // 647
                }                                                                                                     // 648
                if (customTags[tagName] && !selfClosing[tagName]) {                                                   // 649
                    for (var i = active_elements.length; i > 0; i--) {                                                // 650
                        if (active_elements[i - 1].name === tagName) {                                                // 651
                            node = active_elements[i - 1];                                                            // 652
                            break;                                                                                    // 653
                        }                                                                                             // 654
                    }                                                                                                 // 655
                    if (typeof(node) === 'undefined' || !_.contains(stack, node)) {                                   // 656
                        return;                                                                                       // 657
                    }                                                                                                 // 658
                    // Step 2 from the algorithm in the HTML5 spec will never be necessary with the tags we allow     // 659
                    var popped_node;                                                                                  // 660
                    do {                                                                                              // 661
                        popped_node = stack.pop();                                                                    // 662
                    } while (popped_node !== node);                                                                   // 663
                    active_elements.splice(i - 1, 1);                                                                 // 664
                    return;                                                                                           // 665
                }                                                                                                     // 666
            }                                                                                                         // 667
            node = current_node();                                                                                    // 668
            if (node.name === tagName) {                                                                              // 669
                generate_implied_end_tags();                                                                          // 670
                while (stack.length > 0 && node !== current_node()) {                                                 // 671
                    stack.pop();                                                                                      // 672
                }                                                                                                     // 673
            }                                                                                                         // 674
        }                                                                                                             // 675
    };                                                                                                                // 676
                                                                                                                      // 677
    var InTable = {                                                                                                   // 678
        insertion_mode_start: function (tagName, attrs, unary) {                                                      // 679
            tagName = tagName.toLowerCase();                                                                          // 680
            switch (tagName) {                                                                                        // 681
                case 'caption':                                                                                       // 682
                    clear_stack_to_table_context();                                                                   // 683
                    active_elements.push(insert_html_element_for(tagName, attrs));                                    // 684
                    insertion_mode = InCaption;                                                                       // 685
                    return;                                                                                           // 686
                case 'colgroup':                                                                                      // 687
                    clear_stack_to_table_context();                                                                   // 688
                    insert_html_element_for(tagName, attrs);                                                          // 689
                    insertion_mode = InColumnGroup;                                                                   // 690
                    return;                                                                                           // 691
                case 'col':                                                                                           // 692
                    start('colgroup');                                                                                // 693
                    start(tagName, attrs, unary);                                                                     // 694
                    return;                                                                                           // 695
                case 'tbody':                                                                                         // 696
                case 'tfoot':                                                                                         // 697
                case 'thead':                                                                                         // 698
                    clear_stack_to_table_context();                                                                   // 699
                    insert_html_element_for(tagName, attrs);                                                          // 700
                    insertion_mode = InTableBody;                                                                     // 701
                    return;                                                                                           // 702
                case 'td':                                                                                            // 703
                case 'th':                                                                                            // 704
                case 'tr':                                                                                            // 705
                    start('tbody');                                                                                   // 706
                    start(tagName, attrs, unary);                                                                     // 707
                    return;                                                                                           // 708
            }                                                                                                         // 709
        },                                                                                                            // 710
                                                                                                                      // 711
        insertion_mode_end: function (tagName) {                                                                      // 712
            if (typeof(tagName) === undefined) {                                                                      // 713
                return;                                                                                               // 714
            }                                                                                                         // 715
            tagName = tagName.toLowerCase();                                                                          // 716
            switch (tagName) {                                                                                        // 717
                case 'table':                                                                                         // 718
                    if (in_table_scope('table')) {                                                                    // 719
                        var node;                                                                                     // 720
                        do {                                                                                          // 721
                            node = stack.pop();                                                                       // 722
                        } while (node.name !== 'table');                                                              // 723
                    }                                                                                                 // 724
                    reset_insertion_mode();                                                                           // 725
                    return;                                                                                           // 726
            }                                                                                                         // 727
        }                                                                                                             // 728
    };                                                                                                                // 729
                                                                                                                      // 730
    var InCaption = {                                                                                                 // 731
        insertion_mode_start: function (tagName, attrs, unary) {                                                      // 732
            tagName = tagName.toLowerCase();                                                                          // 733
            switch (tagName) {                                                                                        // 734
                case 'caption':                                                                                       // 735
                case 'col':                                                                                           // 736
                case 'colgroup':                                                                                      // 737
                case 'tbody':                                                                                         // 738
                case 'td':                                                                                            // 739
                case 'tfoot':                                                                                         // 740
                case 'th':                                                                                            // 741
                case 'thead':                                                                                         // 742
                case 'tr':                                                                                            // 743
                    end('caption');                                                                                   // 744
                    start(tagName);                                                                                   // 745
                    return;                                                                                           // 746
                default:                                                                                              // 747
                    InBody.insertion_mode_start(tagName, attrs, unary);                                               // 748
                    return;                                                                                           // 749
            }                                                                                                         // 750
        },                                                                                                            // 751
                                                                                                                      // 752
        insertion_mode_end: function (tagName) {                                                                      // 753
            if (typeof(tagName) === undefined) {                                                                      // 754
                return;                                                                                               // 755
            }                                                                                                         // 756
            tagName = tagName.toLowerCase();                                                                          // 757
            switch (tagName) {                                                                                        // 758
                case 'caption':                                                                                       // 759
                    if (in_table_scope('caption')) {                                                                  // 760
                        generate_implied_end_tags();                                                                  // 761
                        if (current_node().name === 'caption') {                                                      // 762
                            var node;                                                                                 // 763
                            do {                                                                                      // 764
                                node = stack.pop();                                                                   // 765
                            } while (node.name !== 'caption');                                                        // 766
                            clear_active_elements_to_last_marker();                                                   // 767
                            insertion_mode = InTable;                                                                 // 768
                        }                                                                                             // 769
                    }                                                                                                 // 770
                    return;                                                                                           // 771
                case "body":                                                                                          // 772
                case "col":                                                                                           // 773
                case "colgroup":                                                                                      // 774
                case "html":                                                                                          // 775
                case "tbody":                                                                                         // 776
                case "td":                                                                                            // 777
                case "tfoot":                                                                                         // 778
                case "th":                                                                                            // 779
                case "thead":                                                                                         // 780
                case "tr":                                                                                            // 781
                    return;                                                                                           // 782
                case 'table':                                                                                         // 783
                    end('caption');                                                                                   // 784
                    end('table');                                                                                     // 785
                    return;                                                                                           // 786
                default:                                                                                              // 787
                    InBody.insertion_mode_end(tagName);                                                               // 788
                    return;                                                                                           // 789
            }                                                                                                         // 790
        }                                                                                                             // 791
    };                                                                                                                // 792
                                                                                                                      // 793
    var InColumnGroup = {                                                                                             // 794
        insertion_mode_start: function (tagName, attrs, unary) {                                                      // 795
            tagName = tagName.toLowerCase();                                                                          // 796
            switch (tagName) {                                                                                        // 797
                case 'html':                                                                                          // 798
                    InBody.insertion_mode_start(tagName, attrs, unary);                                               // 799
                    return;                                                                                           // 800
                case 'col':                                                                                           // 801
                    insert_html_element_for(tagName, attrs);                                                          // 802
                    stack.pop();                                                                                      // 803
                    return;                                                                                           // 804
                default:                                                                                              // 805
                    end('colgroup');                                                                                  // 806
                    start(tagName);                                                                                   // 807
                    return;                                                                                           // 808
            }                                                                                                         // 809
        },                                                                                                            // 810
                                                                                                                      // 811
        insertion_mode_end: function (tagName) {                                                                      // 812
            if (typeof(tagName) === undefined) {                                                                      // 813
                return;                                                                                               // 814
            }                                                                                                         // 815
            tagName = tagName.toLowerCase();                                                                          // 816
            switch (tagName) {                                                                                        // 817
                case 'colgroup':                                                                                      // 818
                    if (current_node().name !== 'html') {                                                             // 819
                        stack.pop();                                                                                  // 820
                        insertion_mode = InTable;                                                                     // 821
                    }                                                                                                 // 822
                    return;                                                                                           // 823
                case 'col':                                                                                           // 824
                    return;                                                                                           // 825
                default:                                                                                              // 826
                    end('colgroup');                                                                                  // 827
                    end(tagName);                                                                                     // 828
                    return;                                                                                           // 829
            }                                                                                                         // 830
        }                                                                                                             // 831
    };                                                                                                                // 832
                                                                                                                      // 833
    var InTableBody = {                                                                                               // 834
        insertion_mode_start: function (tagName, attrs, unary) {                                                      // 835
            tagName = tagName.toLowerCase();                                                                          // 836
            switch (tagName) {                                                                                        // 837
                case 'tr':                                                                                            // 838
                    clear_stack_to_table_body_context();                                                              // 839
                    insert_html_element_for(tagName, attrs);                                                          // 840
                    insertion_mode = InRow;                                                                           // 841
                    return;                                                                                           // 842
                case 'th':                                                                                            // 843
                case 'td':                                                                                            // 844
                    start('tr');                                                                                      // 845
                    start(tagName, attrs, unary);                                                                     // 846
                    return;                                                                                           // 847
                case "caption":                                                                                       // 848
                case "col":                                                                                           // 849
                case "colgroup":                                                                                      // 850
                case "tbody":                                                                                         // 851
                case "tfoot":                                                                                         // 852
                case "thead":                                                                                         // 853
                    if (in_table_scope('tbody') || in_table_scope('thead') || in_table_scope('tfoot')) {              // 854
                        clear_stack_to_table_body_context();                                                          // 855
                        end(current_node().name);                                                                     // 856
                        start(tagName, attrs, unary);                                                                 // 857
                    }                                                                                                 // 858
                    return;                                                                                           // 859
            }                                                                                                         // 860
        },                                                                                                            // 861
                                                                                                                      // 862
        insertion_mode_end: function (tagName) {                                                                      // 863
            if (typeof(tagName) === undefined) {                                                                      // 864
                return;                                                                                               // 865
            }                                                                                                         // 866
            tagName = tagName.toLowerCase();                                                                          // 867
            switch (tagName) {                                                                                        // 868
                case 'tbody':                                                                                         // 869
                case 'tfoot':                                                                                         // 870
                case 'thead':                                                                                         // 871
                    if (in_table_scope(tagName)) {                                                                    // 872
                        clear_stack_to_table_body_context();                                                          // 873
                        stack.pop();                                                                                  // 874
                        insertion_mode = InTable;                                                                     // 875
                    }                                                                                                 // 876
                    return;                                                                                           // 877
                case 'table':                                                                                         // 878
                    if (in_table_scope('tbody') || in_table_scope('thead') || in_table_scope('tfoot')) {              // 879
                        clear_stack_to_table_body_context();                                                          // 880
                        end(current_node().name);                                                                     // 881
                        end(tagName);                                                                                 // 882
                    }                                                                                                 // 883
                    return;                                                                                           // 884
                case "body":                                                                                          // 885
                case "caption":                                                                                       // 886
                case "col":                                                                                           // 887
                case "colgroup":                                                                                      // 888
                case "html":                                                                                          // 889
                case "td":                                                                                            // 890
                case "th":                                                                                            // 891
                case "tr":                                                                                            // 892
                    return;                                                                                           // 893
                default:                                                                                              // 894
                    InTable.insertion_mode_end(tagName);                                                              // 895
                    return;                                                                                           // 896
            }                                                                                                         // 897
        }                                                                                                             // 898
    };                                                                                                                // 899
                                                                                                                      // 900
    var InRow = {                                                                                                     // 901
        insertion_mode_start: function (tagName, attrs, unary) {                                                      // 902
            tagName = tagName.toLowerCase();                                                                          // 903
            switch (tagName) {                                                                                        // 904
                case 'th':                                                                                            // 905
                case 'td':                                                                                            // 906
                    clear_stack_to_table_row_context();                                                               // 907
                    var node = insert_html_element_for(tagName, attrs);                                               // 908
                    insertion_mode = InCell;                                                                          // 909
                    active_elements.push(node);                                                                       // 910
                    return;                                                                                           // 911
                case "caption":                                                                                       // 912
                case "col":                                                                                           // 913
                case "colgroup":                                                                                      // 914
                case "tbody":                                                                                         // 915
                case "tfoot":                                                                                         // 916
                case "thead":                                                                                         // 917
                case "tr":                                                                                            // 918
                    end('tr');                                                                                        // 919
                    start(tagName, attrs, unary);                                                                     // 920
                    return;                                                                                           // 921
                default:                                                                                              // 922
                    InTable.insertion_mode_start(tagName, attrs, unary);                                              // 923
                    return;                                                                                           // 924
            }                                                                                                         // 925
        },                                                                                                            // 926
                                                                                                                      // 927
        insertion_mode_end: function (tagName) {                                                                      // 928
            if (typeof(tagName) === undefined) {                                                                      // 929
                return;                                                                                               // 930
            }                                                                                                         // 931
            tagName = tagName.toLowerCase();                                                                          // 932
            switch (tagName) {                                                                                        // 933
                case 'tr':                                                                                            // 934
                    if (in_table_scope(tagName)) {                                                                    // 935
                        clear_stack_to_table_row_context();                                                           // 936
                        stack.pop();                                                                                  // 937
                        insertion_mode = InTableBody;                                                                 // 938
                    }                                                                                                 // 939
                    return;                                                                                           // 940
                case 'table':                                                                                         // 941
                    end('tr');                                                                                        // 942
                                                                                                                      // 943
                    // this line was in the original source but attrs/unary are not defined                           // 944
                    // so not sure what to do with it. how was this working?                                          // 945
                    // start(tagName, attrs, unary);                                                                  // 946
                    return;                                                                                           // 947
                case "tbody":                                                                                         // 948
                case "tfoot":                                                                                         // 949
                case "thead":                                                                                         // 950
                    if (in_table_scope(tagName)) {                                                                    // 951
                        end('tr');                                                                                    // 952
                        end(tagName);                                                                                 // 953
                    }                                                                                                 // 954
                    return;                                                                                           // 955
                case "body":                                                                                          // 956
                case "caption":                                                                                       // 957
                case "col":                                                                                           // 958
                case "colgroup":                                                                                      // 959
                case "html":                                                                                          // 960
                case "td":                                                                                            // 961
                case "th":                                                                                            // 962
                    return;                                                                                           // 963
                default:                                                                                              // 964
                    InTable.insertion_mode_end(tagName);                                                              // 965
                    return;                                                                                           // 966
            }                                                                                                         // 967
        }                                                                                                             // 968
    };                                                                                                                // 969
                                                                                                                      // 970
    var InCell = {                                                                                                    // 971
        insertion_mode_start: function (tagName, attrs, unary) {                                                      // 972
            tagName = tagName.toLowerCase();                                                                          // 973
            switch (tagName) {                                                                                        // 974
                case "caption":                                                                                       // 975
                case "col":                                                                                           // 976
                case "colgroup":                                                                                      // 977
                case "tbody":                                                                                         // 978
                case "td":                                                                                            // 979
                case "tfoot":                                                                                         // 980
                case "th":                                                                                            // 981
                case "thead":                                                                                         // 982
                case "tr":                                                                                            // 983
                    if (in_table_scope('td') || in_table_scope('th')) {                                               // 984
                        close_the_cell();                                                                             // 985
                        start(tagName, attrs, unary);                                                                 // 986
                    }                                                                                                 // 987
                    return;                                                                                           // 988
                default:                                                                                              // 989
                    InBody.insertion_mode_start(tagName, attrs, unary);                                               // 990
                    return;                                                                                           // 991
            }                                                                                                         // 992
        },                                                                                                            // 993
                                                                                                                      // 994
        insertion_mode_end: function (tagName) {                                                                      // 995
            if (typeof(tagName) === undefined) {                                                                      // 996
                return;                                                                                               // 997
            }                                                                                                         // 998
            tagName = tagName.toLowerCase();                                                                          // 999
            switch (tagName) {                                                                                        // 1000
                case "td":                                                                                            // 1001
                case "th":                                                                                            // 1002
                    if (in_table_scope(tagName)) {                                                                    // 1003
                        generate_implied_end_tags();                                                                  // 1004
                        if (current_node().name !== tagName) {                                                        // 1005
                            return;                                                                                   // 1006
                        }                                                                                             // 1007
                        var node;                                                                                     // 1008
                        do {                                                                                          // 1009
                            node = stack.pop();                                                                       // 1010
                        } while (node.name !== tagName);                                                              // 1011
                                                                                                                      // 1012
                        clear_active_elements_to_last_marker();                                                       // 1013
                        insertion_mode = InRow;                                                                       // 1014
                    }                                                                                                 // 1015
                    return;                                                                                           // 1016
                case "body":                                                                                          // 1017
                case "caption":                                                                                       // 1018
                case "col":                                                                                           // 1019
                case "colgroup":                                                                                      // 1020
                case "html":                                                                                          // 1021
                    return;                                                                                           // 1022
                case "table":                                                                                         // 1023
                case "tbody":                                                                                         // 1024
                case "tfoot":                                                                                         // 1025
                case "thead":                                                                                         // 1026
                case "tr":                                                                                            // 1027
                    if (in_table_scope(tagName)) {                                                                    // 1028
                        close_the_cell();                                                                             // 1029
                        end(tagName);                                                                                 // 1030
                    }                                                                                                 // 1031
                    return;                                                                                           // 1032
                default:                                                                                              // 1033
                    InBody.insertion_mode_end(tagName);                                                               // 1034
                    return;                                                                                           // 1035
            }                                                                                                         // 1036
        }                                                                                                             // 1037
    };                                                                                                                // 1038
                                                                                                                      // 1039
    init(settings);                                                                                                   // 1040
                                                                                                                      // 1041
    return {                                                                                                          // 1042
        start: start,                                                                                                 // 1043
        end: end,                                                                                                     // 1044
        chars: chars,                                                                                                 // 1045
        getResult: function(){                                                                                        // 1046
            return root.innerHTML().replace(/^\s+/, '');                                                              // 1047
        }                                                                                                             // 1048
    };                                                                                                                // 1049
                                                                                                                      // 1050
};                                                                                                                    // 1051
                                                                                                                      // 1052
                                                                                                                      // 1053
var allowed_attributes = {};                                                                                          // 1054
var customTags = {};                                                                                                  // 1055
var selfClosing = {};                                                                                                 // 1056
                                                                                                                      // 1057
/* global UniHTML: true */                                                                                            // 1058
UniHTML = {                                                                                                           // 1059
    /**                                                                                                               // 1060
     * Parse html string and calls callback in the same order as tags in html string are present.                     // 1061
     * Method supports html5, including custom tags.                                                                  // 1062
     * @param html                                                                                                    // 1063
     * @param handler {Object} object of callbacks for example:                                                       // 1064
     * {                                                                                                              // 1065
     *          // attributesOnTag is an Object like {name, value, escaped}                                           // 1066
     *      start: function(tagName, attributesOnTag, isSelfClosing), // open tag                                     // 1067
     *      end: function(tagName), // close                                                                          // 1068
     *      chars: function(text), // text between open and closing tag                                               // 1069
     *      comment: function(text) // text from comment                                                              // 1070
     * }                                                                                                              // 1071
     * @throws Parse Error                                                                                            // 1072
     */                                                                                                               // 1073
    parse: HTMLParser,                                                                                                // 1074
    /**                                                                                                               // 1075
     * Cleanup dirty html from unknown/untrusted tags                                                                 // 1076
     * @param html {string} html string to purify                                                                     // 1077
     * @param settings {Object} noFormatting, preferStrong_Em, preferB_I, noHeaders, withoutTags                      // 1078
     * @returns {HTML|string|void}                                                                                    // 1079
     */                                                                                                               // 1080
    purify: function (html, settings) {                                                                               // 1081
        if (typeof settings !== 'object') {                                                                           // 1082
            settings = {};                                                                                            // 1083
        }                                                                                                             // 1084
        settings = _.extend({                                                                                         // 1085
            allowed_attributes: allowed_attributes,                                                                   // 1086
            customTags: customTags,                                                                                   // 1087
            selfClosingTags: selfClosing                                                                              // 1088
        }, settings);                                                                                                 // 1089
        var purifierInstance = htmlPurifier(settings);                                                                // 1090
                                                                                                                      // 1091
        try {                                                                                                         // 1092
            HTMLParser(html, {                                                                                        // 1093
                start: purifierInstance.start,                                                                        // 1094
                end: purifierInstance.end,                                                                            // 1095
                chars: purifierInstance.chars                                                                         // 1096
            });                                                                                                       // 1097
        } catch (e) {                                                                                                 // 1098
            if (!settings.catchErrors) {                                                                              // 1099
                throw e;                                                                                              // 1100
            }                                                                                                         // 1101
        }                                                                                                             // 1102
        return purifierInstance.getResult();                                                                          // 1103
    },                                                                                                                // 1104
    /**                                                                                                               // 1105
     * Sets new default allowed attributes for one or all tags                                                        // 1106
     * (it can be overridden by setting 'allowed_attributes' in purify)                                               // 1107
     * @param attributesArray {Array} Array of names of attributes                                                    // 1108
     * @param tag {string=} [tag=all_elements]                                                                        // 1109
     */                                                                                                               // 1110
    setNewAllowedAttributes: function (attributesArray, tag) {                                                        // 1111
        if (!tag) {                                                                                                   // 1112
            tag = 'all_elements';                                                                                     // 1113
        }                                                                                                             // 1114
        if (!attributesArray) {                                                                                       // 1115
            attributesArray = [];                                                                                     // 1116
        }                                                                                                             // 1117
        if (typeof attributesArray === 'string') {                                                                    // 1118
            attributesArray = [attributesArray];                                                                      // 1119
        }                                                                                                             // 1120
        allowed_attributes[tag] = attributesArray;                                                                    // 1121
    },                                                                                                                // 1122
    /**                                                                                                               // 1123
     * Adds new default allowed html tag                                                                              // 1124
     * (it can be overridden by settings 'customTags', 'selfClosingTags' in purify method)                            // 1125
     * @param tagName {string}                                                                                        // 1126
     * @param isSelfClosing {boolean=} a void tags like: img, hr, area                                                // 1127
     */                                                                                                               // 1128
    addNewAllowedTag: function (tagName, isSelfClosing) {                                                             // 1129
        customTags[tagName] = true;                                                                                   // 1130
        if (isSelfClosing) {                                                                                          // 1131
            selfClosing[tagName] = true;                                                                              // 1132
        }                                                                                                             // 1133
    }                                                                                                                 // 1134
                                                                                                                      // 1135
};                                                                                                                    // 1136
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package['vazco:universe-html-purifier'] = {
  UniHTML: UniHTML
};

})();

//# sourceMappingURL=vazco_universe-html-purifier.js.map
