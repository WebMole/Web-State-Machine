/**
 * Unit testing of DOM manipulation
 */
describe("DOM manipulation", function() {
    it("Parses a DOM from a string", function() {
        var s = "<HTML><BODY><H1>Some title</H1><P>Hello</P></BODY></HTML>";
        var dd = DomNode.parseFromString(s);
        expect(dd).toBeDefined();
        // Test proper parsing by directly querying elements
        expect(dd.getName()).toEqual("HTML");
        expect(dd.m_children.length).toEqual(1);
        expect(dd.m_children[0].getName()).toEqual("BODY");
        expect(dd.m_children[0].m_children[0].getName()).toEqual("H1");
        expect(dd.m_children[0].m_children[1].getName()).toEqual("P");
    });

    it("Parses a DOM from a document", function() {
        var dd = DomNode.parseFromDoc(document);
        // Not much we can test without knowing what is in document
        expect(dd).toBeDefined();
    });

    it("Parses a PathExpression from a string", function() {
        var pe = new PathExpression();
        pe.parseFromString("#document/HTML/BODY/P[1]");
        expect(pe.getLength()).toEqual(4);
        var segment = null;
        segment = pe.getSegment(0);
        expect(segment.getName()).toEqual("#document");
        segment = pe.getSegment(1);
        expect(segment.getName()).toEqual("HTML");
        expect(segment.getPosition()).toEqual(0);
        segment = pe.getSegment(2);
        expect(segment.getName()).toEqual("BODY");
        expect(segment.getPosition()).toEqual(0);
        segment = pe.getSegment(3);
        expect(segment.getName()).toEqual("P");
        expect(segment.getPosition()).toEqual(1);
    });

    it("Gets document element from PathExpression", function() {
        // Hard to test, we need a page to do that
    });

    it("Gets DOM element from PathExpression", function() {
        var s = "<#document><a><b><c>1</c><c>2</c></b><d>3</d><b><c>4</c></b></a></#document>";
        var dd = DomNode.parseFromString(s);
        var path_s = "#document/a/b[1]/c[0]";
        var el = dd.getElementFromPathString(path_s);
        expect(el).toBeDefined();
        expect(el).not.toEqual(null);
        expect(el.getName()).toEqual("c");
        expect(el.m_children[0].getName()).toEqual("4");
    });

    it("Gets root DOM element from PathExpression", function() {
        var s = "<#document><a><b><c>1</c><c>2</c></b><d>3</d><b><c>4</c></b></a></#document>";
        var dd = DomNode.parseFromString(s);
        var path_s = "#document";
        var el = dd.getElementFromPathString(path_s);
        expect(el).toBeDefined();
        expect(el).not.toEqual(null);
        expect(el.getName()).toEqual("#document");
    });

    describe("Element marking and finding", function() {
        it("Finds a marked element", function() {
            var s = "<#document><a><b><c>1</c><c>2</c></b><d>3</d><b><c>4</c></b></a></#document>";
            var dd = DomNode.parseFromString(s);
            var el = null;
            el = dd.prefixLookForMark(1);
            expect(el).toBeNull();
            el = dd.getElementFromPathString("#document/a/b[1]/c[0]");
            el.setMark(1);
            var path_to = dd.prefixLookForMark(1);
            expect(path_to).toEqual("#document/a[0]/b[1]/c[0]");
            // Mark another element "closer" in the traversal
            el = dd.getElementFromPathString("#document/a/b[1]");
            el.setMark(1);
            path_to = dd.prefixLookForMark(1);
            expect(path_to).toEqual("#document/a[0]/b[1]");
        });

        it("Finds a marked element (when only one exists)", function() {
            var new_page = DomNode.parseFromString("<#document><html><h1>Page 1</h1><p><a>To page 2</a><a>To page 3</a></p></html></#document>");
            new_page.setAllMarks(1);
            var el = new_page.getElementFromPathString("#document/html/p/a[1]");
            el.setMark(0);
            var path_to = new_page.prefixLookForMark(0);
            expect(path_to).toEqual("#document/html[0]/p[0]/a[1]");
        });
    });

    it("Compares identical DOMs", function() {
        var s = "<#document><a><b><c>1</c><c>2</c></b><d>3</d><b><c>4</c></b></a></#document>";
        var dd = DomNode.parseFromString(s);
        expect(dd.equals(dd)).toEqual(true);
    });

    it("Compares different DOMs", function() {
        var dd1 = null;
        var dd2 = null;
        var s1 = "<#document><a><b><c>1</c><c>2</c></b><d>3</d><b><c>4</c></b></a></#document>";
        var s2 = "<#document><a><b><c>1</c><c>2</c></b><d>3</d><b><c>5</c></b></a></#document>";
        dd1 = DomNode.parseFromString(s1);
        dd2 = DomNode.parseFromString(s2);
        expect(dd1.equals(dd2)).toEqual(false);
    });

    it("Compares a DOM to null", function() {
        var dd1 = null;
        var s1 = "<#document><a><b><c>1</c><c>2</c></b><d>3</d><b><c>4</c></b></a></#document>";
        dd1 = DomNode.parseFromString(s1);
        expect(dd1.equals(null)).toEqual(false);
    });

    it("Cloning a DOM", function() {
        var s1 = "<#document><a><b><c>1</c><c>2</c></b><d>3</d><b><c>4</c></b></a></#document>";
        var dn1 = DomNode.parseFromString(s1);
        var dn2 = new DomNode(dn1);
        //document.write("<pre>" + dn1.toString(true) + "</pre>");
        //document.write("<pre>" + dn2.toString(true) + "</pre>");
        expect(dn1.equals(dn2)).toEqual(true);
    });
});
