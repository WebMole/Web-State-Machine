/**
 * Dummy instantiation of a {@link WebStateMachine}, where each
 * implemented method is kept as simple as possible. This represents
 * the most generic form of a WSM. Developers are encouraged to use this
 * class as a template to create their own WSMs.
 * @constructor
 * @extends WebStateMachine
 */
function VanillaWsm()
{
  // Used to extend the prototype of WSM
  this.WebStateMachine = WebStateMachine;
  this.WebStateMachine();
  
  /**
   * Filters elements to click in a page.
   * @param {string} path A path string
   * @param {DomNode} dom_node Node corresponding to the contents of the
   *   current page
   * @return {boolean} <tt>true</tt> when the element at the end of that
   *   path can be clicked, <tt>false</tt> otherwise
   */
  this.isAcceptableClick = function(path, dom_node)
  {
    // We only click on elements strictly inside <body>, and not <script> elements
    var path_expr = new PathExpression(path);
    if (!path_expr.contains("BODY") && !path_expr.contains("body"))
    {
      return false;
    }
    var last_el = path_expr.getLastSegment();
    if (last_el.m_name === "BODY" || last_el.m_name === "body")
    {
      // We don't click on body itself
      return false;
    }
    if (path_expr.contains("SCRIPT"))
    {
      return false;
    }
    
    return true;
  };
  
  /**
   * Determines if two DOM nodes should be considered equal for the
   * purposes of the exploration. This method is used for two purposes:
   * <ol>
   * <li>To check if the exploration returned to a page that was already
   *   visited</li>
   * <li>To decide whether a new node should be created in the WSM</li>
   * </ol>
   * @param {DomNode} n1 The first node
   * @param {DomNode} n2 The second node
   * @return {boolean} <tt>true</tt> if the two nodes should be considered
   *   equal, <tt>false</tt> otherwise
   */
  this.nodesEqual = function(n1, n2)
  {
    if (n1 === undefined || n1 === null || n2 === undefined || n2 === null)
    {
      return false;
    }
    return n1.equals(n2);
  };
  
  /**
   * Handles the situation where the WSM has reached a dead end and is
   * sent back to its initial state. See {@link WebStateMachine#processReset}
   * for detailed info.
   * <p>
   * In the case of the VanillaWsm, we simply jump to the first page we find
   * that still has unvisited links.
   * @return {boolean} <tt>true</tt> if the exploration must continue,
   *   <tt>false</tt> if there is no unvisited page
   */
  this.processReset = function()
  {
    // Flush the visited path, as we don't need it
    this.m_pathSinceBeginning.clear();
    for (var i = 0; i < this.m_nodes.length; i++)
    {
      var node = this.m_nodes[i];
      if (!node.isExhausted())
      {
        var edge = new WsmEdge(0); // Dummy ID, don't care
        edge.setDestination(node.getId());
        edge.setContents(""); // Empty click path, indicating we jump to that page
        var ps = new PathSequence();
        ps.append(edge);
        this.m_pathToFollow = ps;
        return true;
      }
    }
    // If we are here, we are done
    return false;
  };
  
  /**
   * Processes the DOM tree before saving it to the WSM. See
   * {@link WebStateMachine#abstractNode} for detailed info.
   * <p>
   * In the case of VanillaWsm, no abstraction whatsoever is performed
   * on the tree; it is returned as is.
   * @param {DomNode} The original DOM tree
   * @return {DomNode} The processed DOM tree
   */
  this.abstractNode = function(dom)
  {
    return dom;
  };
  
}
