/**
 * Unit testing of WSM manipulation
 */
describe("WSM manipulation", function() {
    
    beforeEach(function() {
        pages = [];
        pages[1] = DomNode.parseFromString("<#document><html><h1>Page 1</h1><p><a>To page 2</a><a>To page 3</a></p></html></#document>");
        pages[2] = DomNode.parseFromString("<#document><html><h1>Page 2</h1><a>To page 3</a><a>To page 4</a></html></#document>");
        wsm = new WebStateMachine();
        wsm.abstractNode = function(dom) { return dom; };
    });
    
    it("Sets the initial node", function() {
        wsm.setCurrentDom(pages[1]);
        expect(wsm.m_nodes.length).toEqual(1);
        expect(wsm.m_domTree.equals(pages[1])).toEqual(true);
        expect(wsm.m_pathToFollow.isEmpty()).toEqual(true);
    });
});
