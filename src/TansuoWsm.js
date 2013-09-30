/**
 * Implementation of a Web State Machine using the Tansuo exploration
 * algorithm that simulates backtracking.
 * @constructor
 * @extends NoBacktrackWsm
 */
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
