/**
 * Unit testing of NoBacktrackWsm
 */
describe("NoBacktrackWsm behaviour", function() {
    
    beforeEach(function() {
        pages = [];
        pages[1] = DomNode.parseFromString("<#document><html><body><h1>Page 1</h1><p><a>To page 2</a><a>To page 3</a></p></body></html></#document>");
        pages[2] = DomNode.parseFromString("<#document><html><body><h1>Page 2</h1><a>To page 3</a><a>To page 4</a></body></html></#document>");
        pages[3] = DomNode.parseFromString("<#document><html><body><h1>Page 3</h1><a>To page 3</a><a>To page 4</a></body></html></#document>");
        pages[4] = DomNode.parseFromString("<#document><html><body><h1>Page 4</h1><a>To page 3</a><a>To page 4</a></body></html></#document>");
        wsm = new NoBacktrackWsm();
    });
    
    it("Computes the reset path", function() {
        var p = null, el = null, el_to_click = null;
        p = new DomNode(pages[1]);
        p.setAllMarks(WsmNode.CLICKED);
        wsm.setCurrentDom(p);
        
        p = new DomNode(pages[2]);
        p.setAllMarks(WsmNode.CLICKED);
        wsm.setCurrentDom(p, "#document/html/body[0]/p[0]/a[0]");
        
        p = new DomNode(pages[3]);
        p.setAllMarks(WsmNode.CLICKED);
        el = p.getElementFromPathString("#document/html/body[0]/a[1]");
        el.setMark(WsmNode.NOT_CLICKED); // Leave a node unclicked in this page     
        wsm.setCurrentDom(p, "#document/html/body[0]/a[0]");
        
        p = new DomNode(pages[4]);
        p.setAllMarks(WsmNode.CLICKED);        
        wsm.setCurrentDom(p, "#document/html/body[0]/p[0]/a[0]");
        
        // Ask for next click: should be empty
        el_to_click = wsm.getNextClick();
        var path_to_click = el_to_click.getContents();
        var page_to_click = el_to_click.getDestination();
        expect(page_to_click).not.toEqual(wsm.m_currentNodeId);
        var ptf = wsm.m_pathToFollow;
        expect(ptf.getLength()).toEqual(2);
        // Jump back to initial state
        wsm.setCurrentDom(pages[1]);
    });
});
