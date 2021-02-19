// deno-lint-ignore-file
import { assertEquals } from "https://deno.land/std@0.82.0/testing/asserts.ts";
import { parse } from "./xml.ts";

Deno.test("string", () => {
  assertEquals(parse("foo"), "foo");
});
Deno.test("element", () => {
  assertEquals(parse("<foo>FOO</foo>"), { foo: "FOO" });
  assertEquals(parse("<foo></foo>"), { foo: "" });
  assertEquals(
    parse("<foo><bar>BAR</bar></foo>"),
    { foo: { bar: "BAR" } },
  );
  assertEquals(
    parse("<foo><bar>BAR</bar><baz>BAZ</baz></foo>"),
    { foo: { bar: "BAR", baz: "BAZ" } },
  );
  assertEquals(
    parse("<foo><bar>BAR</bar><bar>QUX</bar></foo>"),
    { foo: { bar: ["BAR", "QUX"] } },
  );
  assertEquals(
    parse("<foo><bar>BAR</bar><baz>BAZ</baz><baz>QUX</baz></foo>"),
    { foo: { bar: "BAR", baz: ["BAZ", "QUX"] } },
  );
  assertEquals(
    parse("<foo><bar>BAR</bar>FOO</foo>"),
    { foo: { bar: "BAR", "#": "FOO" } },
  );
  // empty property name only accepts text nodes but not child nodes since version 0.1.1
  assertEquals(
    parse("<foo>FOO<bar>BAR</bar>BAZ</foo>"),
    { foo: { "#": ["FOO", "BAZ"], bar: "BAR" } },
  );
});
Deno.test("attribute", function () {
  assertEquals(parse('<foo bar="BAR"/>'), { foo: { "@bar": "BAR" } });
  assertEquals(parse('<foo bar="BAR"></foo>'), { foo: { "@bar": "BAR" } });
  assertEquals(parse("<foo bar='BAR'></foo>"), { foo: { "@bar": "BAR" } });
  assertEquals(parse("<foo bar=BAR></foo>"), { foo: { "@bar": "BAR" } });
  assertEquals(parse('<foo bar=""></foo>'), { foo: { "@bar": "" } });
  assertEquals(parse("<foo bar=''></foo>"), { foo: { "@bar": "" } });
  assertEquals(parse("<foo bar=></foo>"), { foo: { "@bar": "" } });
  assertEquals(parse("<foo bar></foo>"), { foo: { "@bar": null } });
});
Deno.test("multiple attributes", function () {
  assertEquals(
    parse('<foo bar="BAR" baz="BAZ"/>'),
    { foo: { "@bar": "BAR", "@baz": "BAZ" } },
  );
  assertEquals(
    parse('<foo bar="BAR" baz="BAZ"></foo>'),
    { foo: { "@bar": "BAR", "@baz": "BAZ" } },
  );
  assertEquals(
    parse("<foo bar baz></foo>"),
    { foo: { "@bar": null, "@baz": null } },
  );
  assertEquals(
    parse('<foo bar="BAR" bar="BAZ"></foo>'),
    { foo: { "@bar": ["BAR", "BAZ"] } },
  );
  assertEquals(
    parse("<foo bar bar></foo>"),
    { foo: { "@bar": [null, null] } },
  );
});
Deno.test("attributes and child elements", function () {
  assertEquals(
    parse('<foo bar="BAR">FOO</foo>'),
    { foo: { "@bar": "BAR", "#": "FOO" } },
  );
  assertEquals(
    parse('<foo bar="BAR" baz="BAZ">FOO</foo>'),
    { foo: { "@bar": "BAR", "@baz": "BAZ", "#": "FOO" } },
  );
  assertEquals(
    parse('<foo bar="BAR" baz="BAZ"><qux>QUX</qux></foo>'),
    { foo: { "@bar": "BAR", "@baz": "BAZ", "qux": "QUX" } },
  );
  assertEquals(
    parse('<foo bar="BAR" baz="BAZ"><qux>QUX</qux>QUUX</foo>'),
    { foo: { "@bar": "BAR", "@baz": "BAZ", "qux": "QUX", "#": "QUUX" } },
  );
  assertEquals(
    parse('<foo bar="BAR" baz="BAZ"><qux>QUX</qux><quux>QUUX</quux></foo>'),
    { foo: { "@bar": "BAR", "@baz": "BAZ", "qux": "QUX", "quux": "QUUX" } },
  );
});
// describe("parse", function () {

Deno.test("space near attribute", function () {
  assertEquals(
    parse('<foo bar ="BAR" baz qux ="QUX"></foo>'),
    { foo: { "@bar": "BAR", "@baz": null, "@qux": "QUX" } },
  );
  assertEquals(
    parse('<foo bar= "BAR" baz qux= "QUX"></foo>'),
    { foo: { "@bar": "BAR", "@baz": null, "@qux": "QUX" } },
  );
  assertEquals(
    parse('<foo bar = "BAR" baz qux = "QUX"></foo>'),
    { foo: { "@bar": "BAR", "@baz": null, "@qux": "QUX" } },
  );
  assertEquals(
    parse("<foo bar = BAR baz qux = QUX></foo>"),
    { foo: { "@bar": "BAR", "@baz": null, "@qux": "QUX" } },
  );
});

Deno.test("empty element", function () {
  assertEquals(parse("<foo/>"), { foo: null });
  assertEquals(parse('<foo bar="BAR"/>'), { foo: { "@bar": "BAR" } });
  assertEquals(parse("<foo><bar/></foo>"), { foo: { "bar": null } });
  assertEquals(
    parse("<foo><bar/><baz/></foo>"),
    { foo: { "bar": null, "baz": null } },
  );
  assertEquals(
    parse('<foo><bar baz="BAZ"/></foo>'),
    { foo: { "bar": { "@baz": "BAZ" } } },
  );
  assertEquals(
    parse("<foo><bar baz/></foo>"),
    { foo: { "bar": { "@baz": null } } },
  );
});

Deno.test("comment", function () {
  assertEquals(parse("<foo><!bar></foo>"), { foo: { "!": "bar" } });
  assertEquals(
    parse("<foo><!--bar--></foo>"),
    { foo: { "!": "--bar--" } },
  );
  assertEquals(
    parse("<foo><!bar><!baz></foo>"),
    { foo: { "!": ["bar", "baz"] } },
  );
  assertEquals(
    parse("<foo><!--bar--><!--baz--></foo>"),
    { foo: { "!": ["--bar--", "--baz--"] } },
  );
  assertEquals(
    parse("<foo><!bar><!--baz--></foo>"),
    { foo: { "!": ["bar", "--baz--"] } },
  );
  assertEquals(
    parse('<foo><!--L<G>A&Q"--></foo>'),
    { foo: { "!": '--L<G>A&Q"--' } },
  );
});

Deno.test("xml declaration", function () {
  assertEquals(
    parse('<?xml version="1.1"?>'),
    { "?": 'xml version="1.1"' },
  );
  assertEquals(
    parse(
      '<?xml version="1.0"?>\n' +
        '<!DOCTYPE foo SYSTEM "foo.dtd">\n' +
        "<foo>FOO</foo>\n",
    ),
    {
      "?": 'xml version="1.0"',
      "!": 'DOCTYPE foo SYSTEM "foo.dtd"',
      "foo": "FOO",
    },
  );
});

Deno.test("doctype and entity", function () {
  // https://www.w3.org/TR/2006/REC-xml11-20060816/REC-xml11-20060816.xml

  var magicents = "<code>amp</code>,\n" +
    "    <code>lt</code>,\n" +
    "    <code>gt</code>,\n" +
    "    <code>apos</code>,\n" +
    "    <code>quot</code>";

  // Entity Declaration with multi-line Entity Value
  var entity = '  <!ENTITY magicents "' + magicents + '">\n' +
    "  <!ENTITY may \"<phrase diff='chg'>may</phrase>\">\n" +
    '  <!ENTITY MAY "<rfc2119>MAY</rfc2119>">\n';

  // Document Type Definition with multi-line Internal Subset
  var xml = '<!DOCTYPE spec SYSTEM "xmlspec.dtd" [ \n' + entity + "\n]>";

  var doctype = xml.substr(2, xml.length - 3);
  assertEquals(doctype[0], "D");
  assertEquals(doctype[doctype.length - 1], "]");
  assertEquals(parse(xml), { "!": doctype });

  assertEquals(parse(entity), {
    "!": [
      'ENTITY magicents "' + magicents + '"',
      "ENTITY may \"<phrase diff='chg'>may</phrase>\"",
      'ENTITY MAY "<rfc2119>MAY</rfc2119>"',
    ],
  });
});

Deno.test("cdata", function () {
  assertEquals(parse("<foo><![CDATA[FOO]]></foo>"), { "foo": "FOO" });
  assertEquals(
    parse('<foo bar="BAR"><![CDATA[FOOBAR]]></foo>'),
    { "foo": { "@bar": "BAR", "#": "FOOBAR" } },
  );
  assertEquals(
    parse('<foo><![CDATA[L<G>A&Q"]]></foo>'),
    { "foo": 'L<G>A&Q"' },
  );
});

Deno.test("conditional sections", function () {
  // https://www.w3.org/TR/2006/REC-xml11-20060816/#sec-condition-sect
  var xml = "<!ENTITY % draft 'INCLUDE' >\n" +
    "<![%draft;[\n" +
    "<!ELEMENT book (comments*, title, body, supplements?)>\n" +
    "]]>";

  assertEquals(parse(xml), {
    "!": [
      "ENTITY % draft 'INCLUDE' ",
      "[%draft;[\n<!ELEMENT book (comments*, title, body, supplements?)>\n]]",
    ],
  });
});

Deno.test("escape", function () {
  // 4.1 Character and Entity References
  assertEquals(parse("L&lt;G&gt;A&amp;Q&quot;"), 'L<G>A&Q"');
  assertEquals(
    parse("<foo>L&lt;G&gt;A&amp;Q&quot;</foo>"),
    { foo: 'L<G>A&Q"' },
  );
  assertEquals(
    parse('<foo bar="L&lt;G&gt;A&amp;Q&quot;"></foo>'),
    { foo: { "@bar": 'L<G>A&Q"' } },
  );
  assertEquals(
    parse("<apos>\x27&#39;&#x27;&apos;</apos>"),
    { apos: "''''" },
  );
  assertEquals(
    parse("<alpha>\u03B1&#945;&#x3b1;</alpha>"),
    { alpha: "\u03B1\u03B1\u03B1" },
  );
  assertEquals(
    parse("<asia>\u4e9c&#20124;&#x4e9c;</asia>"),
    { asia: "\u4e9c\u4e9c\u4e9c" },
  );

  // tag name should not be unescaped
  assertEquals(parse("<&amp;>&amp;</&amp;>"), { "&amp;": "&" });

  // attribute name should not be unescaped
  assertEquals(
    parse('<foo &amp;="&amp;"/>'),
    { "foo": { "@&amp;": "&" } },
  );
});

Deno.test("whitespace", function () {
  assertEquals(
    parse("<xml>&#x20;F O O&#x20;</xml>"),
    { xml: " F O O " },
  );
  assertEquals(
    parse("<xml>&#x09;F\tO\tO&#x09;</xml>"),
    { xml: "\tF\tO\tO\t" },
  );
  assertEquals(
    parse("<xml>&#x0d;F\nO\rO&#x0a;</xml>"),
    { xml: "\rF\nO\rO\n" },
  );
});

Deno.test("syntax error", function () {
  // close tag </bar> appears without its open tag <bar>
  assertEquals(
    parse("<xml><foo>FOO</foo></bar><baz>BAZ</baz></xml>"),
    { xml: { foo: "FOO" }, baz: "BAZ" },
  );

  // open tag <bar> appears without its close tag </bar>
  assertEquals(
    parse("<xml><foo><bar>BAR</foo><baz>BAZ</baz></xml>"),
    { xml: { foo: { bar: "BAR" }, baz: "BAZ" } },
  );

  // root element is not closed
  assertEquals(
    parse("<xml><foo><bar>BAR</bar>"),
    { xml: { foo: { bar: "BAR" } } },
  );
});

Deno.test("reviver", function () {
  // reviver which may return modified string
  assertEquals(
    JSON.parse('{"foo":{"bar":"BAR","baz":"BAZ"}}', bazLower),
    { "foo": { "bar": "BAR", "baz": "baz" } },
  );
  assertEquals(
    parse("<foo><bar>BAR</bar><baz>BAZ</baz></foo>", bazLower),
    { "foo": { "bar": "BAR", "baz": "baz" } },
  );
  assertEquals(
    parse("<foo><baz>BAZ-1</baz><baz>BAZ-2</baz></foo>", bazLower),
    { "foo": { "baz": ["baz-1", "baz-2"] } },
  );
  assertEquals(
    parse('<foo bar="BAR" baz="BAZ"/>', bazLower),
    { "foo": { "@bar": "BAR", "@baz": "baz" } },
  );
  assertEquals(
    parse('<foo baz="BAZ-1" baz="BAZ-2"/>', bazLower),
    { "foo": { "@baz": ["baz-1", "baz-2"] } },
  );

  function bazLower(key: any, val: any) {
    if (key && key.indexOf("baz") > -1) {
      return String.prototype.toLowerCase.call(val);
    }
    return val;
  }

  // reviver which may return undefined
  assertEquals(
    JSON.parse('{"foo":{"bar":"BAR","baz":"BAZ"}}', barIgnore),
    { "foo": { "baz": "BAZ" } },
  );
  assertEquals(
    parse("<foo><bar>BAR</bar><baz>BAZ</baz></foo>", barIgnore),
    { "foo": { "baz": "BAZ" } },
  );
  assertEquals(
    parse(
      "<foo><bar>BAR-1</bar><bar>BAR-2</bar><baz>BAZ</baz></foo>",
      barIgnore,
    ),
    { "foo": { "baz": "BAZ" } },
  );
  assertEquals(
    parse('<foo bar="BAR" baz="BAZ"/>', barIgnore),
    { "foo": { "@baz": "BAZ" } },
  );
  assertEquals(
    parse('<foo bar="BAR-1" bar="BAR-2" baz="BAZ"/>', barIgnore),
    { "foo": { "@baz": "BAZ" } },
  );

  function barIgnore(key: any, val: any) {
    if (key && key.indexOf("bar") > -1) return; // undefined
    return val;
  }

  // reviver should work after unescaped
  assertEquals(
    parse("<foo><baz>l&lt;g&gt;a&amp;q&quot;</baz></foo>", bazUpper),
    { "foo": { "baz": 'L<G>A&Q"' } },
  );
  assertEquals(
    parse('<foo baz="l&lt;g&gt;a&amp;q&quot;"/>', bazUpper),
    { "foo": { "@baz": 'L<G>A&Q"' } },
  );

  function bazUpper(key: any, val: any) {
    if (key && key.indexOf("baz") > -1) {
      return String.prototype.toUpperCase.call(val);
    }
    return val;
  }

  // reviver which decode Date object

  const dtJSON = (new Date(2016, 9, 26, 21, 28, 0)).toJSON();
  const date = +new Date(dtJSON) - 0; // 1477484880000
  assertEquals(
    JSON.parse('{"date":"' + dtJSON + '"}', dateReplacer).date - 0,
    date,
  );
  assertEquals(
    parse("<foo><date>" + dtJSON + "</date></foo>", dateReplacer).foo
      .date - 0,
    date,
  );
  assertEquals(
    parse('<foo date="' + dtJSON + '"/>', dateReplacer).foo["@date"] - 0,
    date,
  );

  function dateReplacer(key: any, val: any) {
    if (key && key.indexOf("date") > -1) {
      return new Date(val);
    }
    return val;
  }
});

Deno.test("reviver order", function () {
  let order: any;

  JSON.parse('{"a": "A", "b": {"@c": "C", "d": "D"}}', add.bind(order = []));
  assertEquals(
    order.join(","),
    "a=string,@c=string,d=string,b=object,=object",
  );

  parse('<a>A</a><b c="C"><d>D</d></b>', add.bind(order = []));
  assertEquals(
    order.join(","),
    "a=string,@c=string,d=string,b=object,=object",
  );

  JSON.parse(
    '{"a": {"@b": ["B", "B"], "c": ["C", "C"]}}',
    add.bind(order = []),
  );
  assertEquals(
    order.join(","),
    "0=string,1=string,@b=object,0=string,1=string,c=object,a=object,=object",
  );

  parse('<a b="B" b="B"><c>C</c><c>C</c></a>', add.bind(order = []));
  assertEquals(
    order.join(","),
    "@b=string,@b=string,c=string,c=string,a=object,=object",
  );

  parse("<a>B<c>C</c>D</a>", add.bind(order = []));
  assertEquals(order.join(","), "c=string,a=object,=object");

  function add(this: any, key: any, val: any) {
    Array.prototype.push.call(this, key + "=" + typeof val);
    return val;
  }
});

Deno.test("new line", function () {
  // new line in tag
  assertEquals(
    parse('<foo\r\nbar="BAR"><baz>BAZ</baz></foo>'),
    { "foo": { "@bar": "BAR", "baz": "BAZ" } },
  );

  // new line in attribute
  assertEquals(
    parse('<foo bar="BAR\r\nBAR"><baz>BAZ</baz></foo>'),
    { "foo": { "@bar": "BAR\r\nBAR", "baz": "BAZ" } },
  );
  assertEquals(
    parse("<foo bar='BAR\r\nBAR'><baz>BAZ</baz></foo>"),
    { "foo": { "@bar": "BAR\r\nBAR", "baz": "BAZ" } },
  );

  // new line in long style comment
  assertEquals(
    parse("<foo><!--bar\r\nbaz--><!--bar\r\nbaz--></foo>"),
    { "foo": { "!": ["--bar\r\nbaz--", "--bar\r\nbaz--"] } },
  );

  // new line in short style comment
  assertEquals(
    parse("<foo><!bar\r\nbaz><!bar\r\nbaz></foo>"),
    { "foo": { "!": ["bar\r\nbaz", "bar\r\nbaz"] } },
  );

  // new line in CDATA
  assertEquals(
    parse("<foo><![CDATA[bar\r\nbaz]]><![CDATA[bar\r\nbaz]]></foo>"),
    { "foo": { "#": ["bar\r\nbaz", "bar\r\nbaz"] } },
  );

  // new line in PI
  assertEquals(parse("<?foo bar\r\nbaz?>"), { "?": "foo bar\r\nbaz" });
});

Deno.test("case insensitive", function () {
  assertEquals(
    parse("<foo><bar>BAR</BAR><baz>BAZ</BAZ></FOO>"),
    { "foo": { "bar": "BAR", "baz": "BAZ" } },
  );
});
