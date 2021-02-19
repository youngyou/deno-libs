// deno-lint-ignore-file
/**
 * The parse() method parses an XML string, constructing the JavaScript
 * value or object described by the string.
 *
 * @function parse
 * @param text {String} The string to parse as XML
 * @param [reviver] {Function} If a function, prescribes how the value
 * originally produced by parsing is transformed, before being returned.
 * @returns {Object}
 */

type XNode = {
  name?: string;
  children: Array<XNode | string>;
  attributes?: string;
  raw?: string;
  empty?: number;
};

type Reviver = (name: string, object: any) => any;

const UNESCAPE: { [key: string]: string } = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&apos;": "'",
  "&quot;": '"',
};

var ATTRIBUTE_KEY = "@";
var CHILD_NODE_KEY = "#";

function removeSpaces(str: string) {
  return str && str.replace(/^\s+|\s+$/g, "");
}

function unescapeXML(str: string) {
  return str.replace(
    /(&(?:lt|gt|amp|apos|quot|#(?:\d{1,6}|x[0-9a-fA-F]{1,5}));)/g,
    (str: string) => {
      if (str[1] === "#") {
        const code = str[2] === "x"
          ? parseInt(str.substr(3), 16)
          : parseInt(str.substr(2), 10);
        if (code > -1) return String.fromCharCode(code);
      }
      return UNESCAPE[str] || str;
    },
  );
}
function parseXML(text: string) {
  const list = String.prototype.split.call(
    text,
    /<([^!<>?](?:'[\S\s]*?'|"[\S\s]*?"|[^'"<>])*|!(?:--[\S\s]*?--|\[[^\[\]'"<>]+\[[\S\s]*?]]|DOCTYPE[^\[<>]*?\[[\S\s]*?]|(?:ENTITY[^"<>]*?"[\S\s]*?")?[\S\s]*?)|\?[\S\s]*?\?)>/,
  );

  // root element
  const root: XNode = { children: [] };
  let elem: XNode = root;

  // dom tree stack
  var stack: XNode[] = [];

  function appendChild(child: XNode | string) {
    elem.children.push(child);
  }

  function appendText(str: string) {
    str = removeSpaces(str);
    if (str) appendChild(unescapeXML(str));
  }

  function parseNode(tag: string) {
    var tagLength = tag.length;
    var firstChar = tag[0];
    if (firstChar === "/") {
      // close tag
      const closed = tag.replace(/^\/|[\s\/].*$/g, "").toLowerCase();
      while (stack.length) {
        const tagName = elem.name && elem.name.toLowerCase();
        elem = stack.pop()!;
        if (tagName === closed) break;
      }
    } else if (firstChar === "?") {
      // XML declaration
      appendChild(
        { name: "?", children: [], raw: tag.substr(1, tagLength - 2) },
      );
    } else if (firstChar === "!") {
      if (tag.substr(1, 7) === "[CDATA[" && tag.substr(-2) === "]]") {
        // CDATA section
        appendText(tag.substr(8, tagLength - 10));
      } else {
        // comment
        appendChild({ name: "!", children: [], raw: tag.substr(1) });
      }
    } else {
      const child = openTag(tag);
      appendChild(child);
      if (tag[tagLength - 1] === "/") {
        child.empty = 1; // emptyTag
      } else {
        stack.push(elem); // openTag
        elem = child;
      }
    }
  }
  for (let i = 0; i < list.length;) {
    // text node
    const str = list[i++];
    if (str) appendText(str);

    // child node
    const tag = list[i++];
    if (tag) parseNode(tag);
  }

  return root;
}

function openTag(tag: string) {
  const elem: XNode = { children: [] };
  tag = tag.replace(/\s*\/?$/, "");
  var pos = tag.search(/[\s='"\/]/);
  if (pos < 0) {
    elem.name = tag;
  } else {
    elem.name = tag.substr(0, pos);
    elem.attributes = tag.substr(pos);
  }
  return elem;
}

function parseAttribute(elem: XNode, reviver?: Reviver) {
  if (!elem.attributes) return;
  var list = elem.attributes.split(
    /([^\s='"]+(?:\s*=\s*(?:'[\S\s]*?'|"[\S\s]*?"|[^\s'"]*))?)/,
  );
  var length = list.length;
  var attributes, val;

  for (let i = 0; i < length; i++) {
    let str = removeSpaces(list[i]);
    if (!str) continue;

    if (!attributes) {
      attributes = {};
    }

    const pos = str.indexOf("=");
    if (pos < 0) {
      // bare attribute
      str = ATTRIBUTE_KEY + str;
      val = null;
    } else {
      // attribute key/value pair
      val = str.substr(pos + 1).replace(/^\s+/, "");
      str = ATTRIBUTE_KEY + str.substr(0, pos).replace(/\s+$/, "");

      // quote: foo="FOO" bar='BAR'
      const firstChar = val[0];
      const lastChar = val[val.length - 1];
      if (
        firstChar === lastChar &&
        (firstChar === "'" || firstChar === '"')
      ) {
        val = val.substr(1, val.length - 2);
      }
      val = unescapeXML(val);
    }
    if (reviver) {
      val = reviver(str, val);
    }
    addObject(attributes, str, val);
  }

  return attributes;
}

function toObject(elem: XNode | string, reviver?: Reviver) {
  if ("string" === typeof elem) return elem;

  var raw = elem.raw;
  if (raw) return raw;

  var attributes = parseAttribute(elem, reviver);
  var object: any;
  var childList = elem.children;
  var childLength = childList.length;

  if (attributes || childLength > 1) {
    // merge attributes and child nodes
    object = attributes || {};
    childList.forEach(function (child) {
      if ("string" === typeof child) {
        addObject(object, CHILD_NODE_KEY, child);
      } else {
        addObject(object, child.name!, toObject(child, reviver));
      }
    });
  } else if (childLength) {
    // the node has single child node but no attribute
    const child = childList[0];
    object = toObject(child, reviver);
    if (typeof child !== "string" && child.name) {
      const wrap: any = {};
      wrap[child.name] = object;
      object = wrap;
    }
  } else {
    // the node has no attribute nor child node
    object = elem.empty ? null : "";
  }

  if (reviver) {
    object = reviver(elem.name || "", object);
  }

  return object;
}

function addObject(object: any, key: string, val: any) {
  if ("undefined" === typeof val) return;
  var prev = object[key];
  if (prev instanceof Array) {
    prev.push(val);
  } else if (key in object) {
    object[key] = [prev, val];
  } else {
    object[key] = val;
  }
}

export function parse(text: string, reviver?: Reviver) {
  return toObject(parseXML(text), reviver);
}
