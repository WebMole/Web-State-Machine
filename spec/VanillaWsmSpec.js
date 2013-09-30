/**
 * Unit testing of VanillaWsm
 */
describe("VanillaWsm behaviour", function() {
    
    beforeEach(function() {
        pages = [];
        pages[1] = DomNode.parseFromString("<#document><html><body><h1>Page 1</h1><p><a>To page 2</a><a>To page 3</a></p></body></html></#document>");
        pages[2] = DomNode.parseFromString("<#document><html><body><h1>Page 2</h1><a>To page 3</a><a>To page 4</a></body></html></#document>");
        wsm = new VanillaWsm();
        expect(WsmNode.CLICKED).toBeDefined();
        expect(WsmNode.NOT_CLICKED).toBeDefined();
    });
    
    it("Records a transition to a new node", function() {
        wsm.setCurrentDom(pages[1]);
        wsm.setCurrentDom(pages[2], "#document/html/body/p/a[0]");
        expect(wsm.m_nodes.length).toEqual(2);
        var n = wsm.getNodeFromDom(pages[1]);
        var id = n.getId();
        expect(wsm.m_edges[id].length).toEqual(1);
        expect(wsm.m_domTree.equals(pages[2])).toEqual(true);
        expect(wsm.m_pathToFollow.isEmpty()).toEqual(true);
    });
    
    it("Returns the next click", function() {
        var new_page = new DomNode(pages[1]);
        new_page.setAllMarks(WsmNode.CLICKED);
        var el = new_page.getElementFromPathString("#document/html/body[0]/p[0]/a[1]");
        el.setMark(WsmNode.NOT_CLICKED);
        wsm.setCurrentDom(new_page);
        var next_click = wsm.getNextClick();
        var next_path = next_click.getContents();
        expect(next_path).toEqual("#document/html[0]/body[0]/p[0]/a[1]");
    });
    
    it("Recognizes a dead end", function() {
        var new_page = new DomNode(pages[1]);
        new_page.setAllMarks(WsmNode.CLICKED);
        wsm.setCurrentDom(new_page);
        var next_click = wsm.getNextClick();
        expect(next_click).toEqual(null);
    });
});
