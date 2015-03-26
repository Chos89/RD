(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;

/* Package-scope variables */
var UniHTML, HTMLParser;

(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/vazco:universe-html-purifier/HTMLParser.js                                                            //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
/*                                                                                                                // 1
 * HTML Parser By John Resig (ejohn.org)                                                                          // 2
 * Original code by Erik Arvidsson, Licensed under the Apache License, Version 2.0 or Mozilla Public License      // 3
 * http://erik.eae.net/simplehtmlparser/simplehtmlparser.js                                                       // 4
                                                                                                                  // 5
 * added support of HTML5 by Krzysztof Różalski <cristo.rabani@gmail.com>                                         // 6
 */                                                                                                               // 7
                                                                                                                  // 8
// Regular Expressions for parsing tags and attributes (modified attribute name matcher, to catch xml:lang)       // 9
var startTag = /^<([\w-]+\:?\w*)((?:\s+[a-zA-Z_:-]+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/,  // 10
	endTag = /^<\/([\w-]+)[^>]*>/,                                                                                   // 11
	attr = /([\w-]+)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/g;                         // 12
                                                                                                                  // 13
function makeMap(str){                                                                                            // 14
	var obj = {}, items = str.split(",");                                                                            // 15
	for ( var i = 0; i < items.length; i++ )                                                                         // 16
		obj[ items[i] ] = true;                                                                                         // 17
	return obj;                                                                                                      // 18
}                                                                                                                 // 19
                                                                                                                  // 20
var empty = makeMap("area,base,basefont,br,col,frame,hr,img,input,isindex,keygen,link,meta,menuitem,source,track,param,embed,wbr");
                                                                                                                  // 22
var block = makeMap("article,aside,address,applet,blockquote,button,canvas,center,dd,del,dir,div,dl,dt,fieldset,figcaption,figure,form,footer,frameset,hr,iframe,header,hgroup,ins,isindex,li,map,menu,noframes,noscript,object,ol,output,p,pre,progress,section,script,table,tbody,td,tfoot,th,thead,tr,ul,video");
                                                                                                                  // 24
var inline = makeMap("a,abbr,acronym,applet,audio,b,basefont,bdo,big,br,button,cite,code,command,del,details,dfn,em,font,i,iframe,img,input,ins,kbd,label,map,mark,meter,nav,object,q,s,samp,script,select,small,span,strike,strong,sub,summary,sup,textarea,tt,u,time,var");
                                                                                                                  // 26
// Elements that you can, intentionally, leave open                                                               // 27
// (and which close themselves)                                                                                   // 28
var closeSelf = makeMap("colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr");                                      // 29
                                                                                                                  // 30
// Attributes that have their values filled in disabled="disabled"                                                // 31
var fillAttrs = makeMap("checked,compact,declare,defer,disabled,ismap,multiple,nohref,noresize,noshade,nowrap,readonly,selected");
                                                                                                                  // 33
// Special Elements (can contain anything)                                                                        // 34
var special = makeMap("script,style");                                                                            // 35
                                                                                                                  // 36
HTMLParser = function( html, handler ) {                                                                          // 37
	var index, chars, match, stack = [], last = html;                                                                // 38
	stack.last = function(){                                                                                         // 39
		return this[ this.length - 1 ];                                                                                 // 40
	};                                                                                                               // 41
                                                                                                                  // 42
	function parseStartTag( tag, tagName, rest, unary ) {                                                            // 43
		if ( block[ tagName ] ) {                                                                                       // 44
			while ( stack.last() && inline[ stack.last() ] ) {                                                             // 45
				parseEndTag( "", stack.last() );                                                                              // 46
			}                                                                                                              // 47
		}                                                                                                               // 48
                                                                                                                  // 49
		if ( closeSelf[ tagName ] && stack.last() === tagName ) {                                                       // 50
			parseEndTag( "", tagName );                                                                                    // 51
		}                                                                                                               // 52
                                                                                                                  // 53
		unary = empty[ tagName ] || !!unary;                                                                            // 54
                                                                                                                  // 55
		if ( !unary )                                                                                                   // 56
			stack.push( tagName );                                                                                         // 57
                                                                                                                  // 58
		if ( handler.start ) {                                                                                          // 59
			var attrs = [];                                                                                                // 60
                                                                                                                  // 61
			rest.replace(attr, function(match, name) {                                                                     // 62
				var value = arguments[2] ? arguments[2] :                                                                     // 63
					arguments[3] ? arguments[3] :                                                                                // 64
					arguments[4] ? arguments[4] :                                                                                // 65
					fillAttrs[name] ? name : "";                                                                                 // 66
                                                                                                                  // 67
				attrs.push({                                                                                                  // 68
					name: name,                                                                                                  // 69
					value: value,                                                                                                // 70
					escaped: value.replace(/(^|[^\\])"/g, '$1\\\"') //"                                                          // 71
				});                                                                                                           // 72
			});                                                                                                            // 73
                                                                                                                  // 74
			if ( handler.start )                                                                                           // 75
				handler.start( tagName, attrs, unary );                                                                       // 76
		}                                                                                                               // 77
	}                                                                                                                // 78
                                                                                                                  // 79
	function parseEndTag( tag, tagName ) {                                                                           // 80
		var pos;                                                                                                        // 81
                                                                                                                  // 82
		// If no tag name is provided, clean shop                                                                       // 83
		if (!tagName) {                                                                                                 // 84
			pos = 0;                                                                                                       // 85
		}                                                                                                               // 86
                                                                                                                  // 87
		// Find the closest opened tag of the same type                                                                 // 88
		else                                                                                                            // 89
			for ( pos = stack.length - 1; pos >= 0; pos-- )                                                                // 90
				if ( stack[ pos ] === tagName )                                                                               // 91
					break;                                                                                                       // 92
                                                                                                                  // 93
		if ( pos >= 0 ) {                                                                                               // 94
			// Close all the open elements, up the stack                                                                   // 95
			for ( var i = stack.length - 1; i >= pos; i-- )                                                                // 96
				if ( handler.end )                                                                                            // 97
					handler.end( stack[ i ] );                                                                                   // 98
                                                                                                                  // 99
			// Remove the open elements from the stack                                                                     // 100
			stack.length = pos;                                                                                            // 101
		}                                                                                                               // 102
	}                                                                                                                // 103
                                                                                                                  // 104
	while ( html ) {                                                                                                 // 105
		chars = true;                                                                                                   // 106
		// Make sure we're not in a script or style element                                                             // 107
		if ( !stack.last() || !special[ stack.last() ] ) {                                                              // 108
                                                                                                                  // 109
			// Comment                                                                                                     // 110
			if ( html.indexOf("<!--") === 0 ) {                                                                            // 111
				index = html.indexOf("-->");                                                                                  // 112
                                                                                                                  // 113
				if ( index >= 0 ) {                                                                                           // 114
					if ( handler.comment )                                                                                       // 115
						handler.comment( html.substring( 4, index ) );                                                              // 116
					html = html.substring( index + 3 );                                                                          // 117
					chars = false;                                                                                               // 118
				}                                                                                                             // 119
                                                                                                                  // 120
			// end tag                                                                                                     // 121
			} else if ( html.indexOf("</") === 0 ) {                                                                       // 122
				match = html.match( endTag );                                                                                 // 123
                                                                                                                  // 124
				if ( match ) {                                                                                                // 125
					html = html.substring( match[0].length );                                                                    // 126
					match[0].replace( endTag, parseEndTag );                                                                     // 127
					chars = false;                                                                                               // 128
				}                                                                                                             // 129
                                                                                                                  // 130
			// start tag                                                                                                   // 131
			} else if ( html.indexOf("<") === 0 ) {                                                                        // 132
				match = html.match( startTag );                                                                               // 133
                                                                                                                  // 134
				if ( match ) {                                                                                                // 135
					html = html.substring( match[0].length );                                                                    // 136
					match[0].replace( startTag, parseStartTag );                                                                 // 137
					chars = false;                                                                                               // 138
				}                                                                                                             // 139
			}                                                                                                              // 140
                                                                                                                  // 141
			if ( chars ) {                                                                                                 // 142
				index = html.indexOf("<");                                                                                    // 143
                                                                                                                  // 144
				var text = index < 0 ? html : html.substring( 0, index );                                                     // 145
				html = index < 0 ? "" : html.substring( index );                                                              // 146
                                                                                                                  // 147
				if ( handler.chars )                                                                                          // 148
					handler.chars( text );                                                                                       // 149
			}                                                                                                              // 150
                                                                                                                  // 151
		} else {                                                                                                        // 152
			html = html.replace(new RegExp("(.*)<\/" + stack.last() + "[^>]*>"), function(all, text){                      // 153
				text = text.replace(/<!--(.*?)-->/g, "$1")                                                                    // 154
					.replace(/<!\[CDATA\[(.*?)]]>/g, "$1");                                                                      // 155
                                                                                                                  // 156
				if ( handler.chars )                                                                                          // 157
					handler.chars( text );                                                                                       // 158
                                                                                                                  // 159
				return "";                                                                                                    // 160
			});                                                                                                            // 161
                                                                                                                  // 162
			parseEndTag( "", stack.last() );                                                                               // 163
		}                                                                                                               // 164
                                                                                                                  // 165
		if ( html === last )                                                                                            // 166
			throw "Parse Error: " + html;                                                                                  // 167
		last = html;                                                                                                    // 168
	}                                                                                                                // 169
                                                                                                                  // 170
	// Clean up any remaining tags                                                                                   // 171
	parseEndTag();                                                                                                   // 172
};                                                                                                                // 173
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/vazco:universe-html-purifier/HTMLPurifier.js                                                          //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
var allowHeaders = true;                                                                                          // 1
var stack = [];                                                                                                   // 2
var active_elements = [];                                                                                         // 3
var customTags = {};                                                                                              // 4
var root;                                                                                                         // 5
var insertion_mode;                                                                                               // 6
var noFormatting;                                                                                                 // 7
var preferB_I = false;                                                                                            // 8
var preferStrong_Em = false;                                                                                      // 9
var withoutTags;                                                                                                  // 10
                                                                                                                  // 11
                                                                                                                  // 12
var scope_markers = {'td': true, 'th': true, 'caption': true};                                                    // 13
var tags_with_implied_end = {'li': true, 'p': true};                                                              // 14
var allowed_attributes = {                                                                                        // 15
    all_elements: ['class', 'style', 'id'],                                                                       // 16
    a: ['href', 'target', 'title', 'name', 'rel', 'rev', 'type'],                                                 // 17
    blockquote: ['cite'],                                                                                         // 18
    img: ['src', 'alt', 'title', 'longdesc'],                                                                     // 19
    td: ['colspan'],                                                                                              // 20
    th: ['colspan'],                                                                                              // 21
    tr: ['rowspan'],                                                                                              // 22
    table: ['border']                                                                                             // 23
};                                                                                                                // 24
var allowed_attributes_as_hash;                                                                                   // 25
var selfClosing = {                                                                                               // 26
    br: true,                                                                                                     // 27
    hr: true,                                                                                                     // 28
    img: true                                                                                                     // 29
};                                                                                                                // 30
var dontIndent = {                                                                                                // 31
    strong: true,                                                                                                 // 32
    b: true,                                                                                                      // 33
    i: true,                                                                                                      // 34
    em: true,                                                                                                     // 35
    pre: true                                                                                                     // 36
};                                                                                                                // 37
var indent = false;                                                                                               // 38
var indent_string = "    ";                                                                                       // 39
var indentation = function (depth, switchOff) {                                                                   // 40
    if (noFormatting) return "";                                                                                  // 41
    if (!indent) return "";                                                                                       // 42
    if (switchOff) indent = false;                                                                                // 43
    var result = "\n";                                                                                            // 44
    for (var i = 0; i < depth; i++) {                                                                             // 45
        result += indent_string;                                                                                  // 46
    }                                                                                                             // 47
    return result;                                                                                                // 48
};                                                                                                                // 49
                                                                                                                  // 50
var TextNode = function (text) {                                                                                  // 51
    this.text = text.replace(/\s+/g, ' ');                                                                        // 52
};                                                                                                                // 53
                                                                                                                  // 54
TextNode.prototype = {                                                                                            // 55
    isEmpty: function () {                                                                                        // 56
        return !this.text;                                                                                        // 57
    },                                                                                                            // 58
    textContent: function () {                                                                                    // 59
        return this.text;                                                                                         // 60
    },                                                                                                            // 61
    toString: function () {                                                                                       // 62
        return this.isEmpty() ? '' : indentation(this.depth(), true) + this.text.replace(/(&nbsp;)+/, ' ');       // 63
    },                                                                                                            // 64
    depth: function () {                                                                                          // 65
        return this.parent.depth() + 1;                                                                           // 66
    }                                                                                                             // 67
};                                                                                                                // 68
                                                                                                                  // 69
var Node = function (name) {                                                                                      // 70
    this.name = name;                                                                                             // 71
    this.children = [];                                                                                           // 72
    this.attributes = {};                                                                                         // 73
};                                                                                                                // 74
                                                                                                                  // 75
Node.prototype = {                                                                                                // 76
    appendChild: function (child) {                                                                               // 77
        this.children.push(child);                                                                                // 78
        child.parent = this;                                                                                      // 79
        return child;                                                                                             // 80
    },                                                                                                            // 81
    removeChild: function (child) {                                                                               // 82
        for (var i = 0, len = this.children.length; i < len; i++) {                                               // 83
            if (this.children[i] === child) {                                                                     // 84
                return this.children.splice(i, i);                                                                // 85
            }                                                                                                     // 86
        }                                                                                                         // 87
        return null;                                                                                              // 88
    },                                                                                                            // 89
    lastChild: function () {                                                                                      // 90
        return this.children[this.children.length - 1];                                                           // 91
    },                                                                                                            // 92
    clone: function () {                                                                                          // 93
        var clone = new Node(this.name);                                                                          // 94
        for (var i in this.attributes) {                                                                          // 95
            clone.attributes[i] = this.attributes[i];                                                             // 96
        }                                                                                                         // 97
        return clone;                                                                                             // 98
    },                                                                                                            // 99
    startTag: function () {                                                                                       // 100
        return "<" + this.name + this.attributeString() + ">";                                                    // 101
    },                                                                                                            // 102
    endTag: function () {                                                                                         // 103
        return "</" + this.name + ">";                                                                            // 104
    },                                                                                                            // 105
    selfClosingTag: function () {                                                                                 // 106
        return "<" + this.name + this.attributeString() + "/>";                                                   // 107
    },                                                                                                            // 108
    attributeString: function () {                                                                                // 109
        var string = "";                                                                                          // 110
                                                                                                                  // 111
        var allowed_for_tag = allowed_attributes_as_hash[this.name] || {};                                        // 112
        var allowed_for_all = allowed_attributes_as_hash['all_elements'] || {};                                   // 113
                                                                                                                  // 114
        for (var i = 0, len = (this.attributes || []).length; i < len; i++) {                                     // 115
            var name = this.attributes[i].name;                                                                   // 116
            var value = this.attributes[i].value;                                                                 // 117
            if ((allowed_for_tag[name] || allowed_for_all[name]) && value) {                                      // 118
                if (name === 'href') {                                                                            // 119
                    // don't allow links to anywhere other than http(s)                                           // 120
                    // because they could contain JavaScript (javascript:) or other bad things!                   // 121
                    var permittedRegex = /^https?:\/\//i;                                                         // 122
                    if (!permittedRegex.test(value)) {                                                            // 123
                        // if not allowed, set the attribute to be empty                                          // 124
                        value = '';                                                                               // 125
                    }                                                                                             // 126
                }                                                                                                 // 127
                                                                                                                  // 128
                string += " " + name + "=\"" + value + "\"";                                                      // 129
            }                                                                                                     // 130
        }                                                                                                         // 131
        return string;                                                                                            // 132
    },                                                                                                            // 133
    innerHTML: function () {                                                                                      // 134
        var string = "";                                                                                          // 135
        for (var i = 0, len = this.children.length; i < len; i++) {                                               // 136
            string += this.children[i];                                                                           // 137
        }                                                                                                         // 138
        return string;                                                                                            // 139
    },                                                                                                            // 140
    textContent: function () {                                                                                    // 141
        var text = "";                                                                                            // 142
        for (var i = 0, len = this.children.length; i < len; i++) {                                               // 143
            if (this.children[i] instanceof TextNode) {                                                           // 144
                text += this.children[i].text;                                                                    // 145
            }                                                                                                     // 146
        }                                                                                                         // 147
        return text;                                                                                              // 148
    },                                                                                                            // 149
    toString: function () {                                                                                       // 150
        if (this.isEmpty()) return '';                                                                            // 151
                                                                                                                  // 152
        var string = "";                                                                                          // 153
        if (selfClosing[this.name]) {                                                                             // 154
            string = indentation(this.depth(), true) + this.selfClosingTag();                                     // 155
        } else {                                                                                                  // 156
            indent = dontIndent[this.name] ? indent : true;                                                       // 157
            string = indentation(this.depth(), dontIndent[this.name]) + this.startTag() + this.innerHTML();       // 158
            indent = dontIndent[this.name] ? indent : true;                                                       // 159
            string += indentation(this.depth()) + this.endTag();                                                  // 160
        }                                                                                                         // 161
        return string;                                                                                            // 162
    },                                                                                                            // 163
    depth: function () {                                                                                          // 164
        return this.parent ? this.parent.depth() + 1 : -1;                                                        // 165
    },                                                                                                            // 166
    isEmpty: function () {                                                                                        // 167
        // Zaption mod: self-closing elements never count as empty                                                // 168
        // otherwise <p><br/></p> gets removed entirely                                                           // 169
        if (selfClosing[this.name]) {                                                                             // 170
            return false;                                                                                         // 171
        }                                                                                                         // 172
                                                                                                                  // 173
        if (typeof(this._isEmpty) === "undefined") {                                                              // 174
            this._isEmpty = true;                                                                                 // 175
            for (var i = 0, len = this.children.length; i < len; i++) {                                           // 176
                if (!this.children[i].isEmpty()) {                                                                // 177
                    this._isEmpty = false;                                                                        // 178
                    break;                                                                                        // 179
                }                                                                                                 // 180
            }                                                                                                     // 181
        }                                                                                                         // 182
        return this._isEmpty;                                                                                     // 183
    }                                                                                                             // 184
};                                                                                                                // 185
                                                                                                                  // 186
function init(settings) {                                                                                         // 187
    root = new Node('html');                                                                                      // 188
    stack = [root];                                                                                               // 189
    active_elements = [];                                                                                         // 190
    allowed_attributes_as_hash = {};                                                                              // 191
    var attr, i;                                                                                                  // 192
    for (var key in allowed_attributes) {                                                                         // 193
        allowed_attributes_as_hash[key] = {};                                                                     // 194
        for (i in allowed_attributes['all_elements']) {                                                           // 195
            attr = allowed_attributes['all_elements'][i];                                                         // 196
            allowed_attributes_as_hash[key][attr] = true;                                                         // 197
        }                                                                                                         // 198
        if (key === 'all_elements') {                                                                             // 199
            continue;                                                                                             // 200
        }                                                                                                         // 201
        for (i in allowed_attributes[key]) {                                                                      // 202
            attr = allowed_attributes[key][i];                                                                    // 203
            allowed_attributes_as_hash[key][attr] = true;                                                         // 204
        }                                                                                                         // 205
    }                                                                                                             // 206
                                                                                                                  // 207
    noFormatting = !!settings.noFormatting;                                                                       // 208
    preferStrong_Em = !!settings.preferStrong_Em;                                                                 // 209
    preferB_I = !preferStrong_Em && !!settings.preferB_I;                                                         // 210
    allowHeaders = !settings.noHeaders;                                                                           // 211
    withoutTags = {};                                                                                             // 212
                                                                                                                  // 213
    if(typeof settings.withoutTags === 'string' && settings.withoutTags){                                         // 214
        settings.withoutTags = [settings.withoutTags];                                                            // 215
    }                                                                                                             // 216
                                                                                                                  // 217
    if(settings.withoutTags && settings.withoutTags.length){                                                      // 218
        for (var i = settings.withoutTags.length -1 ; i >= 0; i--) {                                              // 219
            withoutTags[settings.withoutTags[i]] = true;                                                          // 220
        }                                                                                                         // 221
    }                                                                                                             // 222
}                                                                                                                 // 223
                                                                                                                  // 224
function last_el(list) {                                                                                          // 225
    var len = list.length;                                                                                        // 226
    if (len === 0) {                                                                                              // 227
        return null;                                                                                              // 228
    }                                                                                                             // 229
    return list[len - 1];                                                                                         // 230
}                                                                                                                 // 231
                                                                                                                  // 232
function in_array(arr, elem) {                                                                                    // 233
    for (var i = 0; i < arr.length; i++) {                                                                        // 234
        if (arr[i] === elem) return true;                                                                         // 235
    }                                                                                                             // 236
    return false;                                                                                                 // 237
}                                                                                                                 // 238
                                                                                                                  // 239
function current_node() {                                                                                         // 240
    return last_el(stack);                                                                                        // 241
}                                                                                                                 // 242
                                                                                                                  // 243
function reconstruct_the_active_formatting_elements() {                                                           // 244
    if (active_elements.length === 0 || in_array(stack, last_el(active_elements))) {                              // 245
        return;                                                                                                   // 246
    }                                                                                                             // 247
    var entry;                                                                                                    // 248
    for (var i = active_elements.length; i > 0; i--) {                                                            // 249
        entry = active_elements[i - 1];                                                                           // 250
        if (in_array(stack, entry)) {                                                                             // 251
            break;                                                                                                // 252
        }                                                                                                         // 253
    }                                                                                                             // 254
    do {                                                                                                          // 255
        var clone = entry.clone();                                                                                // 256
        current_node().appendChild(clone);                                                                        // 257
        stack.push(clone);                                                                                        // 258
        active_elements[i] = clone;                                                                               // 259
        i += 1;                                                                                                   // 260
    } while (i !== active_elements.length);                                                                       // 261
}                                                                                                                 // 262
                                                                                                                  // 263
function has_element_with(arr_of_elements, tagName) {                                                             // 264
    for (var i = arr_of_elements.length; i > 0; i--) {                                                            // 265
        if (arr_of_elements[i - 1].name === tagName) {                                                            // 266
            return true;                                                                                          // 267
        }                                                                                                         // 268
    }                                                                                                             // 269
    return false;                                                                                                 // 270
}                                                                                                                 // 271
                                                                                                                  // 272
function in_scope(tagName) {                                                                                      // 273
    return has_element_with(stack, tagName);                                                                      // 274
}                                                                                                                 // 275
                                                                                                                  // 276
function in_table_scope(tagName) {                                                                                // 277
    for (var i = stack.length; i > 0; i--) {                                                                      // 278
        var nodeTag = stack[i - 1].name;                                                                          // 279
        if (nodeTag === tagName) {                                                                                // 280
            return true;                                                                                          // 281
        } else if (nodeTag === 'table' || nodeTag === 'html') {                                                   // 282
            return false;                                                                                         // 283
        }                                                                                                         // 284
    }                                                                                                             // 285
    return false;                                                                                                 // 286
}                                                                                                                 // 287
                                                                                                                  // 288
function insert_html_element_for(tagName, attrs) {                                                                // 289
    var node = new Node(tagName);                                                                                 // 290
    node.attributes = attrs;                                                                                      // 291
    current_node().appendChild(node);                                                                             // 292
    stack.push(node);                                                                                             // 293
    return node;                                                                                                  // 294
}                                                                                                                 // 295
                                                                                                                  // 296
function generate_implied_end_tags(exception) {                                                                   // 297
    var tagName = current_node().name;                                                                            // 298
    while (tags_with_implied_end[tagName] && tagName !== exception) {                                             // 299
        end(tagName);                                                                                             // 300
        tagName = current_node().name;                                                                            // 301
    }                                                                                                             // 302
}                                                                                                                 // 303
                                                                                                                  // 304
function trim_to_1_space(str) {                                                                                   // 305
    return str.replace(/^\s+/, ' ').replace(/\s+$/, ' ');                                                         // 306
}                                                                                                                 // 307
                                                                                                                  // 308
function clear_stack_to_table_context() {                                                                         // 309
    clear_stack_to_context_by_tags(['table', 'html']);                                                            // 310
}                                                                                                                 // 311
                                                                                                                  // 312
function clear_stack_to_table_body_context() {                                                                    // 313
    clear_stack_to_context_by_tags(['tbody', 'tfoot', 'thead', 'html']);                                          // 314
}                                                                                                                 // 315
                                                                                                                  // 316
function clear_stack_to_table_row_context() {                                                                     // 317
    clear_stack_to_context_by_tags(['tr', 'html']);                                                               // 318
}                                                                                                                 // 319
                                                                                                                  // 320
function clear_stack_to_context_by_tags(tags) {                                                                   // 321
    while (!in_array(tags, current_node().name)) {                                                                // 322
        stack.pop();                                                                                              // 323
    }                                                                                                             // 324
}                                                                                                                 // 325
                                                                                                                  // 326
function clear_active_elements_to_last_marker() {                                                                 // 327
    var entry;                                                                                                    // 328
    do {                                                                                                          // 329
        entry = active_elements.pop();                                                                            // 330
    } while (!scope_markers[entry.name]);                                                                         // 331
}                                                                                                                 // 332
                                                                                                                  // 333
function reset_insertion_mode() {                                                                                 // 334
    var last = false;                                                                                             // 335
    var node;                                                                                                     // 336
    for (var i = stack.length - 1; i >= 0; i--) {                                                                 // 337
        node = stack[i];                                                                                          // 338
        if (node === stack[0]) {                                                                                  // 339
            last = true;                                                                                          // 340
        }                                                                                                         // 341
        switch (node.name) {                                                                                      // 342
            case 'th':                                                                                            // 343
            case 'td':                                                                                            // 344
                if (!last) {                                                                                      // 345
                    insertion_mode = InCell;                                                                      // 346
                    return;                                                                                       // 347
                }                                                                                                 // 348
            case 'tr':                                                                                            // 349
                insertion_mode = InRow;                                                                           // 350
                return;                                                                                           // 351
            case 'tbody':                                                                                         // 352
            case 'thead':                                                                                         // 353
            case 'tfoot':                                                                                         // 354
                insertion_mode = InTableBody;                                                                     // 355
                return;                                                                                           // 356
            case 'caption':                                                                                       // 357
                insertion_mode = InCaption;                                                                       // 358
                return;                                                                                           // 359
            case 'colgroup':                                                                                      // 360
                insertion_mode = InColumnGroup;                                                                   // 361
                return;                                                                                           // 362
            case 'table':                                                                                         // 363
                insertion_mode = InTable;                                                                         // 364
                return;                                                                                           // 365
            default:                                                                                              // 366
                if (last) {                                                                                       // 367
                    insertion_mode = InBody;                                                                      // 368
                    return;                                                                                       // 369
                }                                                                                                 // 370
        }                                                                                                         // 371
    }                                                                                                             // 372
}                                                                                                                 // 373
                                                                                                                  // 374
function close_the_cell() {                                                                                       // 375
    if (in_table_scope('td')) {                                                                                   // 376
        end('td');                                                                                                // 377
    } else {                                                                                                      // 378
        end('th');                                                                                                // 379
    }                                                                                                             // 380
}                                                                                                                 // 381
                                                                                                                  // 382
function start(tagName, attrs, unary) {                                                                           // 383
    insertion_mode.insertion_mode_start(tagName, attrs, unary);                                                   // 384
}                                                                                                                 // 385
                                                                                                                  // 386
function end(tagName) {                                                                                           // 387
    insertion_mode.insertion_mode_end(tagName);                                                                   // 388
}                                                                                                                 // 389
                                                                                                                  // 390
function chars(text) {                                                                                            // 391
    if (typeof(text) === 'undefined') {                                                                           // 392
        return;                                                                                                   // 393
    }                                                                                                             // 394
    text = text.replace(/\n\s*\n\s*\n*/g, '\n\n').replace(/(^\n\n|\n\n$)/g, '');                                  // 395
    var paragraphs = text.split('\n\n');                                                                          // 396
    var trimmedText;                                                                                              // 397
    if (paragraphs.length > 1) {                                                                                  // 398
        for (var i in paragraphs) {                                                                               // 399
            start('p');                                                                                           // 400
            reconstruct_the_active_formatting_elements();                                                         // 401
            trimmedText = trim_to_1_space(paragraphs[i]);                                                         // 402
            current_node().appendChild(new TextNode(trimmedText));                                                // 403
            end('p');                                                                                             // 404
        }                                                                                                         // 405
    } else {                                                                                                      // 406
        if (text.match(/^\s*$/g) && current_node().children.length && current_node().lastChild().name === 'br') { // 407
            return;                                                                                               // 408
        }                                                                                                         // 409
        reconstruct_the_active_formatting_elements();                                                             // 410
        trimmedText = trim_to_1_space(paragraphs[0]);                                                             // 411
        current_node().appendChild(new TextNode(trimmedText));                                                    // 412
    }                                                                                                             // 413
}                                                                                                                 // 414
                                                                                                                  // 415
var InBody = {                                                                                                    // 416
    insertion_mode_start: function (tagName, attrs) {                                                             // 417
        var node;                                                                                                 // 418
        tagName = tagName.toLowerCase();                                                                          // 419
        if (withoutTags[tagName]) {                                                                               // 420
            return;                                                                                               // 421
        }                                                                                                         // 422
        if (preferStrong_Em) {                                                                                    // 423
            switch (tagName) {                                                                                    // 424
                case 'b':                                                                                         // 425
                    start('strong');                                                                              // 426
                    return;                                                                                       // 427
                case 'i':                                                                                         // 428
                    start('em');                                                                                  // 429
                    return;                                                                                       // 430
            }                                                                                                     // 431
        } else if (preferB_I) {                                                                                   // 432
            switch (tagName) {                                                                                    // 433
                case 'strong':                                                                                    // 434
                    start('b');                                                                                   // 435
                    return;                                                                                       // 436
                case 'em':                                                                                        // 437
                    start('i');                                                                                   // 438
                    return;                                                                                       // 439
            }                                                                                                     // 440
        }                                                                                                         // 441
        switch (tagName) {                                                                                        // 442
            case 'h1':                                                                                            // 443
            case 'h2':                                                                                            // 444
            case 'h3':                                                                                            // 445
            case 'h4':                                                                                            // 446
            case 'h5':                                                                                            // 447
            case 'h6':                                                                                            // 448
            case 'h7':                                                                                            // 449
                if (!allowHeaders) {                                                                              // 450
                    start('p');                                                                                   // 451
                    if (preferB_I) {                                                                              // 452
                        start('b');                                                                               // 453
                    } else {                                                                                      // 454
                        start('strong');                                                                          // 455
                    }                                                                                             // 456
                    return;                                                                                       // 457
                }                                                                                                 // 458
            case 'blockquote':                                                                                    // 459
            case 'ol':                                                                                            // 460
            case 'p':                                                                                             // 461
            case 'ul':                                                                                            // 462
            case 'pre': // Techically PRE shouldn't be in this groups, since newlines should be ignored after a pre tag
                if (in_scope('p')) {                                                                              // 464
                    end('p');                                                                                     // 465
                }                                                                                                 // 466
                insert_html_element_for(tagName, attrs);                                                          // 467
                return;                                                                                           // 468
            case 'li':                                                                                            // 469
                if (in_scope('p')) {                                                                              // 470
                    end('p');                                                                                     // 471
                }                                                                                                 // 472
                node = current_node();                                                                            // 473
                while (node.name === 'li') {                                                                      // 474
                    stack.pop();                                                                                  // 475
                }                                                                                                 // 476
                insert_html_element_for(tagName, attrs);                                                          // 477
                return;                                                                                           // 478
            case 'a':                                                                                             // 479
                for (var i = active_elements.length; i > 0; i--) {                                                // 480
                    if (active_elements[i - 1].name === 'a') {                                                    // 481
                        end('a');                                                                                 // 482
                        active_elements.splice(i - 1, 1);                                                         // 483
                    }                                                                                             // 484
                }                                                                                                 // 485
                reconstruct_the_active_formatting_elements();                                                     // 486
                node = insert_html_element_for(tagName, attrs);                                                   // 487
                active_elements.push(node);                                                                       // 488
                return;                                                                                           // 489
            case 'strong':                                                                                        // 490
            case 'b':                                                                                             // 491
            case 'em':                                                                                            // 492
            case 'i':                                                                                             // 493
            case 'u':                                                                                             // 494
            case 'span':                                                                                          // 495
                reconstruct_the_active_formatting_elements();                                                     // 496
                node = insert_html_element_for(tagName, attrs);                                                   // 497
                active_elements.push(node);                                                                       // 498
                return;                                                                                           // 499
            case 'table':                                                                                         // 500
                if (in_scope('p')) {                                                                              // 501
                    end('p');                                                                                     // 502
                }                                                                                                 // 503
                insert_html_element_for(tagName, attrs);                                                          // 504
                insertion_mode = InTable;                                                                         // 505
                return;                                                                                           // 506
            case 'br':                                                                                            // 507
            case 'img':                                                                                           // 508
                reconstruct_the_active_formatting_elements();                                                     // 509
                insert_html_element_for(tagName, attrs);                                                          // 510
                stack.pop();                                                                                      // 511
                return;                                                                                           // 512
        }                                                                                                         // 513
        if (customTags[tagName]) {                                                                                // 514
            if (selfClosing[tagName]) {                                                                           // 515
                reconstruct_the_active_formatting_elements();                                                     // 516
                insert_html_element_for(tagName, attrs);                                                          // 517
                stack.pop();                                                                                      // 518
                return;                                                                                           // 519
            } else {                                                                                              // 520
                reconstruct_the_active_formatting_elements();                                                     // 521
                node = insert_html_element_for(tagName, attrs);                                                   // 522
                active_elements.push(node);                                                                       // 523
                return;                                                                                           // 524
            }                                                                                                     // 525
        }                                                                                                         // 526
    },                                                                                                            // 527
                                                                                                                  // 528
    insertion_mode_end: function (tagName) {                                                                      // 529
        if (typeof tagName === 'undefined') {                                                                     // 530
            return;                                                                                               // 531
        }                                                                                                         // 532
        var node;                                                                                                 // 533
        tagName = tagName.toLowerCase();                                                                          // 534
        if (!withoutTags[tagName]) {                                                                              // 535
            if (preferStrong_Em) {                                                                                // 536
                switch (tagName) {                                                                                // 537
                    case 'b':                                                                                     // 538
                        end('strong');                                                                            // 539
                        return;                                                                                   // 540
                    case 'i':                                                                                     // 541
                        end('em');                                                                                // 542
                        return;                                                                                   // 543
                }                                                                                                 // 544
            } else if (preferB_I) {                                                                               // 545
                switch (tagName) {                                                                                // 546
                    case 'strong':                                                                                // 547
                        end('b');                                                                                 // 548
                        return;                                                                                   // 549
                    case 'em':                                                                                    // 550
                        end('i');                                                                                 // 551
                        return;                                                                                   // 552
                }                                                                                                 // 553
            }                                                                                                     // 554
            switch (tagName) {                                                                                    // 555
                case 'h1':                                                                                        // 556
                case 'h2':                                                                                        // 557
                case 'h3':                                                                                        // 558
                case 'h4':                                                                                        // 559
                case 'h5':                                                                                        // 560
                case 'h6':                                                                                        // 561
                case 'h7':                                                                                        // 562
                    if (!allowHeaders) {                                                                          // 563
                        if (preferB_I) {                                                                          // 564
                            end('b');                                                                             // 565
                        } else {                                                                                  // 566
                            end('strong');                                                                        // 567
                        }                                                                                         // 568
                        end('p');                                                                                 // 569
                        return;                                                                                   // 570
                    }                                                                                             // 571
                    if (in_scope(tagName)) {                                                                      // 572
                        generate_implied_end_tags();                                                              // 573
                        do {                                                                                      // 574
                            node = stack.pop();                                                                   // 575
                        } while (node.name !== tagName);                                                          // 576
                    }                                                                                             // 577
                    return;                                                                                       // 578
                case 'blockquote':                                                                                // 579
                case 'ol':                                                                                        // 580
                case 'ul':                                                                                        // 581
                case 'pre': // Techically PRE shouldn't be in this groups, since newlines should be ignored after a pre tag
                    if (in_scope(tagName)) {                                                                      // 583
                        generate_implied_end_tags();                                                              // 584
                    }                                                                                             // 585
                    if (in_scope(tagName)) {                                                                      // 586
                        do {                                                                                      // 587
                            node = stack.pop();                                                                   // 588
                        } while (node.name !== tagName);                                                          // 589
                    }                                                                                             // 590
                    return;                                                                                       // 591
                case 'p':                                                                                         // 592
                    if (in_scope(tagName)) {                                                                      // 593
                        generate_implied_end_tags(tagName);                                                       // 594
                    }                                                                                             // 595
                    var no_p_in_scope = true;                                                                     // 596
                    while (in_scope(tagName)) {                                                                   // 597
                        no_p_in_scope = false;                                                                    // 598
                        node = stack.pop();                                                                       // 599
                    }                                                                                             // 600
                    if (no_p_in_scope) {                                                                          // 601
                        start('p', [], false);                                                                    // 602
                        end('p');                                                                                 // 603
                    }                                                                                             // 604
                    return;                                                                                       // 605
                case 'li':                                                                                        // 606
                    if (in_scope(tagName)) {                                                                      // 607
                        generate_implied_end_tags(tagName);                                                       // 608
                    }                                                                                             // 609
                    if (in_scope(tagName)) {                                                                      // 610
                        do {                                                                                      // 611
                            node = stack.pop();                                                                   // 612
                        } while (node.name !== tagName);                                                          // 613
                    }                                                                                             // 614
                    return;                                                                                       // 615
                case 'a':                                                                                         // 616
                case 'i':                                                                                         // 617
                case 'em':                                                                                        // 618
                case 'strong':                                                                                    // 619
                case 'b':                                                                                         // 620
                case 'u':                                                                                         // 621
                case 'span':                                                                                      // 622
                    for (var i = active_elements.length; i > 0; i--) {                                            // 623
                        if (active_elements[i - 1].name === tagName) {                                            // 624
                            node = active_elements[i - 1];                                                        // 625
                            break;                                                                                // 626
                        }                                                                                         // 627
                    }                                                                                             // 628
                    if (typeof(node) === 'undefined' || !in_array(stack, node)) {                                 // 629
                        return;                                                                                   // 630
                    }                                                                                             // 631
                    // Step 2 from the algorithm in the HTML5 spec will never be necessary with the tags we allow // 632
                    var popped_node;                                                                              // 633
                    do {                                                                                          // 634
                        popped_node = stack.pop();                                                                // 635
                    } while (popped_node !== node);                                                               // 636
                    active_elements.splice(i - 1, 1);                                                             // 637
                    return;                                                                                       // 638
                                                                                                                  // 639
            }                                                                                                     // 640
            if (customTags[tagName] && !selfClosing[tagName]) {                                                   // 641
                for (var i = active_elements.length; i > 0; i--) {                                                // 642
                    if (active_elements[i - 1].name === tagName) {                                                // 643
                        node = active_elements[i - 1];                                                            // 644
                        break;                                                                                    // 645
                    }                                                                                             // 646
                }                                                                                                 // 647
                if (typeof(node) === 'undefined' || !in_array(stack, node)) {                                     // 648
                    return;                                                                                       // 649
                }                                                                                                 // 650
                // Step 2 from the algorithm in the HTML5 spec will never be necessary with the tags we allow     // 651
                var popped_node;                                                                                  // 652
                do {                                                                                              // 653
                    popped_node = stack.pop();                                                                    // 654
                } while (popped_node !== node);                                                                   // 655
                active_elements.splice(i - 1, 1);                                                                 // 656
                return;                                                                                           // 657
            }                                                                                                     // 658
        }                                                                                                         // 659
        node = current_node();                                                                                    // 660
        if (node.name === tagName) {                                                                              // 661
            generate_implied_end_tags();                                                                          // 662
            while (stack.length > 0 && node !== current_node()) {                                                 // 663
                stack.pop();                                                                                      // 664
            }                                                                                                     // 665
        }                                                                                                         // 666
    }                                                                                                             // 667
};                                                                                                                // 668
                                                                                                                  // 669
var InTable = {                                                                                                   // 670
    insertion_mode_start: function (tagName, attrs, unary) {                                                      // 671
        tagName = tagName.toLowerCase();                                                                          // 672
        switch (tagName) {                                                                                        // 673
            case 'caption':                                                                                       // 674
                clear_stack_to_table_context();                                                                   // 675
                active_elements.push(insert_html_element_for(tagName, attrs));                                    // 676
                insertion_mode = InCaption;                                                                       // 677
                return;                                                                                           // 678
            case 'colgroup':                                                                                      // 679
                clear_stack_to_table_context();                                                                   // 680
                insert_html_element_for(tagName, attrs);                                                          // 681
                insertion_mode = InColumnGroup;                                                                   // 682
                return;                                                                                           // 683
            case 'col':                                                                                           // 684
                start('colgroup');                                                                                // 685
                start(tagName, attrs, unary);                                                                     // 686
                return;                                                                                           // 687
            case 'tbody':                                                                                         // 688
            case 'tfoot':                                                                                         // 689
            case 'thead':                                                                                         // 690
                clear_stack_to_table_context();                                                                   // 691
                insert_html_element_for(tagName, attrs);                                                          // 692
                insertion_mode = InTableBody;                                                                     // 693
                return;                                                                                           // 694
            case 'td':                                                                                            // 695
            case 'th':                                                                                            // 696
            case 'tr':                                                                                            // 697
                start('tbody');                                                                                   // 698
                start(tagName, attrs, unary);                                                                     // 699
                return;                                                                                           // 700
        }                                                                                                         // 701
    },                                                                                                            // 702
                                                                                                                  // 703
    insertion_mode_end: function (tagName) {                                                                      // 704
        if (typeof(tagName) === undefined) {                                                                      // 705
            return;                                                                                               // 706
        }                                                                                                         // 707
        tagName = tagName.toLowerCase();                                                                          // 708
        switch (tagName) {                                                                                        // 709
            case 'table':                                                                                         // 710
                if (in_table_scope('table')) {                                                                    // 711
                    var node;                                                                                     // 712
                    do {                                                                                          // 713
                        node = stack.pop();                                                                       // 714
                    } while (node.name !== 'table');                                                              // 715
                }                                                                                                 // 716
                reset_insertion_mode();                                                                           // 717
                return;                                                                                           // 718
        }                                                                                                         // 719
    }                                                                                                             // 720
};                                                                                                                // 721
                                                                                                                  // 722
var InCaption = {                                                                                                 // 723
    insertion_mode_start: function (tagName, attrs, unary) {                                                      // 724
        tagName = tagName.toLowerCase();                                                                          // 725
        switch (tagName) {                                                                                        // 726
            case 'caption':                                                                                       // 727
            case 'col':                                                                                           // 728
            case 'colgroup':                                                                                      // 729
            case 'tbody':                                                                                         // 730
            case 'td':                                                                                            // 731
            case 'tfoot':                                                                                         // 732
            case 'th':                                                                                            // 733
            case 'thead':                                                                                         // 734
            case 'tr':                                                                                            // 735
                end('caption');                                                                                   // 736
                start(tagName);                                                                                   // 737
                return;                                                                                           // 738
            default:                                                                                              // 739
                InBody.insertion_mode_start(tagName, attrs, unary);                                               // 740
                return;                                                                                           // 741
        }                                                                                                         // 742
    },                                                                                                            // 743
                                                                                                                  // 744
    insertion_mode_end: function (tagName) {                                                                      // 745
        if (typeof(tagName) === undefined) {                                                                      // 746
            return;                                                                                               // 747
        }                                                                                                         // 748
        tagName = tagName.toLowerCase();                                                                          // 749
        switch (tagName) {                                                                                        // 750
            case 'caption':                                                                                       // 751
                if (in_table_scope('caption')) {                                                                  // 752
                    generate_implied_end_tags();                                                                  // 753
                    if (current_node().name === 'caption') {                                                      // 754
                        var node;                                                                                 // 755
                        do {                                                                                      // 756
                            node = stack.pop();                                                                   // 757
                        } while (node.name !== 'caption');                                                        // 758
                        clear_active_elements_to_last_marker();                                                   // 759
                        insertion_mode = InTable;                                                                 // 760
                    }                                                                                             // 761
                }                                                                                                 // 762
                return;                                                                                           // 763
            case "body":                                                                                          // 764
            case "col":                                                                                           // 765
            case "colgroup":                                                                                      // 766
            case "html":                                                                                          // 767
            case "tbody":                                                                                         // 768
            case "td":                                                                                            // 769
            case "tfoot":                                                                                         // 770
            case "th":                                                                                            // 771
            case "thead":                                                                                         // 772
            case "tr":                                                                                            // 773
                return;                                                                                           // 774
            case 'table':                                                                                         // 775
                end('caption');                                                                                   // 776
                end('table');                                                                                     // 777
                return;                                                                                           // 778
            default:                                                                                              // 779
                InBody.insertion_mode_end(tagName);                                                               // 780
                return;                                                                                           // 781
        }                                                                                                         // 782
    }                                                                                                             // 783
};                                                                                                                // 784
                                                                                                                  // 785
var InColumnGroup = {                                                                                             // 786
    insertion_mode_start: function (tagName, attrs, unary) {                                                      // 787
        tagName = tagName.toLowerCase();                                                                          // 788
        switch (tagName) {                                                                                        // 789
            case 'html':                                                                                          // 790
                InBody.insertion_mode_start(tagName, attrs, unary);                                               // 791
                return;                                                                                           // 792
            case 'col':                                                                                           // 793
                insert_html_element_for(tagName, attrs);                                                          // 794
                stack.pop();                                                                                      // 795
                return;                                                                                           // 796
            default:                                                                                              // 797
                end('colgroup');                                                                                  // 798
                start(tagName);                                                                                   // 799
                return;                                                                                           // 800
        }                                                                                                         // 801
    },                                                                                                            // 802
                                                                                                                  // 803
    insertion_mode_end: function (tagName) {                                                                      // 804
        if (typeof(tagName) === undefined) {                                                                      // 805
            return;                                                                                               // 806
        }                                                                                                         // 807
        tagName = tagName.toLowerCase();                                                                          // 808
        switch (tagName) {                                                                                        // 809
            case 'colgroup':                                                                                      // 810
                if (current_node().name !== 'html') {                                                             // 811
                    stack.pop();                                                                                  // 812
                    insertion_mode = InTable;                                                                     // 813
                }                                                                                                 // 814
                return;                                                                                           // 815
            case 'col':                                                                                           // 816
                return;                                                                                           // 817
            default:                                                                                              // 818
                end('colgroup');                                                                                  // 819
                end(tagName);                                                                                     // 820
                return;                                                                                           // 821
        }                                                                                                         // 822
    }                                                                                                             // 823
};                                                                                                                // 824
                                                                                                                  // 825
var InTableBody = {                                                                                               // 826
    insertion_mode_start: function (tagName, attrs, unary) {                                                      // 827
        tagName = tagName.toLowerCase();                                                                          // 828
        switch (tagName) {                                                                                        // 829
            case 'tr':                                                                                            // 830
                clear_stack_to_table_body_context();                                                              // 831
                insert_html_element_for(tagName, attrs);                                                          // 832
                insertion_mode = InRow;                                                                           // 833
                return;                                                                                           // 834
            case 'th':                                                                                            // 835
            case 'td':                                                                                            // 836
                start('tr');                                                                                      // 837
                start(tagName, attrs, unary);                                                                     // 838
                return;                                                                                           // 839
            case "caption":                                                                                       // 840
            case "col":                                                                                           // 841
            case "colgroup":                                                                                      // 842
            case "tbody":                                                                                         // 843
            case "tfoot":                                                                                         // 844
            case "thead":                                                                                         // 845
                if (in_table_scope('tbody') || in_table_scope('thead') || in_table_scope('tfoot')) {              // 846
                    clear_stack_to_table_body_context();                                                          // 847
                    end(current_node().name);                                                                     // 848
                    start(tagName, attrs, unary);                                                                 // 849
                }                                                                                                 // 850
                return;                                                                                           // 851
        }                                                                                                         // 852
    },                                                                                                            // 853
                                                                                                                  // 854
    insertion_mode_end: function (tagName) {                                                                      // 855
        if (typeof(tagName) === undefined) {                                                                      // 856
            return;                                                                                               // 857
        }                                                                                                         // 858
        tagName = tagName.toLowerCase();                                                                          // 859
        switch (tagName) {                                                                                        // 860
            case 'tbody':                                                                                         // 861
            case 'tfoot':                                                                                         // 862
            case 'thead':                                                                                         // 863
                if (in_table_scope(tagName)) {                                                                    // 864
                    clear_stack_to_table_body_context();                                                          // 865
                    stack.pop();                                                                                  // 866
                    insertion_mode = InTable;                                                                     // 867
                }                                                                                                 // 868
                return;                                                                                           // 869
            case 'table':                                                                                         // 870
                if (in_table_scope('tbody') || in_table_scope('thead') || in_table_scope('tfoot')) {              // 871
                    clear_stack_to_table_body_context();                                                          // 872
                    end(current_node().name);                                                                     // 873
                    end(tagName);                                                                                 // 874
                }                                                                                                 // 875
                return;                                                                                           // 876
            case "body":                                                                                          // 877
            case "caption":                                                                                       // 878
            case "col":                                                                                           // 879
            case "colgroup":                                                                                      // 880
            case "html":                                                                                          // 881
            case "td":                                                                                            // 882
            case "th":                                                                                            // 883
            case "tr":                                                                                            // 884
                return;                                                                                           // 885
            default:                                                                                              // 886
                InTable.insertion_mode_end(tagName);                                                              // 887
                return;                                                                                           // 888
        }                                                                                                         // 889
    }                                                                                                             // 890
};                                                                                                                // 891
                                                                                                                  // 892
var InRow = {                                                                                                     // 893
    insertion_mode_start: function (tagName, attrs, unary) {                                                      // 894
        tagName = tagName.toLowerCase();                                                                          // 895
        switch (tagName) {                                                                                        // 896
            case 'th':                                                                                            // 897
            case 'td':                                                                                            // 898
                clear_stack_to_table_row_context();                                                               // 899
                var node = insert_html_element_for(tagName, attrs);                                               // 900
                insertion_mode = InCell;                                                                          // 901
                active_elements.push(node);                                                                       // 902
                return;                                                                                           // 903
            case "caption":                                                                                       // 904
            case "col":                                                                                           // 905
            case "colgroup":                                                                                      // 906
            case "tbody":                                                                                         // 907
            case "tfoot":                                                                                         // 908
            case "thead":                                                                                         // 909
            case "tr":                                                                                            // 910
                end('tr');                                                                                        // 911
                start(tagName, attrs, unary);                                                                     // 912
                return;                                                                                           // 913
            default:                                                                                              // 914
                InTable.insertion_mode_start(tagName, attrs, unary);                                              // 915
                return;                                                                                           // 916
        }                                                                                                         // 917
    },                                                                                                            // 918
                                                                                                                  // 919
    insertion_mode_end: function (tagName) {                                                                      // 920
        if (typeof(tagName) === undefined) {                                                                      // 921
            return;                                                                                               // 922
        }                                                                                                         // 923
        tagName = tagName.toLowerCase();                                                                          // 924
        switch (tagName) {                                                                                        // 925
            case 'tr':                                                                                            // 926
                if (in_table_scope(tagName)) {                                                                    // 927
                    clear_stack_to_table_row_context();                                                           // 928
                    stack.pop();                                                                                  // 929
                    insertion_mode = InTableBody;                                                                 // 930
                }                                                                                                 // 931
                return;                                                                                           // 932
            case 'table':                                                                                         // 933
                end('tr');                                                                                        // 934
                                                                                                                  // 935
                // this line was in the original source but attrs/unary are not defined                           // 936
                // so not sure what to do with it. how was this working?                                          // 937
                // start(tagName, attrs, unary);                                                                  // 938
                return;                                                                                           // 939
            case "tbody":                                                                                         // 940
            case "tfoot":                                                                                         // 941
            case "thead":                                                                                         // 942
                if (in_table_scope(tagName)) {                                                                    // 943
                    end('tr');                                                                                    // 944
                    end(tagName);                                                                                 // 945
                }                                                                                                 // 946
                return;                                                                                           // 947
            case "body":                                                                                          // 948
            case "caption":                                                                                       // 949
            case "col":                                                                                           // 950
            case "colgroup":                                                                                      // 951
            case "html":                                                                                          // 952
            case "td":                                                                                            // 953
            case "th":                                                                                            // 954
                return;                                                                                           // 955
            default:                                                                                              // 956
                InTable.insertion_mode_end(tagName);                                                              // 957
                return;                                                                                           // 958
        }                                                                                                         // 959
    }                                                                                                             // 960
};                                                                                                                // 961
                                                                                                                  // 962
var InCell = {                                                                                                    // 963
    insertion_mode_start: function (tagName, attrs, unary) {                                                      // 964
        tagName = tagName.toLowerCase();                                                                          // 965
        switch (tagName) {                                                                                        // 966
            case "caption":                                                                                       // 967
            case "col":                                                                                           // 968
            case "colgroup":                                                                                      // 969
            case "tbody":                                                                                         // 970
            case "td":                                                                                            // 971
            case "tfoot":                                                                                         // 972
            case "th":                                                                                            // 973
            case "thead":                                                                                         // 974
            case "tr":                                                                                            // 975
                if (in_table_scope('td') || in_table_scope('th')) {                                               // 976
                    close_the_cell();                                                                             // 977
                    start(tagName, attrs, unary);                                                                 // 978
                }                                                                                                 // 979
                return;                                                                                           // 980
            default:                                                                                              // 981
                InBody.insertion_mode_start(tagName, attrs, unary);                                               // 982
                return;                                                                                           // 983
        }                                                                                                         // 984
    },                                                                                                            // 985
                                                                                                                  // 986
    insertion_mode_end: function (tagName) {                                                                      // 987
        if (typeof(tagName) === undefined) {                                                                      // 988
            return;                                                                                               // 989
        }                                                                                                         // 990
        tagName = tagName.toLowerCase();                                                                          // 991
        switch (tagName) {                                                                                        // 992
            case "td":                                                                                            // 993
            case "th":                                                                                            // 994
                if (in_table_scope(tagName)) {                                                                    // 995
                    generate_implied_end_tags();                                                                  // 996
                    if (current_node().name !== tagName) {                                                        // 997
                        return;                                                                                   // 998
                    }                                                                                             // 999
                    var node;                                                                                     // 1000
                    do {                                                                                          // 1001
                        node = stack.pop();                                                                       // 1002
                    } while (node.name !== tagName);                                                              // 1003
                                                                                                                  // 1004
                    clear_active_elements_to_last_marker();                                                       // 1005
                    insertion_mode = InRow;                                                                       // 1006
                }                                                                                                 // 1007
                return;                                                                                           // 1008
            case "body":                                                                                          // 1009
            case "caption":                                                                                       // 1010
            case "col":                                                                                           // 1011
            case "colgroup":                                                                                      // 1012
            case "html":                                                                                          // 1013
                return;                                                                                           // 1014
            case "table":                                                                                         // 1015
            case "tbody":                                                                                         // 1016
            case "tfoot":                                                                                         // 1017
            case "thead":                                                                                         // 1018
            case "tr":                                                                                            // 1019
                if (in_table_scope(tagName)) {                                                                    // 1020
                    close_the_cell();                                                                             // 1021
                    end(tagName);                                                                                 // 1022
                }                                                                                                 // 1023
                return;                                                                                           // 1024
            default:                                                                                              // 1025
                InBody.insertion_mode_end(tagName);                                                               // 1026
                return;                                                                                           // 1027
        }                                                                                                         // 1028
    }                                                                                                             // 1029
};                                                                                                                // 1030
                                                                                                                  // 1031
UniHTML = {                                                                                                       // 1032
    /**                                                                                                           // 1033
     * Parse html string and calls callback in the same order as tags in html string are present.                 // 1034
     * Method supports html5, including custom tags.                                                              // 1035
     * @param html                                                                                                // 1036
     * @param handler {Object} object of callbacks for example:                                                   // 1037
     * {                                                                                                          // 1038
     *          // attributesOnTag is an Object like {name, value, escaped}                                       // 1039
     *      start: function(tagName, attributesOnTag, isSelfClosing), // open tag                                 // 1040
     *      end: function(tagName), // close                                                                      // 1041
     *      chars: function(text), // text between open and closing tag                                           // 1042
     *      comment: function(text) // text from comment                                                          // 1043
     * }                                                                                                          // 1044
     * @throws Parse Error                                                                                        // 1045
     */                                                                                                           // 1046
    parse: HTMLParser,                                                                                            // 1047
    /**                                                                                                           // 1048
     * Cleanup dirty html from unknown/untrusted tags                                                             // 1049
     * @param html {string} html string to purify                                                                 // 1050
     * @param settings {Object} noFormatting, preferStrong_Em, preferB_I, noHeaders, withoutTags                  // 1051
     * @returns {HTML|string|void}                                                                                // 1052
     */                                                                                                           // 1053
    purify: function (html, settings) {                                                                           // 1054
        if (typeof settings !== 'object') {                                                                       // 1055
            settings = {};                                                                                        // 1056
        }                                                                                                         // 1057
        init(settings);                                                                                           // 1058
        insertion_mode = InBody;                                                                                  // 1059
                                                                                                                  // 1060
        try {                                                                                                     // 1061
            HTMLParser(html, {                                                                                    // 1062
                start: start,                                                                                     // 1063
                end: end,                                                                                         // 1064
                chars: chars                                                                                      // 1065
            });                                                                                                   // 1066
        } catch (e) {                                                                                             // 1067
            if (!settings.catchErrors) {                                                                          // 1068
                throw e;                                                                                          // 1069
            }                                                                                                     // 1070
        }                                                                                                         // 1071
                                                                                                                  // 1072
        return root.innerHTML().replace(/^\s+/, '');                                                              // 1073
    },                                                                                                            // 1074
    /**                                                                                                           // 1075
     * Sets new allowed attributes for one or all tags                                                            // 1076
     * @param attributesArray {Array} Array of names of attributes                                                // 1077
     * @param tag {string=} [tag=all_elements]                                                                    // 1078
     */                                                                                                           // 1079
    setNewAllowedAttributes: function (attributesArray, tag) {                                                    // 1080
        if (!tag) {                                                                                               // 1081
            tag = 'all_elements';                                                                                 // 1082
        }                                                                                                         // 1083
        if (!attributesArray) {                                                                                   // 1084
            attributesArray = [];                                                                                 // 1085
        }                                                                                                         // 1086
        if (typeof attributesArray === 'string') {                                                                // 1087
            attributesArray = [attributesArray];                                                                  // 1088
        }                                                                                                         // 1089
        allowed_attributes[tag] = attributesArray;                                                                // 1090
    },                                                                                                            // 1091
    /**                                                                                                           // 1092
     * Adds new allowed html tag                                                                                  // 1093
     * @param tagName {string}                                                                                    // 1094
     * @param isSelfClosing {boolean=} a void tags like: img, hr, area                                            // 1095
     */                                                                                                           // 1096
    addNewAllowedTag: function (tagName, isSelfClosing) {                                                         // 1097
        customTags[tagName] = true;                                                                               // 1098
        if (isSelfClosing) {                                                                                      // 1099
            selfClosing[tagName] = true;                                                                          // 1100
        }                                                                                                         // 1101
    }                                                                                                             // 1102
};                                                                                                                // 1103
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package['vazco:universe-html-purifier'] = {
  UniHTML: UniHTML
};

})();

//# sourceMappingURL=vazco_universe-html-purifier.js.map
