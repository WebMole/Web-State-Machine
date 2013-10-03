/*! Web-State-Machine - v0.0.1 - 2013-10-02
* Copyright (c) 2013 ; Licensed  */
function BacktrackWsm() // extends WebStateMachine
{
  // Used to extend the prototype of WSM
  this.VanillaWsm = VanillaWsm;
  this.VanillaWsm();
  
  /**
   * Handles the situation where the WSM has reached a dead end and is
   * sent back to its initial state. See {@link WebStateMachine#processReset}
   * for detailed info.
   * <p>
   * In the case of the BacktrackWsm, we simply jump to the next-to-last
   * node ID we visited.
   * @return {boolean} <tt>true</tt> if the exploration must continue,
   *   <tt>false</tt> if there is no unvisited page
   */
  this.processReset = function()
  {
    // Pop last state in the state stack and peek next-to-last
    if (this.m_pathSinceBeginning.getLength() === 0)
    {
      // Not supposed to happen, but anyway, means we are done
      return false;
    }
    var dummy = this.m_pathSinceBeginning.popLastElement();
    if (this.m_pathSinceBeginning.getLength() === 0)
    {
      // Finished backtracking: we are done
      return false;
    }
    var last_edge = this.m_pathSinceBeginning.peekLastElement();
    var new_edge = new WsmEdge();
    new_edge.setDestination(last_edge.getDestination());
    var ps = new PathSequence();
    ps.append(new_edge);
    this.m_pathToFollow = ps;
    return true;
  };
  
}

function PathSegment()
{
  this.m_name = "";
  this.m_position = 0;
  
  this.getName = function()
  {
    return this.m_name;
  };
  
  this.getPosition = function()
  {
    return this.m_position;
  };
  
  this.toString = function()
  {
    return this.m_name + "[" + this.m_position + "]";
  };
  
  this.parseFromString = function(s)
  {
    var bits = s.split("[");
    if (bits.length == 1)
    {
      this.m_name = s;
    }
    else
    {
      this.m_name = bits[0];
      this.m_position = parseInt(bits[1].substring(0, bits[1].length - 1), 10);
    }
  }; // }}}
}

/**
 * Representation of a path inside a DOM document. This path is a sequence
 * of {@link PathSegment}s. A path expression can be represented by a string
 * like this:
 * <pre>
 * HTML[0]/BODY[0]/P[1]/I[0]
 * </pre>
 * denoting the first <code>I</code> element inside the second
 * <code>P</code> of the page's (only) <code>BODY</code> element within its
 * (only) <code>HTML</code> element.
 * @constructor
 * @param {string} contents If specified, instantiates a path expression by
 *   parsing the contents of the string passed as an argument
 */
function PathExpression(contents)
{
  /**
   * The list of path segments contained in the expression
   */
  this.m_pieces = [];
  
  /**
   * Returns the length of the path expression (i.e. its number of
   * path segments)
   * @return {number} The length of the path expression
   */
  this.getLength = function()
  {
    return this.m_pieces.length;
  };
  
  /**
   * Outputs a string representation of the path expression. This
   * representation is a slash-separated list of path segments.
   * @return {string} The path expression as a string
   */
  this.toString = function()
  {
    var out = "";
    for (var i = 0; i < this.m_pieces.length; i++)
    {
      var piece = this.m_pieces[i];
      out += "/" + piece.toString();
    }
    return out;
  };
  
  /**
   * Parses a path expression from a string.
   * @param {string} s The string to parse
   */
  this.parseFromString = function(s)
  {
    var pieces = s.split("/");
    for (var i = 0; i < pieces.length; i++)
    {
      var piece = pieces[i];
      var segment = new PathSegment();
      segment.parseFromString(piece);
      this.m_pieces.push(segment);
    }
  };
  
  /**
   * Returns a particular path segment of the expression.
   * @param {number} pos The position of the path segment to obtain
   * @return {PathSegment} The path segment to look for, null if position
   *   is out of bounds
   */
  this.getSegment = function(pos)
  {
    if (pos < 0 || pos >= this.m_pieces.length)
    {
      console.error("Index out of bounds in PathExpression.getSegment");
      return null;
    }
    return this.m_pieces[pos];
  };

  /**
   * Returns the last path segment of the expression.
   * @return {PathSegment} The last path segment, null if path is empty
   */
  this.getLastSegment = function()
  {
    if (this.m_pieces.length >= 1)
    {
      return this.getSegment(this.m_pieces.length - 1);
    }
    return null;
  };
  
  /**
   * Determines if the path contains a segment of given name.
   * @param {string} The name to look for
   * @return {boolean} true or false depending on whether the path contains
   *   the name
   */
  this.contains = function(s)
  {
    for (var i = 0; i < this.m_pieces.length; i++)
    {
      var piece = this.m_pieces[i];
      if (piece.getName() === s)
      {
        return true;
      }
    }
    return false;
  };
  
  // If something was passed to the constructor, use it to instantiate the
  // DOM node
  if (contents !== undefined)
  {
    this.parseFromString(contents);
  }

}

/**
 * Attribute-value pair that can be contained in a DOM node.
 * This object is intended to store DOM element attributes and their
 * respective values.
 * @constructor
 * @param {string} name The attribute's name
 * @param {string} value The attribute's value
 */
function DomNodeAttribute(name, value)
{
  this.m_name = name;
  this.m_value = value;
}

/**
 * Basic building block for a nested structure of HTML-like elements.
 * @constructor
 * @param {Document} contents If specified, instantiates a DOM node by
 *   traversing the current Document object (e.g.
 *   <code>window.document</code> and cloning its contents
 */
function DomNode(contents)
{
  
  this.m_isLeaf = false;
  
  this.m_name = "";
  
  this.m_attributes = [];
  
  this.m_handlers = [];
  
  this.m_children = [];
  
  /**
   * Arbitrary data field that can be associated to a node. Can be used,
   * e.g. to memorize whether a DOM node has already been clicked or not
   */
  this.m_mark = 0;
  
  this.toString = function(to_escape)
  {
    var tag_beg = "<";
    var tag_end = ">";
    if (to_escape === true)
    {
      tag_beg = "&lt;";
      tag_end = "&gt;";
    }
    var out = "";
    if (this.m_isLeaf === true)
    {
      // Leaf (i.e. text) node
      return this.m_name;
    }
    out += tag_beg + this.m_name + " mark=" + this.m_mark;
    for (var i = 0; i < this.m_attributes.length; i++)
    {
      var dna = this.m_attributes[i];
      out += " " + dna.m_name + "=\"" + dna.m_value + "\"";
    }
    out += tag_end + "\n";
    for (i = 0; i < this.m_children.length; i++)
    {
      var child = this.m_children[i];
      out += child.toString(to_escape);
    }
    out += "&lt;/" + this.m_name + "&gt;\n";
    return out;
  };
  
  /**
   * Sets a value to the mark field
   * @param m The value to set
   */
  this.setMark = function(m)
  {
    this.m_mark = m;
  };
  
  /**
   * Returns the value of the mark field
   * @return The mark value
   */
  this.getMark = function()
  {
    return this.m_mark;
  };
  
  /**
   * Sets the mark back to some default value
   */
  this.resetMark = function()
  {
    this.m_mark = 0;
  };
  
  /**
   * Recursively sets the mark for all nodes
   * @param m The mark to set
   */
  this.setAllMarks = function(m)
  {
    this.m_mark = m;
    for (var i = 0; i < this.m_children.length; i++)
    {
      var child = this.m_children[i];
      child.setAllMarks(m);
    }
  };
  
  /**
   * Returns the name of the node
   * @return {string} The node name
   */
  this.getName = function()
  {
    return this.m_name;
  };
  
  /**
   * Looks for first DOM node with mark value m, using a prefix
   * traversal of the tree. <strong>Leaf nodes are ignored.</strong>
   * @param m The value of mark to look for
   * @param path Should not be defined when called
   * @return The <em>path</em> leading to the node (as a string), empty
   *    string otherwise
   */
  this.prefixLookForMark = function(m, path)
  {
    /*if (this.m_name == "#document")
    {
      // We ignore the top-level element, which should always be "#document"
      if (this.m_children !== undefined && this.m_children.length > 0)
      {
	    for (var i = 0; i < this.m_children.length; i++)
		{
		  var child = this.m_children[i];
		  return child.prefixLookForMark(m);
		}
        
      }
      return null;
    }*/
    if (this.m_isLeaf)
    {
      // We ignore leaf (i.e. text) nodes
      return null;
    }
    if (path === undefined)
    {
      path = this.m_name;
    }
    if (this.m_mark == m)
    {
      return path;
    }
    var child_count = [];
    for (var i = 0; i < this.m_children.length; i++)
    {
      var child = this.m_children[i];
      var child_name = child.m_name;
      if (child_count[child_name] === undefined)
      {
        child_count[child_name] = 0;
      }
      else
      {
        child_count[child_name]++;
      }
      var new_path = path + "/" + child_name + "[" + child_count[child_name] + "]";
      var answer = child.prefixLookForMark(m, new_path);
      if (answer !== null)
      {
        return answer;
      }
    }
    return null;
  };

  /**
   * Returns an element of the DOM tree based on a path expression written
   * as a string. This is a front-end to {@link getElementFromPath}.
   * @param {string} path_string The path expression
   * @param {number} index Should not be defined when called
   * @return {DomNode} The DOM node at the end of the path, null if not
   *    found
   */
  this.getElementFromPathString = function(path_string)
  {
    var path = new PathExpression(path_string);
    return this.getElementFromPath(path);
  };

  /**
   * Returns an element of the DOM tree based on a path expression.
   *
   * @param {PathExpression} path The path expression
   * @param {number} [index] Should not be specified
   * @return {DomNode} The DOM node at the end of the path, null if not
   *    found
   */
  this.getElementFromPath = function(path, index)
  {
    if (index === undefined)
    {
      index = 0;
    }
    if (index > path.getLength() - 1)
    {
      console.error("Error processing path");
      return null;
    }
    if (index == path.getLength() - 1)
    {
      return this;
    }
	/*if (index === 0)
	{
	  var first_segment = path.getSegment(0);
	  var first_name = first_segment.getName();
	  if (first_name != this.m_name)
	  {
	    return null;
	  }
	  index++;
	}*/
    var piece = path.getSegment(index + 1);
    var pos = piece.getPosition();
    var name = piece.getName();
    var good_name_count = 0;
    for (var i = 0; i < this.m_children.length; i++)
    {
      var child = this.m_children[i];
      var c_name = child.m_name;
      if (name == c_name)
      {
        if (good_name_count == pos)
        {
          return child.getElementFromPath(path, index + 1);
        }
        good_name_count++;
      }
    }
    return null;
  };
  
  /**
   * Sets/adds an attribute to the node. If the attribute already exists,
   * its value is overwritten. Otherwise, the attribute is added to the
   * node.
   * @param {string} The attribute name
   * @param {string} The value to assign to the attribute
   */
  this.setAttribute = function(name, value)
  {
    for (var i = 0; i < this.m_attributes.length; i++)
    {
      var avp = this.m_attributes[i];
      var avp_name = avp.m_name;
      if (name === avp_name)
      {
        avp.m_value = value;
        return;
      }
    }
    var new_avp = new DomNodeAttribute(name, value);
    this.m_attributes.push(new_avp);
  };
  
  /**
   * Checks for equality between the current DOM node and another one.
   * If DomNode.IGNORE_ATTRIBUTES is set to true, the equality check will
   * not take care of elements' attributes (only name and content).
   * In any case, the mark associated to the node is not part of the
   * comparison.
   * @param {DomNode} other_node The other node to check for equality
   * @return {boolean} true or false
   */
  this.equals = function(other_node)
  {
    var i = 0;
    if (other_node === undefined)
    {
      return false;
    }
    if (!DomNode.prototype.isPrototypeOf(other_node))
    {
      return false;
    }
    if (this.m_name !== other_node.m_name)
    {
      return false;
    }
    if (this.m_isLeaf !== other_node.m_isLeaf)
    {
      return false;
    }
    if (this.m_children.length !== other_node.m_children.length)
    {
      return false;
    }
    if (!DomNode.IGNORE_ATTRIBUTES)
    {
      // Compare attributes one by one; should appear in the same
      // order and have the same values
      if (this.m_attributes.length !== other_node.m_attributes.length)
      {
        return false;
      }
      for (i = 0; i < this.m_attributes.length; i++)
      {
        var at_left = this.m_attributes[i];
        var at_right = other_node.m_attributes[i];
        if (at_right === undefined)
        {
          // Should not happen anyway
          return false;
        }
        if (at_left.m_name !== at_right.m_name)
        {
          return false;
        }
        if (at_left.m_value !== at_right.m_value)
        {
          return false;
        }
      }
    }
    // Recursively, children on both sides should be equal
    for (i = 0; i < this.m_children.length; i++)
    {
      var ch_left = this.m_children[i];
      var ch_right = other_node.m_children[i];
      if (ch_right === undefined)
      {
        // Should not happen anyway
        return false;
      }
      if (!ch_left.equals(ch_right))
      {
        return false;
      }
    }
    // If we made it here, everything we checked was equal; return true
    return true;
  };
  
  /**
   * Computes the global size of the node and its children, expressed as an
   * estimate in bytes.
   * @return {number} The estimated global byte size
   */
  this.getByteSize = function()
  {
    // We count four bytes for the ID, plus the size of all strings
    // (name, attributes and values)
    var count = 4;
    for (var i = 0; i < this.m_children.length; i++)
    {
      var child = this.m_children[i];
      count += child.getByteSize();
    }
    for (var j = 0; j < this.m_attributes.length; j++)
    {
      var avp = this.m_attributes[j];
      count += avp.m_name.length + avp.m_value.length;
    }
    return count;
  };
  
  /**
   * Computes the size of the DOM tree, expressed in the number of nodes
   * @return {number} The size of the DOM tree
   */
  this.countNodes = function()
  {
    var count = 1;
    for (var i = 0; i < this.m_children.length; i++)
    {
      var child = this.m_children[i];
      count += child.countNodes();
    }
    return count;
  };
  
  /**
   * Fetches the value of the node's attribute
   * @param {string} The attribute to look for
   * @return {string} The attribute value, null if not found
   */
  this.getAttribute = function(name)
  {
    for (var i = 0; i < this.m_attributes.length; i++)
    {
      var avp = this.m_attributes[i];
      if (avp.m_name == name)
      {
        return avp.m_value;
      }
    }
    return null;
  };
  
  /**
   * Clones the current node (i.e. performs a deep copy)
   * @param {DomNode} other_node The DomNode to clone from
   */
  this.clone = function(other_node)
  {
    var i = 0;
    if (!(other_node instanceof DomNode))
    {
      console.error("Trying to clone DomNode from an object that is not a DomNode");
      return;
    }
    this.m_name = other_node.m_name;
    this.m_isLeaf = other_node.m_isLeaf;
    this.m_attributes = [];
    for (i = 0; i < other_node.m_attributes; i++)
    {
      var avp = other_node.m_attributes[i];
      this.m_attributes.push(new DomNodeAttribute(avp.m_name, avp.m_value));
    }
    this.m_handlers = [];
    if (other_node.m_handlers["on-click"] === true)
    {
      this.m_handlers["on-click"] = true;
    }
    this.m_children = [];
    for (i = 0; i < other_node.m_children.length; i++)
    {
      var child = other_node.m_children[i];
      this.m_children.push(new DomNode(child));
    }
  };
  
  /**
   * Serializes the content of the object in XML format.
   * @param {string} [indent] String that will be appended at
   *   the beginning of every line of the output (used to indent).
   * @return {string} A string in XML format representing the object's
   *   contents
   */
  this.toXml = function(indent)
  {
    var i = 0;
    if (indent === undefined)
    {
      indent = "";
    }
    var out = "";
    out += indent + "<domNode>\n";
    var name = this.m_name;
    if (this.m_isLeaf)
    {
      // Enclose contents in CDATA for leaves
      name = "<![CDATA[" + name + "]]>";
    }
    out += indent + "  <name>" + name + "</name>\n";
    out += indent + "  <children>\n";
    for (i = 0; i < this.m_children.length; i++)
    {
      var child = this.m_children[i];
      out += child.toXml(indent + "    ") + "\n";
    }
    out += indent + "  </children>\n";
    if (!DomNode.IGNORE_ATTRIBUTES)
    {
      out += "  <attributes>\n";
      for (i = 0; i < this.m_attributes.length; i++)
      {
        var avp = this.m_attributes[i];
        out += "    <attribute name=\"" + avp.m_name + "\"><![CDATA[" + avp.m_value + "]]></attribute>\n";
      }
      out += "  </attributes>\n";
    }
    out += indent + "  <mark><![CDATA[" + this.m_mark + "]]></mark>\n";
    out += indent + "</domNode>\n";
    return out;
  };
  
  // If something was passed to the constructor, use it to instantiate the
  // DOM node
  if (contents !== undefined)
  {
    if (contents instanceof DomNode)
    {
      this.clone(contents);
    }
  }
}

/**
 * Instantiates the DomNode by traversing a <code>Document</code>
 * object. This is intended to make a clone of the current state of the
 * <code>window.document</code> object into a persistent DOMNode
 * structure.
 *
 * @param {document} e The document to parse
 */
DomNode.parseFromDoc = function(e)
{
  var i = 0;
  var out = new DomNode();
  out.m_name = e.nodeName;
  if (out.m_name == "#text")
  {
    // Leaf (i.e. text) node
    out.m_name = e.nodeValue;
    out.m_isLeaf = true;
  }
  else
  {
    if (e.attributes !== undefined && !DomNode.IGNORE_ATTRIBUTES)
    {
      for (i = 0; i < e.attributes.length; i++)
      {
        var attval = e.attributes[i];
        var dna = new DomNodeAttribute(attval.nodeName, attval.nodeValue);
        out.m_attributes.push(dna);
      }
    }
    if (!DomNode.IGNORE_HANDLERS)
    {
      // For handlers, we only record whether an element has a handler
      // attached to it --not the contents of that handler
      // TODO: this doesn't work. When a page has handlers attached
      // with jQuery, onclick is always null regardless. Find a way to
      // detect handlers when attached with jQuery.
      if (e.onclick !== undefined && e.onclick !== null)
      {
        // We use "on-click" in the table; otherwise JSLint mistakenly
        // thinks we refer to the onclick event handler and throws an error
        out.m_handlers["on-click"] = true;
      }
    }
    for (i = 0; i < e.childNodes.length; i++)
    {
      var child = e.childNodes[i];
      var dn = DomNode.parseFromDoc(child);
      out.m_children.push(dn);
    }
  }
  return out;
};

/**
 * Internal function that parses lists of child nodes. Used by {@link
 * parseFromString, but should not be called directly
 */
DomNode.parseFromStringChildren = function(s)
{
  var children = [];
  var sc = s;
  sc = sc.trim();
  var dn = null;
  while (sc.length > 0)
  {
    dn = new DomNode();
    var left_tag_close = sc.indexOf(">");
    if (left_tag_close == -1)
    {
      dn.m_isLeaf = true;
      dn.m_name = sc;
      children.push(dn);
      break;
    }
    var tag_name = sc.substring(1, left_tag_close);
    dn.m_name = tag_name;
    var right_tag_open = sc.indexOf("</" + tag_name + ">");
    if (right_tag_open == -1)
    {
      console.error("Error parsing DOM from string: end of tag " + tag_name + " not found");
      return;
    }
    var right_tag_close = right_tag_open + tag_name.length + 2;
    if (right_tag_close >= sc.length)
    {
      console.error("Error parsing DOM from string: end of tag " + tag_name + " past end of string");
      return;
    }
    var inside = sc.substring(left_tag_close + 1, right_tag_open);
    dn.m_children = DomNode.parseFromStringChildren(inside);
    children.push(dn);
    sc = sc.substring(right_tag_close + 1).trim();
  }
  return children;
};

/**
 * Instantiates the DomNode by parsing an HTML string.
 * <strong>NOTE:</strong> this method is a very simple implementation of
 * HTML parsing intended for debugging purposes. Attributes are ignored
 * and recursive schemas (i.e. an element &lt;e&gt; within another
 * &lt;e&gt; will yield unexpected results. To create a faithful copy of
 * the current page, use {@link parseFromDoc}.
 *
 * @param {string} s The string to parse from
 */
DomNode.parseFromString = function(s)
{
  var el = DomNode.parseFromStringChildren(s);
  if (el.length >= 1)
  {
    return el[0];
  }
  return null;
};

/**
 * Checks for equality between two DOM nodes. This is a static binary
 * front-end to the {@link DomNode#equals} method
 * 
 * @param {DomNode} n1 The first node to compare
 * @param {DomNode} n2 The second node to compare
 * @return true or false, depending on whether <code>n1.equals(n2)</code>
 */
DomNode.are_equal = function(n1, n2)
{
  if (!DomNode.prototype.isPrototypeOf(n1))
  {
    return false;
  }
  return n1.equals(n2);
};

/**
 * Whether to ignore attributes when comparing nodes
 * @constant
 * @type {boolean}
 */
DomNode.IGNORE_ATTRIBUTES = true;

/**
 * Whether to ignore event handlers when comparing nodes
 * @constant
 * @type {boolean}
 */
DomNode.IGNORE_HANDLERS = false;



/**
 * Returns an element of the browser's <code>window.document</code> object
 * based on a path expression
 *
 * @param {Document} dom The document object. Should always be
 *    <code>window.document</code>
 * @param {PathExpression} path The path to look for
 * @param {number} index Should not be defined when called
 * @return {Node} The element in the document at the end of the path; null
 *    if could not be found
 */
function get_element_from_path(dom, path, index)
{
  if (index === undefined)
  {
    index = 1; // We ignore the #document at the beginning of the path
  }
  if (index > path.getLength())
  {
    console.error("Error processing path");
    return;
  }
  if (index == path.getLength())
  {
    return dom;
  }
  var piece = path.getSegment(index);
  var pos = piece.getPosition();
  var name = piece.getName();
  var good_name_count = 0;
  for (var i = 0; i < dom.childNodes.length; i++)
  {
    var child = dom.childNodes[i];
    var c_name = child.nodeName;
    if (name == c_name)
    {
      if (good_name_count == pos)
      {
        return get_element_from_path(child, path, index + 1);
      }
      good_name_count++;
    }
  }
  return null;
}

function NoBacktrackWsm() // extends VanillaWsm
{
  // Used to extend the prototype of VanillaWsm
  this.VanillaWsm = VanillaWsm;
  this.VanillaWsm();
  
  /**
   * Upper bound to the number of iterations of the shortest path algorithm.
   * It should be safe to set it to a high value in production context.
   * @constant
   * @type {number}
   */
  this.SAFE_COUNT = 50;
  
  /**
   * Handles the situation where the WSM has reached a dead end and is
   * sent back to its initial state. See {@link WebStateMachine#processReset}
   * for detailed info.
   * <p>
   * In the case of WebMole, the procedure
   * is to calculate the shortest path from the initial state to the closest
   * node that has not been completely exhausted (i.e. that still has
   * unclicked elements.
   * @param {number} The ID of the node in the WSM wher the exploration
   *   resumes at
   * @return {boolean} <tt>true</tt> if the exploration must continue,
   *   <tt>false</tt> if there is no unvisited page
   */
  this.processReset = function(node_id)
  {
    // Flush the visited path, as we don't need it
    this.m_pathSinceBeginning.clear();
    // If no ID is passed, we assume we reset the application, i.e.
    // go back to its initial state (the one with ID=1)
    if (node_id === undefined)
    {
      node_id = 1;
    }
    // Determine a path to the closest node that is not exhausted
    var node = this.getNodeFromId(node_id);
    var paths_queue = [];
    var new_edge = new WsmEdge();
    new_edge.setDestination(node_id);
    var new_ps = new PathSequence();
    new_ps.append(new_edge);
    paths_queue.push(new_ps);
    // ...and launch breadth-first exploration on that list
    var path = this.findPath(paths_queue);
    if (path === null)
    {
      return false; // No path returned: exploration is over
    }
    this.m_pathToFollow = path;
    return true;
  };
  
  /**
   * Performs a breadth-first search of the WSM to look for the first
   * encountered node that is not exhausted
   * @param paths_queue {WsmEdge} A list of edge
   *   objects used as the starting point for the search
   * @return {PathSequence} A PathSequence giving the sequence of elements
   *  to click to reach a node that is not exhausted
   */
  this.findPath = function(paths_queue)
  {
    // Keep trace of node IDs that have already been visited, to avoid
    // endless looping through cycles
    var visited_ids = [];
    
    // This is actually a "while" loop that is guaranteed to terminate,
    // but for safety we use a dummy for loop with a bound on iterations
    for (var safe_count = 0; safe_count < this.SAFE_COUNT && paths_queue.length > 0; safe_count++)
    {
      for (var i = 0; i < paths_queue.length; i++)
      {
        var pseq = paths_queue[i];
        // Check if destination is exhausted
        var pseg = pseq.peekLastElement();
        var node_dest_id = pseg.getDestination();
        visited_ids[node_dest_id] = true; // Mark node as visited
        var node_dest = this.getNodeFromId(node_dest_id);
        if (!node_dest.isExhausted(this.isAcceptableClick))
        {
          // Yes, we are done: return sequence leading to that node
          return pseq;
        }
      }
      // If we reach this point, no path in the queue ends in an exhausted
      // node: append to each all possible next-step transitions
      var new_paths_queue = [];
      while (paths_queue.length > 0)
      {
        var path_el = paths_queue.shift();
        var last_el = path_el.peekLastElement();
        var target_id = last_el.getDestination();
        var transitions = this.m_edges[target_id];
        if (transitions === undefined)
        {
          transitions = [];
        }
        for (var j = 0; j < transitions.length; j++)
        {
          var transition = transitions[j];
          var dest = transition.getDestination();
          if (visited_ids[dest] === true)
          {
            continue;
          }
          var ps = new PathSequence(path_el);
          ps.append(transition);
          new_paths_queue.push(ps);
        }
      }
      paths_queue = new_paths_queue;
    }
    // If we are here, we are done
    return null;
  };

}

function TansuoWsm()
{
  // Used to extend the prototype of VanillaWsm
  this.NoBacktrackWsm = NoBacktrackWsm;
  this.NoBacktrackWsm();
  
  /**
   * Internal member field to store the ID of the node we want to reach
   * @type {number}
   */
  this.m_targetId = null;
  
  /**
   * Handles the situation where the WSM has reached a dead end and is
   * sent back to its initial state. See {@link WebStateMachine#processReset}
   * for detailed info.
   * <p>
   * In the case of Tansuo, the procedure
   * is to return the last suffix that starts with the initial state.
   * @param {number} The ID of the node in the WSM wher the exploration
   *   resumes at
   * @return {boolean} <tt>true</tt> if the exploration must continue,
   *   <tt>false</tt> if there is no unvisited page
   */
  this.processReset = function(node_id)
  {
    // Pop last state in the state stack and peek next-to-last
    if (this.m_pathSinceBeginning.getLength() === 0)
    {
      // Not supposed to happen, but anyway, means we are done
      return false;
    }
    var dummy = this.m_pathSinceBeginning.popLastElement();
    if (this.m_pathSinceBeginning.getLength() === 0)
    {
      // Finished backtracking: we are done
      return false;
    }
    // If no ID is passed, we assume we reset the application, i.e.
    // go back to its initial state (the one with ID=1)
    if (node_id === undefined)
    {
      node_id = 1;
    }
    var len = this.m_pathSinceBeginning.getLength();
    for (var i = len - 1; i >= 0; i--)
    {
      // Go backwards until we find the initial state
      var pseg = this.m_pathSinceBeginning.getElement(i);
      var dest_id = pseg.getDestination();
      if (dest_id == node_id)
      {
        // We found it
        break;
      }
    }
    // Assert: i = position of last occurrence of node_id in sequence
    // Path to follow = suffix of sequence from that position
    var out_ps = new PathSequence();
    for (var j = i; j < len; j++)
    {
      var segment = this.m_pathSinceBeginning.getElement(j);
      out_ps.append(segment);
    }
    this.m_pathToFollow = out_ps;
    return true;
  };
  
}

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

function WebOnePointOhWsm()
{
  // Used to extend the prototype of VanillaWsm
  this.VanillaWsm = VanillaWsm;
  this.VanillaWsm();
  
  /**
   * Filters elements to click in a page. See
   * {@link WebStateMachine#isAcceptableClick} for details.
   */
  this.isAcceptableClick = function(path, dom_node)
  {
    // We only say yes if the element is an anchor ("a")
    var pe = new PathExpression(path);
    var ps = pe.getLastSegment();
    return ps.getName().toLowerCase() === "a";
  };
  
  /**
   * Determines if two DOM nodes should be considered equal for the
   * purposes of the exploration. See {@link WebStateMachine.nodesEqual}
   * for details.
   */
  this.nodesEqual = function(n1, n2)
  {
    return n1.getAttribute("url") == n2.getAttribute("url");
  };
  
  /**
   * Processes the DOM tree before saving it to the WSM. See
   * {@link WebStateMachine#abstractNode} for detailed info.
   * <p>
   * In the case of WebPointOhWsm, we only keep:
   * <ol>
   *   <li>The top-level node (&lt;#document&gt;), because it has an
   *     attribute containing the page's URL</li>
   *   <li>The path leading to any anchor elements (&lt;a&gt;), to know
   *     what to click</li>
   * </ol>
   * @param {DomNode} The original DOM tree
   * @return {DomNode} The processed DOM tree
   */
  this.abstractNode = function(dom)
  {
    this.purgeChildren(dom);
    return dom;
  };
  
  /**
   * Removes from the tree all elements that do not lead to an anchor.
   * @param {DomNode} dom The parent DOM node
   * @return {DomNode} The "purged" DOM tree, null if nothing remains from
   *   that operation
   */
  this.purgeChildren = function(dom)
  {
    var out_children = [];
    for (var i = 0; i < dom.m_children.length; i++)
    {
      var child = dom.m_children[i];
      var from_purge = this.purgeChildren(child);
      if (from_purge !== null)
      {
        out_children.push(child);
      }
    }
    dom.m_children = out_children;
    if (dom.m_children.length > 0 || dom.m_name == "A" || dom.m_name == "a")
    {
      return dom;
    }
    return null;
  };
  
}

function WsmHttpRequest()
{
  /**
   * The method of the HTTP request (e.g. GET, POST, etc.)
   * @type {number}
   */
  this.m_method = 0; // GET
  
  /**
   * Determines the method of this HTTP request
   * @return {number} An integer representing the method (codes are
   *  defined below)
   */
  this.getMethod = function()
  {
    return this.m_method;
  };
  
  /**
   * Sets the method of this HTTP request
   * @param {number} m An integer representing the method (codes are
   *  defined below).
   */
  this.setMethod = function(m)
  {
    this.m_method = m;
  };
  
  /**
   * Computes the global size of the request, expressed as an
   * estimate in bytes.
   * @return {number} The estimated global byte size
   */
  this.getByteSize = function()
  {
    // At the moment, we only store the method = 4 bytes
    return 4;
  };

  /**
   * Serializes the content of the object in XML format.
   * @param {string} [indent] String that will be appended at
   *   the beginning of every line of the output (used to indent).
   * @return {string} A string in XML format representing the object's
   *   contents
   */
  this.toXml = function(indent)
  {
    var out = "";
    out += indent + "<request method=\"" + WsmHttpRequest.codeToName(this.m_method) + "\" />";
    return out;
  };
}

/**
 * Converts a method code into a string name
 * @param {number} One of the codes defined below
 * @return {string} The name corresponding to the code
 */
WsmHttpRequest.codeToName = function(code)
{
  var out = "";
  if (code === WsmHttpRequest.GET)
  {
    out = "GET";
  }
  else if (code === WsmHttpRequest.POST)
  {
    out = "POST";
  }
  else if (code === WsmHttpRequest.PUT)
  {
    out = "PUT";
  }
  if (code === WsmHttpRequest.DELETE)
  {
    out = "DELETE";
  }
  return out;
};

/**
 * Constant representing the HTTP GET method
 * @constant
 * @type {number}
 */
WsmHttpRequest.GET = 0;

/**
 * Constant representing the HTTP POST method
 * @constant
 * @type {number}
 */
WsmHttpRequest.POST = 1;

/**
 * Constant representing the HTTP DELETE method
 * @constant
 * @type {number}
 */
WsmHttpRequest.DELETE = 2;

/**
 * Constant representing the HTTP PUT method
 * @constant
 * @type {number}
 */
WsmHttpRequest.PUT = 4;
// }}}

/**
 * Representation of an edge in a web state machine. An edge stores the
 * following elements of information:
 * <ul>
 *  <li>The (x)path in the page leading to the element that was clicked;
 *    this is called the edge's <em>contents</em>. Currently, this
 *    contents is represented as a string version of a {@link
 *    PathExpression} (should be refactored to be a PathExpression
 *    itself)</li>
 *  <li>The node ID of the page one reaches after clicking that element;
 *    this is called the edge's <em>destination</em>. As node IDs in a WSM
 *    are integers, this destination is an integer too.</li>
 *  <li>The type of HTTP request involved in the transition (if any)</li>
 *  <li>Whether the request was done through an Ajax call or a normal
 *    page reload</li>
 * </ul>
 * @constructor
 */
function WsmEdge(id)
{
  /**
   * Unique ID given to each edge
   * @type {number}
   */
  this.m_id = id;
  
  /**
   * Edge contents
   * @type {string}
   */
  this.m_contents = "";
  
  /**
   * Edge destination. This should contain the ID of a WsmNode
   * @type {number}
   */
  this.m_destination = 0;
  
  /**
   * The HTTP request involved in the transition
   * @type {WsmHttpRequest}
   */
  this.m_httpRequest = null;
  
  /**
   * Whether this edge involved an Ajax call (true) or a normal
   * page reload (false)
   * @type {boolean}
   */
  this.m_isAjax = false;
  
  /**
   * List of animation steps concerned with that edge
   * @type {array}
   */
  this.m_animationSteps = [];
  
  /**
   * Get the edge's id
   * @return {number} The edge's id
   */
  this.getId = function()
  {
    return this.m_id;
  };
  
  /**
   * Sets the edge's contents
   * @param {string} contents The edge's contents
   */
  this.setContents = function(contents)
  {
    this.m_contents = contents;
  };

  /**
   * Returns the edge's contents
   * @return {string} The edge's contents
   */
  this.getContents = function()
  {
    return this.m_contents;
  };
  
  /**
   * Determines if an Ajax call is involved in this edge
   * @return {boolean} <tt>true</tt> if an Ajax call occurred,
   *   <tt>false</tt> otherwise
   */
  this.isAjax = function()
  {
    return this.m_isAjax;
  };
  
  /**
   * Sets whether an Ajax call is involved in this edge
   * @param {boolean} <tt>true</tt> if an Ajax call occurred,
   *   <tt>false</tt> otherwise
   */
  this.setAjax = function(b)
  {
    this.m_isAjax = b;
  };
  
  /**
   * Sets the HTTP request associated with the edge
   * @param {WsmHttpRequest} The HTTP request, null to remove
   */
  this.setHttpRequest = function(r)
  {
    if (!(r instanceof WsmHttpRequest))
    {
      console.error("Invalid argument for setHttpRequest");
      return;
    }
    this.m_httpRequest(r);
  };
  
  /**
   * Returns the HTTP request associated with the edge
   * @return {WsmHttpRequest} The HTTP request, null if none
   */
  this.getHttpRequest = function()
  {
    return this.m_httpRequest();
  };
  
  /**
   * Sets the edge's destination
   * @param {number} destination The edge's destination
   */
  this.setDestination = function(destination)
  {
    this.m_destination = destination;
  };

  /**
   * Returns the edge's destination
   * @return {number} The edge's destination
   */
  this.getDestination = function()
  {
    return this.m_destination;
  };

  /**
   * Checks for equality between two edges. <strong>NOTE:</strong> the
   * contents of HTTP requests are not considered in the equality (this is
   * considered as auxiliary information only).
   * @param {WsmEdge} The edge to compare with
   * @return {boolean} <tt>true</tt> if edges are equal, <tt>false</tt>
   *   otherwise
   */
  this.equals = function(e)
  {
    if (e === undefined || e === null)
    {
      return false;
    }
    if (!(e instanceof WsmEdge))
    {
      return false;
    }
    if (e.m_destination !== this.m_destination)
    {
      return false;
    }
    if (e.m_contents !== this.m_contents)
    {
      return false;
    }
    return true;
  };
  /**
   * Adds an animation step to the edge. Each action performed in the
   * exploration is associated to an incrementing integer value. 
   * @param {number} The number of the animation step
   */
  this.addAnimationStep = function(step_no)
  {
    this.m_animationSteps.push(step_no);
  };
  
  /**
   * Outputs the contents of the node as a string in the DOT language
   * @param {number} source_id The ID of the source node for that transition
   * @return {string} The output string in DOT
   */
  this.toDot = function(source_id)
  {
    var out = "";
    var label = this.m_contents;
    var color = "";
    if (this.isAjax()) color = ",color=\"green\"";
    out += source_id + " -> " + this.m_destination + " [label=\"" + label + "\"" + color + "]; // ";
    for (var i = 0; i < this.m_animationSteps.length; i++)
    {
      if (i > 0)
      {
        out += ",";
      }
      out += this.m_animationSteps[i];
    }
    return out;
  };
  
  /**
   * Computes the global size of the EDGE, expressed as an
   * estimate in bytes.
   * @return {number} The estimated global byte size
   */
  this.getByteSize = function()
  {
    // We count four bytes for the ID, plus the size of the path, plus
    // the size of the HTTP request
    var size = 4 + this.m_contents.length;
    if (this.m_httpRequest !== undefined && this.m_httpRequest !== null)
    {
      size += this.m_httpRequest.getByteSize();
    }
    return size;
  };
  
  /**
   * Checks if a list contains the current edge, and returns it if the case
   * @param {array} An array of WsmEdges
   * @return {WsmEdge} The instance of the edge from the array, null if
   *   none is equal to the current edge
   */
  this.elementOf = function(list)
  {
    for (var i = 0; i < list.length; i++)
    {
      var el = list[i];
      if (this.equals(el))
      {
        return el;
      }
    }
    return null;
  };

  /**
   * Serializes the content of the object in XML format.
   * @param {string} [indent] String that will be appended at
   *   the beginning of every line of the output (used to indent).
   * @return {string} A string in XML format representing the object's
   *   contents
   */
  this.toXml = function(indent)
  {
    var i = 0;
    if (indent === undefined)
    {
      indent = "";
    }
    var out = "";
    out += indent + "<edge>\n";
    out += indent + "  <destination>" + this.m_destination + "</destination>\n";
    out += indent + "  <contents>" + this.m_contents + "</contents>\n";
    var aj = "false";
    if (this.m_isAjax)
    {
      aj = "true";
    }
    out += indent + "  <isAjax>";
    if (this.m_isAjax)
    {
      out += "true";
    }
    else
    {
      out += "false";
    }
    out += "</isAjax>\n";
    if (this.m_httpRequest !== undefined && this.m_httpRequest !== null)
    {
      out += this.m_httpRequest.toXml(indent + "    ") + "\n";
    }
    out += indent + "  <visits>\n";
    for (i = 0; i < this.m_animationSteps.length; i++)
    {
      out += indent + "    <visit>" + this.m_animationSteps[i] + "</visit>\n";
    }
    out += indent + "  </visits>\n";
    out += indent + "</edge>\n";
    return out;
  };
  
}

/**
 * Representation of a vertex in a web state machine. A vertex stores the
 * following elements:
 * <ul>
 *   <li>An ID. This numerical value is nonsensical and is only used to
 *     refer uniquely to any vertex stored in the WSM.</li>
 *   <li>An url. The url when the node was created.</li>
 *   <li>A DOM tree, representing the contents of some page in a browser.
 *     This tree is a nested hierarchy of {@link DomNode}s. Node that
 *     DOM nodes themselves can recall whether they have been clicked or
 *     not, through the {@link DomNode#setMark}/{@link DomNode#getMark}</li>
 *     methods.</li>
 * </ul>
 * @constructor
 */
function WsmNode(id)
{
  /**
   * Unique ID given to each node
   * @type {number}
   */
  this.m_id = id;

  /**
   * Url of the page when the node was created
   * @type {string}
   */
  this.m_url = "";
  
  /**
   * Node contents
   * @type {DomNode}
   */
  this.m_contents = 0;
  
  /**
   * Whether the node is completely visited
   * @type {boolean}
   */
  this.m_exhausted = false;
  
  /**
   * A path to the next element of the node that should be clicked.
   * Should be refactored to be a {@link PathExpression} instead of its
   * string rendition.
   * @type {string}
   */
  this.m_nextElementToClick = "";
  
  /**
   * List of animation steps concerned with that node
   * @type {array}
   */
  this.m_animationSteps = [];
  
  /**
   * Get the node's id
   * @return {number} The node's id
   */
  this.getId = function()
  {
    return this.m_id;
  };
  
  /**
   * Returns whether the node is completely visited
   * @return {boolean} true or false, depending on whether the node still
   *   has elements that have not been clicked
   * @method
   * @public
   */
  this.isExhausted = function(is_acceptable_click)
  {
    if (this.m_exhausted === true)
    {
      // Since a node that is exhausted remains so, return true right
      // away
      return true;
    }
    // Otherwise, check if the next click member field is empty
    if (this.m_nextElementToClick !== "")
    {
      // If not, then an element remains to be clicked
      return false;
    }
    // Otherwise, check if an element remains to be clicked
    this.computeNextElement(is_acceptable_click);
    if (this.m_nextElementToClick !== "")
    {
      // This method produced a new next element to click,
      // so we are not exhausted
      return false;
    }
    return true; // If all else fails, we are exhausted
  };
  
  /**
   * Sets the node's contents
   * @param {DomNode} contents The node's contents
   */
  this.setContents = function(contents)
  {
    this.m_contents = contents;
  };

  /**
   * Returns the node's contents
   * @return {DomNode} The node's contents
   */
  this.getContents = function()
  {
    return this.m_contents;
  };

  /**
   * Sets the node's url
   * @param {string} url The node's url
   */
  this.setUrl = function(url)
  {
    this.m_url = url;
  };

  /**
   * Returns the node's url
   * @return {string} The node's url
   */
  this.getUrl = function()
  {
    return this.m_url;
  };
  
  /**
   * Adds an animation step to the node. Each action performed in the
   * exploration is associated to an incrementing integer value. 
   * @param {number} The number of the animation step
   */
  this.addAnimationStep = function(step_no)
  {
    this.m_animationSteps.push(step_no);
  };
  
  /**
   * Resets the click status of all element to "not clicked"
   */
  this.resetClicks = function()
  {
    this.m_exhausted = false;
    this.m_contents.setAllMarks(WsmNode.NOT_CLICKED);
    this.m_nextElementToClick = "";
  };
  
  /**
   * Returns the next element to click.
   * @param {function} is_acceptable_click The filtering function used to
   *   determine whether an element is candidate for the next click. If
   *   nothing is passed, the node will assume all elements can be clicked.
   * @return {string} A path to the next element to click, null if none
   *   could be found (i.e. we have exhausted this page)
   */
  this.getNextElement = function(is_acceptable_click)
  {
    // A next element to click has already been computed, but not
    // queried yet: return it and erase it from memory
    var out_edge = new WsmEdge(0);
    out_edge.setContents(this.m_nextElementToClick);
    this.m_nextElementToClick = "";
    return out_edge;
  };
  
  /**
   * Precomputes the next element to click, in preparation for the next
   * call to {@link getNextElement}. This is an internal method that should
   * not be called directly.
   * @param {function} is_acceptable_click The filtering function used to
   *   determine whether an element is candidate for the next click. If
   *   nothing is passed, the node will assume all elements can be clicked.
   * @private
   */
  this.computeNextElement = function(is_acceptable_click)
  {
    // Otherwise, must compute new next element to click
    if (is_acceptable_click === undefined)
    {
      // No function passed: assume constant true
      is_acceptable_click = function(x, y) { return true; };
    }
    var path_to_next_elem = "dummy";
    var dom = this.m_contents;
    while (path_to_next_elem !== null && path_to_next_elem !== "")
    {
      path_to_next_elem = dom.prefixLookForMark(WsmNode.NOT_CLICKED);
      if (path_to_next_elem === null || path_to_next_elem === "")
      {
        // Node is exhausted
        this.m_exhausted = true;
        return;
      }
      // Mark that element with "clicked" (so we won't select it again)
      var element = dom.getElementFromPathString(path_to_next_elem);
      if (element === null)
      {
        // This should not happen: we got a path from the document itself
        console.error("No element at the end of path"); // Pretty cryptic
        return;
      }
      element.setMark(WsmNode.CLICKED);
      // If element does not pass the filter, do not return it and move on
      // to the next element
      if (is_acceptable_click(path_to_next_elem, dom))
      {
        // Update last click
        this.m_nextElementToClick = path_to_next_elem;
        return;
      }
    }
    // If we made it here, no next click: node is exhausted
    this.m_exhausted = true;
    return;
  };
  
  /**
   * Computes the global size of the node, expressed as an
   * estimate in bytes.
   * @return {number} The estimated global byte size
   */
  this.getByteSize = function()
  {
    // We count four bytes for the ID, plus the size of the DOM
    return 4 + this.m_contents.getByteSize();
  };
  
  /**
   * Computes the size of the DOM tree, expressed in the number of nodes
   * @return {number} The size of the DOM tree
   */
  this.countNodes = function()
  {
    return this.m_contents.countNodes();
  };
  
  /**
   * Outputs the contents of the node as a string in the DOT language
   * @return {string} The output string in DOT
   */
  this.toDot = function()
  {
    var out = "";
    var url = (this.m_url !== "") ? ",URL=\"" + this.m_url + "\"" : "";
    var shape = "circle";
    var label = this.m_id;
    out += this.m_id + "[shape=" + shape + ",label=\"" + label + "\""+ url + "]; // ";
    for (var i = 0; i < this.m_animationSteps.length; i++)
    {
      if (i > 0)
      {
        out += ",";
      }
      out += this.m_animationSteps[i];
    }
    return out;
  };

  /**
   * Serializes the content of the object in XML format.
   * @param {string} [indent] String that will be appended at
   *   the beginning of every line of the output (used to indent).
   * @return {string} A string in XML format representing the object's
   *   contents
   */
  this.toXml = function(indent)
  {
    var i = 0;
    if (indent === undefined)
    {
      indent = "";
    }
    var out = "";
    out += indent + "<node>\n";
    out += indent + "  <id>" + this.m_id + "</id>\n";
    out += indent + "  <visits>\n";
    for (i = 0; i < this.m_animationSteps.length; i++)
    {
      out += indent + "    <visit>" + this.m_animationSteps[i] + "</visit>\n";
    }
    out += indent + "  </visits>\n";
    out += indent + "  <contents>\n";
    out += this.m_contents.toXml(indent + "  ") + "\n";
    out += indent + "  </contents>\n";
    out += indent + "</node>";
    return out;
  };
}

/**
 * Constants used to mark nodes; this one indicates that the node has not
 * been clicked
 * @constant
 * @type {number}
 */
WsmNode.NOT_CLICKED = 0;

/**
 * Constants used to mark nodes; this one indicates that the node has
 * been clicked
 * @constant
 * @type {number}
 */
WsmNode.CLICKED = 1;

// }}}

/**
 * Representation of a sequence of clicks on elements. A path sequence is
 * merely an ordered list of whatever objects one may wish to put (the
 * implemented methods are blind about they type of objects they
 * manipulate).
 * @constructor
 */
function PathSequence(ps)
{
  /**
   * The array containing the elements
   * @type {array}
   */
  this.m_elements = [];
  
  /**
   * Appends an element to the current path sequence
   * @param path_element The element to append
   */
  this.append = function(path_element)
  {
    this.m_elements.push(path_element);
  };
  
  /**
   * Returns the <i>i</i>-th element of the path sequence
   * @param {number} The position of the element to look for
   * @return The first element
   */
  this.getElement = function(i)
  {
    if (i >= this.m_elements.length || i < 0)
    {
      console.error("Calling getElement outside of valid range");
      return;
    }
    return this.m_elements[i];
  };
  
  /**
   * Returns the first element of the path sequence and removes it
   * from the sequence
   * @return The first element
   */
  this.popFirstElement = function()
  {
    if (this.m_elements.length === 0)
    {
      console.error("Calling popFirstElement on an empty sequence");
      return;
    }
    return this.m_elements.shift();
  };
  
  /**
   * Returns the last element of the path sequence and removes it
   * from the sequence
   * @return The last element
   */
  this.popLastElement = function()
  {
    if (this.m_elements.length === 0)
    {
      console.error("Calling popLastElement on an empty sequence");
      return;
    }
    return this.m_elements.pop();
  };
  
  /**
   * Returns the last element of the path sequence
   * @return The last element
   */
  this.peekLastElement = function()
  {
    if (this.m_elements.length === 0)
    {
      console.error("Calling peekLastElement on an empty sequence");
      return;
    }
    return this.m_elements[this.m_elements.length - 1];
  };
  
  /**
   * Determines whether the path sequence is empty
   * @return true if empty, false otherwise
   */
  this.isEmpty = function()
  {
    return this.m_elements.length === 0;
  };
  
  /**
   * Computes the length of the path
   * @return {number} The length of the path
   */
  this.getLength = function()
  {
    return this.m_elements.length;
  };
  
  /**
   * Clears the path sequence
   */
  this.clear = function()
  {
    this.m_elements = [];
  };
  
  /**
   * Outputs a path sequence as a string
   * @return The path sequence represented as a string
   */
  this.toString = function()
  {
    var out = "";
    for (var i = 0; i < this.m_elements.length; i++)
    {
      if (i > 0)
      {
        out += ",";
      }
      var path_element = this.m_elements[i];
      out += path_element.toString();
    }
    return out;
  };
  
  // If a path sequence is passed to the constructor, use it to instantiate
  // a clone of the argument
  if (ps !== undefined && ps instanceof PathSequence)
  {
    for (var i = 0; i < ps.m_elements.length; i++)
    {
      var path_element = ps.m_elements[i];
      this.m_elements.push(path_element);
    }
  }
}

/**
 * A web state machine (WSM) is a directed graph whose nodes are "pages" and
 * whose labelled edges indicate elements of pages whose click induces a
 * transition to a new page. In addition, the WSM also handles the process
 * of determining where a given page lies in the graph, appropriately record 
 * the transitions between them, and suggest what the next click should be.
 * <p>
 * The way in which this is accomplished, as well as the precise definition
 * of page and edge is left to the particular
 * sub-instance of WSM that performs the exploration. Indeed, this class is
 * intended to be "abstract", as a number of methods are left undefined:
 * <ul>
 *   <li>{@link isAcceptableClick}</li>
 *   <li>{@link nodesEqual}</li>
 *   <li>{@link processReset}</li>
 *   <li>{@link abstractNode}</li>
 * </ul>
 * Therefore, one is expected to construct <em>extensions</em> of this class
 * that implement those methods in various ways, effectively creating
 * different types of crawlers. {@link VanillaWsm} is a dummy example of
 * such an extension that can be used as scaffolding for custom WSMs.
 * @constructor
 */
function WebStateMachine()
{
  /**
   * Array containing the WSM's nodes
   * @type {array}
   */
  this.m_nodes = [];
  
  /**
   * Array containing the WSM's edges
   * @type {array}
   */
  this.m_edges = [];
  
  /**
   * The current DOM tree being explored
   * @type {DomNode}
   */
  this.m_domTree = new DomNode();
  
  /**
   * The auto-incrementing value of the animation steps
   * @type {number}
   */
  this.m_animationStepCounter = 0;
  
  /**
   * The numerical ID of the current WSM vertex being explored
   * @type {number}
   */
  this.m_currentNodeId = 0;
  
  /**
   * The expected ID of the next node to be sent to setCurrentDom.
   * This is used when the WSM follows a predefined path, to make sure that
   * the nodes visited are indeed those that were computed when building
   * the path. This value should be null when no particular ID is
   * expected.
   * @type {number}
   */
  this.m_expectedNextNodeId = null;
  
  /**
   * A counter, used to give each node a different ID
   * @type {number}
   */
  this.m_idNodeCounter = 0;
  
  /**
   * A counter, used to give each edge a different ID
   * @type {number}
   */
  this.m_idEdgeCounter = 0;
  
  /**
   * A path sequence through exhausted nodes that the state machine is
   * forced to follow to get to a non-exhausted node
   * @type {PathSequence}
   */
  this.m_pathToFollow = new PathSequence();
  
  /**
   * The complete history of navigation since the beginning of the
   * exploration.
   * @type {PathSequence}
   */
  this.m_pathSinceBeginning = new PathSequence();
  
  /**
   * Whether to evaluate the stop oracle on each node
   * @type {boolean}
   */
  this.m_evaluateStopOracle = true;
  
  /**
   * Whether to evaluate the test oracle on each node
   * @type {boolean}
   */
  this.m_evaluateTestOracle = true;
  
  /**
   * Whether the stop oracle decided we should treat the present page
   * as a dead-end
   * @type {boolean}
   */
  this.m_oracleMustStop = false;
  
  /**
   * Determines if two DOM nodes should be considered equal for the
   * purposes of the exploration. This method is used for two purposes:
   * <ol>
   * <li>To check if the exploration returned to a page that was already
   *   visited</li>
   * <li>To decide whether a new node should be created in the WSM</li>
   * </ol>
   * <p>
   * This function must be implemented by subclasses of WebStateMachine.
   * @param {DomNode} n1 The first node
   * @param {DomNode} n2 The second node
   * @return {boolean} <tt>true</tt> if the two nodes should be considered
   *   equal, <tt>false</tt> otherwise
   */
  this.nodesEqual = function()
  {
    console.error("nodesEqual must be overridden by WSM subclasses");
  };
  
  /**
   * The <em>function</em> that is used to decide whether the path
   * to an element is an acceptable candidate for a click. Passing
   * different functions will preform various forms of filtering on which
   * elements to click in pages.
   * <p>
   * This function must be implemented by subclasses of WebStateMachine.
   * @param {PathExpression} path A path to the element in the DOM tree that
   *    would be clicked
   * @param {DomNode} The DOM tree of the current page
   */
   this.isAcceptableClick = function(path, dom_node)
   {
     console.error("isAcceptableClick must be overridden by WSM subclasses");
   };
  
  /**
   * Handles the situation where the WSM has reached a dead end and is
   * sent back to its initial state; generally, this involves computing
   * a path in the application (i.e. a sequence of clicks on elements of
   * various pages) that the WSM should follow before resuming its normal
   * exploration. This path is stored in the {@link
   * WebStateMachine}'s <code>m_pathToFollow</code> member field, which,
   * when not empty, forces the WSM's {@link WebStateMachine.getNextClick}
   * method to follow what is dictated by that path.
   * <p>
   * This function must be implemented by subclasses of WebStateMachine.
   * @param {number} node_id The ID of the node in the WSM wher the
   *   exploration resumes at
   * @return {boolean} <tt>true</tt> if the exploration must continue,
   *   <tt>false</tt> if there is no unvisited page
   */
   this.processReset = function(node_id)
   {
     console.error("processReset must be overridden by WSM subclasses");
   };
   
  /**
   * Processes a DOM node before saving it to the WSM. This is used to
   * implement <em>abstraction</em>, where not the whole contents of a DOM
   * tree are handled by a WSM.
   * <p>
   * This function must be implemented by subclasses of WebStateMachine.
   * @param {DomNode} The original DOM tree
   * @return {DomNode} The processed DOM tree
   */
   this.abstractNode = function(dom)
   {
     console.error("abstractNode must be overridden by WSM subclasses");
   };
   
  /**
   * Computes the global size of the WSM, expressed as an estimate in bytes.
   * This is done by summing the estimated byte size of each WSM node and
   * of each transition.
   * @return {number} The estimated global byte size of the WSM
   */
  this.getByteSize = function()
  {
    var byte_size = 0, i = 0;
    for (i = 0; i < this.m_nodes.length; i++)
    {
      var node = this.m_nodes[i];
      byte_size += node.getByteSize();
    }
    for (i = 0; i < this.m_edges.length; i++)
    {
      var edge_list = this.m_edges[i];
      if (edge_list === undefined)
      {
        continue;
      }
      for (var j = 0; j < edge_list.length; j++)
      {
        var edge = edge_list[j];
        byte_size += edge.getByteSize();
      }
    }
    return byte_size;
  };
  
  /**
   * Computes the number of nodes currently stored in the WSM
   * @return {number} The number of nodes in the WSM
   */
  this.countNodes = function()
  {
    return this.m_nodes.length;
  };
  
  /**
   * Computes the number of edges (i.e. transitions) currently stored
   * in the WSM
   * @return {number} The number of edges in the WSM
   */
  this.countEdges = function()
  {
    return this.m_edges.length;
  };
  
  /**
   * Resets the click status on all elements of the current DOM node
   * (marks them as unclicked). This should not have to be called, except
   * for debugging.
   */
  this.resetClicks = function()
  {
    var node = this.getNodeFromId(this.m_currentNodeId);
    node.resetClicks();
  };
  
  /**
   * Tells the WSM what the state of the current page is
   * @param {DomNode} d The DOM tree of the current page
   * @param {string} click_path A string indicating the path in the DOM tree
   *   of the <em>previous</em> document that was clicked (thus leading to
   *   the current DOM tree). This argument is optional. When not specified
   *   (or empty), indicates one has "jumped" to the present page, or that
   *   the current page is the start state of the WSM.
   * @param {boolean} isAjax Wether the current document was modified by an
   *   ajax call or not.
   */
  this.setCurrentDom = function(d, click_path, isAjax)
  {
    var dom = null, node = null, tree_id = null;
    if (d instanceof Document)
    {
      dom = DomNode.parseFromDoc(d);
    }
    else if (d instanceof DomNode)
    {
      dom = d;
    }
    else
    {
      console.error("Argument of setCurrentDom is neither a document nor a DomNode");
      return;
    }
    // Send DOM to stop and test oracles
    if (this.m_evaluateStopOracle && WebStateMachine.stop_oracle !== undefined)
    {
      this.m_oracleMustStop = WebStateMachine.stop_oracle(dom);
    }
    if (this.m_evaluateTestOracle && WebStateMachine.test_oracle !== undefined)
    {
      var test_result = WebStateMachine.test_oracle(dom);
      // At the moment, merely report the failure on the console
      if (!test_result)
      {
        console.log("Test oracle returned false!");
      }
    }
    
    // Process the DOM contents with the abstraction method
    dom = this.abstractNode(dom);
    
    // This should be the first node
    if (this.m_nodes.length === 0)
    {
      // This is the first node we register; simply add it and do no
      // further processing
      this.m_idNodeCounter++;
      node = new WsmNode(this.m_idNodeCounter);
      node.setContents(dom);
      node.setUrl(dom.getAttribute("url"));
      node.addAnimationStep(this.m_animationStepCounter++);
      this.m_nodes.push(node);
      this.m_currentNodeId = this.m_idNodeCounter;
      this.m_domTree = dom;
      var new_pe = new WsmEdge();
      new_pe.setDestination(this.m_idNodeCounter);
      new_pe.setAjax(isAjax);
      this.m_pathSinceBeginning.append(new_pe);
      return;
    }
    if (this.m_expectedNextNodeId !== null)
    {
      var nodeFromDom = this.getNodeFromDom(dom);
      if (nodeFromDom === null)
      {
        // Not much to do apart from warning of the discrepancy
        console.error("Sanity check fail: according to computed path, expected node ID was " + this.m_expectedNextNodeId + "; we are rather in a NEW node");
        return;
      }
      var obtained_id = nodeFromDom.getId();
      // Sanity check: make sure that the node we are supposed to land
      // is indeed the one we are in
      if (this.m_expectedNextNodeId != obtained_id)
      {
        // Not much to do apart from warning of the discrepancy
        console.error("Sanity check fail: according to computed path, expected node ID was " + this.m_expectedNextNodeId + "; we are rather in node " + obtained_id);
        return;
      }
    }
    if (this.nodesEqual(this.m_domTree, dom))
    {
      // The page has not changed at all after last click.
      // Nothing to do! (Except add animation step to current node)
      var a_node = this.getNodeFromId(this.m_currentNodeId);
      return;
    }
    // We have a different tree; check if it is already present in the graph
    node = this.getNodeFromDom(dom);
    if (node === null)
    {
      // Tree was not present in the graph; create new node
      node = new WsmNode(++this.m_idNodeCounter);
      node.setContents(dom);
      this.m_nodes.push(node);
    }
    tree_id = node.getId();
    if (click_path !== undefined && click_path !== "" && click_path !== null)
    {
      // Register a transition from the current tree to the new one, only
      // if it is not empty
      var trans = new WsmEdge(++this.m_idEdgeCounter);
      trans.setContents(click_path);
      trans.setDestination(tree_id);
      if (this.m_edges[this.m_currentNodeId] === undefined)
      {
        // Create an array if the slot for source node does not yet exist
        this.m_edges[this.m_currentNodeId] = [];
      }
      var n_edge = trans.elementOf(this.m_edges[this.m_currentNodeId]);
      if (n_edge === null)
      {
        // Add edge if a similar does not already exists from that node
        this.m_edges[this.m_currentNodeId].push(trans);
        n_edge = trans;
      }
      n_edge.addAnimationStep(this.m_animationStepCounter++);
      this.m_pathSinceBeginning.append(n_edge);
    }
    // Update ID of current node
    this.m_domTree = node.getContents();
    this.m_currentNodeId = tree_id;
    node.addAnimationStep(this.m_animationStepCounter++);
  };
  
  /**
   * Looks for a node in the graph based on its DOM contents
   * @param {DomNode} dom_node The DomNode to look for
   * @return {WsmNode} The graph's node whose DOM contents is equal to the
   *   node passed as an argument, null otherwise
   */
  this.getNodeFromDom = function(dom_node)
  {
    for (var i = 0; i < this.m_nodes.length; i++)
    {
      var node = this.m_nodes[i];
      var node_dom = node.getContents();
      if (this.nodesEqual(dom_node, node_dom))
      {
        return node;
      }
    }
    return null;
  };
  
  /**
   * Looks for a node in the graph based on its ID
   * @param {number} id The ID to look for
   * @return {WsmNode} The graph's node with given ID if present, null
   *    otherwise
   */
  this.getNodeFromId = function(id)
  {
    for (var i = 0; i < this.m_nodes.length; i++)
    {
      var node = this.m_nodes[i];
      if (node.getId() == id)
      {
        return node;
      }
    }
    return null;
  };
  
  /**
   * Returns the next element to be clicked in the current DOM, according
   * to the WSM's exploration algorithm. The method returns a
   * {@link WsmEdge}, whose contents must be interpreted as follows:
   * <ul>
   *   <li>When the edge's contents are not empty, they indicate the path
   *     to the element that must be clicked in the current page. In that
   *     scenario, the edge's target member field contains a dummy value
   *     that must be ignored.</li>
   *   <li>When the edge's contents are empty, this indicates that one is to
   *     <em>jump</em> to the next page (i.e. not access it through a click
   *     from the current page). In such a case, the page to jump to is
   *     specified in the edge's target, which yields the node ID of that
   *     page. Additional contents from the page (its contents, URL, etc.)
   *     can then be obtained by retrieving the {@link WsmNode} using
   *     {@link getNodeFromId}. In general, a jump is a reset of the
   *     explored application's state, or the direct invoking of a page
   *     using its URL.
   * </ul>
   * @return {WsmEdge} The edge indicating the next step in the exploration,
   *   null if the exploration is completed
   */
  this.getNextClick = function()
  {
    if (!this.m_pathToFollow.isEmpty())
    {
      // If we are on a forced path, simply follow it by returning
      // the next element dictated by the path
      var path_element = this.m_pathToFollow.popFirstElement();
      this.m_expectedNextNodeId = path_element.getDestination();
      return path_element;
    }
    // Otherwise, we don't expect any particular ID
    this.m_expectedNextNodeId = null;
    var out = "";
    var cur_node = this.getNodeFromId(this.m_currentNodeId);
    if (cur_node === undefined || cur_node === null)
    {
      console.error("Current node is undefined");
      return null;
    }
    // Otherwise, look for next element we haven't marked as clicked
    var dom = cur_node.getContents();
    if (cur_node.isExhausted(this.isAcceptableClick) || this.m_oracleMustStop)
    {
      this.m_oracleMustStop = false;
      // Nothing else to visit in the current node. Compute path to follow
      if (!this.processReset())
      {
        return null;
      }
      // Then return first bit of that path
      var first_bit = this.m_pathToFollow.popFirstElement();
      this.m_expectedNextNodeId = first_bit.getDestination();
      if (this.m_expectedNextNodeId == this.m_currentNodeId)
      {
        // If we must jump to where we already are, indicates we finished
        // the exploration (stop oracles can cause this)
        return null;
      }
      return first_bit;
    }
    // Otherwise, ask node what is the next element to click; we pass to it
    // the filtering function to use
    var path_to_next_elem = cur_node.getNextElement(this.isAcceptableClick);
    return path_to_next_elem;
  };
  
  /**
   * Outputs the contents of the WSM as a string in the DOT language
   * @return {string} The output string in DOT
   */
  this.toDot = function()
  {
    var i = 0;
    var out = "";
    out += "digraph G {\n";
    for (i = 0; i < this.m_nodes.length; i++)
    {
      var node = this.m_nodes[i];
      var node_id = node.getId();
      out += "  " + node.toDot() + "\n";
      var transitions = this.m_edges[node_id];
      if (transitions === undefined)
      {
        continue;
      }
      for (var j = 0; j < transitions.length; j++)
      {
        var edge = transitions[j];
        var dest_id = edge.getDestination();
        var edge_label = edge.getContents();
        out += "  " + edge.toDot(node_id) + "\n";
      }
    }
    // By convention, node 0 never exists and node 1 is the initial state
    out += "  0 [shape=none,label=\"\"]; // 0\n";
    out += "  0 -> 1; // 0\n";
    out += "}";
    return out;
  };
  
  /**
   * Serializes the content of the object in XML format.
   * @param {string} [indent] String that will be appended at
   *   the beginning of every line of the output (used to indent).
   * @return {string} A string in XML format representing the object's
   *   contents
   */
  this.toXml = function(indent)
  {
    var i = 0, node = null;
    if (indent === undefined)
    {
      indent = "";
    }
    var out = "";
    out += indent + "<wsm>\n";
    out += indent + "  <stats>\n";
    out += indent + "    <nodeCount>" + this.countNodes() + "</nodeCount>\n";
    out += indent + "    <edgeCount>" + this.countEdges() + "</edgeCount>\n";
    out += indent + "    <byteSize>" + this.getByteSize() + "</byteSize>\n";
    out += indent + "  </stats>\n";
    out += indent + "  <nodes>\n";
    for (i = 0; i < this.m_nodes.length; i++)
    {
      node = this.m_nodes[i];
      if (node === undefined || node === null)
      {
        continue;
      }
      out += node.toXml(indent + "    ") + "\n";
    }
    out += indent + "  </nodes>\n";
    out += indent + "  <edges>\n";
    for (i = 0; i < this.m_nodes.length; i++)
    {
      node = this.m_nodes[i];
      if (node === undefined || node === null)
      {
        continue;
      }
      var nid = node.getId();
      var edge_list = this.m_edges[nid];
      if (edge_list === undefined || edge_list === null)
      {
        continue;
      }
      out += indent + "    <source id=\"" + nid + "\">\n";
      for (var j = 0; j < edge_list.length; j++)
      {
        var edge = edge_list[j];
        out += edge.toXml(indent + "      ") + "\n";
      }
      out += indent + "    </source>\n";
      out += node.toXml(indent + "    ") + "\n";
    }
    out += indent + "  </edges>\n";
    out += indent + "</wsm>";
    return out;
  };
  
}
